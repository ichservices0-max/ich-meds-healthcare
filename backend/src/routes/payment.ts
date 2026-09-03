// payment.ts – PayU integration route
import { Router, Request, Response } from 'express';

const router = Router();

// POST /api/payment/init – initialise a PayU transaction
router.post('/init', async (req: Request, res: Response) => {
  try {
    const { amount, email, phone, productInfo } = req.body;
    if (!amount || !email) {
      return res.status(400).json({ error: 'amount and email are required' });
    }

    const payload = {
      key: process.env.PAYU_KEY,
      txnid: `txn_${Date.now()}`,
      amount,
      productinfo: productInfo || 'Payment',
      firstname: email.split('@')[0],
      email,
      phone: phone || '',
      surl: `${process.env.FRONTEND_URL?.split(',')[0]}/payment/success`,
      furl: `${process.env.FRONTEND_URL?.split(',')[0]}/payment/failure`,
    };

    const payuUrl = `${process.env.PAYU_BASE_URL}/payment/op/submit`;
    const response = await fetch(payuUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('PayU init error:', err);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

export default router;
