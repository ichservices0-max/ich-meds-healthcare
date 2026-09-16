import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import express from 'express';
import prisma from '../lib/prisma';
import { protectPatient } from '../middleware/auth';

const router = Router();

// POST /api/payment/create-payment
router.post('/create-payment', protectPatient, async (req: Request, res: Response): Promise<void> => {
  try {
    const patientId = req.user!.id;
    const { appointmentId } = req.body;

    if (!appointmentId) {
      res.status(400).json({ error: 'appointmentId is required' });
      return;
    }

    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, patientId },
      include: { doctor: true, patient: true },
    });

    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found.' });
      return;
    }

    const amount = appointment.fee ?? appointment.doctor.fee;
    // Validate the amount – must be a finite number greater than zero
    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ error: 'Invalid amount for this appointment.' });
      return;
    }
    // Format amount for PayU (two decimal places)
    const formattedAmount = Number(amount).toFixed(2);

    const txnid = `txn_${appointmentId.substring(0,8)}_${Date.now()}`;
    const key = process.env.PAYU_KEY || '';
    const salt = process.env.PAYU_SALT || '';
    
    // UDF1 = appointmentId
    const productinfo = 'Appointment';
    const firstname = appointment.patient.name.split(' ')[0] || 'Patient';
    const email = appointment.patient.email;
    const phone = appointment.patient.phone || '';
    const udf1 = appointmentId;
    const udf2 = '';
    const udf3 = '';
    const udf4 = '';
    const udf5 = '';

    // SHA-512 hash: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
    const hashString = `${key}|${txnid}|${formattedAmount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    const frontendUrl = process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:3000';
    const surl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payment/success`;
    const furl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payment/failure`;

    const payuFields = {
      key,
      txnid,
      amount: formattedAmount,
      productinfo,
      firstname,
      email,
      phone,
      surl,
      furl,
      hash,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      service_provider: 'payu_paisa'
    };

    // Upsert or create Payment
    await prisma.payment.create({
      data: {
        txnid,
        appointmentId,
        amount,
        status: 'INITIATED',
        mode: 'PAYU',
        payuRequest: payuFields,
      },
    });

    res.status(200).json({ success: true, fields: payuFields });
  } catch (err) {
    console.error('PayU create-payment error:', err);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

// Helper for reverse hash verification
export function verifyReverseHash(body: any, salt: string): boolean {
  // SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
  const { key, txnid, amount, productinfo, firstname, email, udf1, udf2, udf3, udf4, udf5, status, hash } = body;
  const hashString = `${salt}|${status}||||||${udf5 || ''}|${udf4 || ''}|${udf3 || ''}|${udf2 || ''}|${udf1 || ''}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  const computedHash = crypto.createHash('sha512').update(hashString).digest('hex');
  
  if (body.additionalCharges) {
      const hashStringWithCharges = `${body.additionalCharges}|${salt}|${status}||||||${udf5 || ''}|${udf4 || ''}|${udf3 || ''}|${udf2 || ''}|${udf1 || ''}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
      const computedHashWithCharges = crypto.createHash('sha512').update(hashStringWithCharges).digest('hex');
      return computedHash === hash || computedHashWithCharges === hash;
  }
  
  return computedHash === hash;
}

// POST /api/payment/success
router.post('/success', express.urlencoded({ extended: true }), async (req: Request, res: Response): Promise<void> => {
  try {
    const salt = process.env.PAYU_SALT || '';
    const key = process.env.PAYU_KEY || '';
    
    const isValid = verifyReverseHash(req.body, salt);
    if (!isValid) {
      res.status(400).send('Invalid signature');
      return;
    }

    if (req.body.key !== key) {
      res.status(400).send('Invalid merchant key');
      return;
    }

    const { txnid, amount, status, mihpayid } = req.body;
    
    const payment = await prisma.payment.findUnique({ where: { txnid } });
    if (!payment) {
      res.status(404).send('Transaction not found');
      return;
    }

    // Verify amount matches exactly
    if (parseFloat(amount) !== payment.amount) {
      res.status(400).send('Amount mismatch');
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:3000';

    if (payment.status === 'SUCCESS') {
      res.redirect(`${frontendUrl}/payment-success?txnid=${txnid}`);
      return;
    }

    if (status === 'success') {
      await prisma.$transaction([
        prisma.payment.update({
          where: { txnid },
          data: { status: 'SUCCESS', payuResponse: req.body, mihpayid },
        }),
        prisma.appointment.update({
          where: { id: payment.appointmentId! },
          data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
        })
      ]);
      res.redirect(`${frontendUrl}/payment-success?txnid=${txnid}`);
      return;
    }

    res.redirect(`${frontendUrl}/payment-failure?txnid=${txnid}`);
  } catch (err) {
    console.error('PayU success error:', err);
    res.status(500).send('Internal Server Error');
  }
});

// POST /api/payment/failure
router.post('/failure', express.urlencoded({ extended: true }), async (req: Request, res: Response): Promise<void> => {
  try {
    const salt = process.env.PAYU_SALT || '';
    const { txnid, mihpayid } = req.body;
    
    const isValid = verifyReverseHash(req.body, salt);
    
    if (txnid) {
      const payment = await prisma.payment.findUnique({ where: { txnid } });
      if (payment && payment.status !== 'SUCCESS') {
         await prisma.payment.update({
           where: { txnid },
           data: { 
             status: isValid ? 'FAILED' : 'UNVERIFIED_FAILURE',
             payuResponse: req.body, 
             mihpayid 
           }
         });
      }
    }

    const frontendUrl = process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/payment-failure?txnid=${txnid}`);
  } catch (err) {
    console.error('PayU failure error:', err);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
