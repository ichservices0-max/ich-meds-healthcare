import { verifyReverseHash } from '../routes/payment';
import crypto from 'crypto';
import request from 'supertest';
import express from 'express';
import paymentRoutes from '../routes/payment';

// Mock prisma and auth middleware
jest.mock('../lib/prisma', () => ({
  payment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  appointment: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(async (ops) => Promise.all(ops)),
}));

jest.mock('../middleware/auth', () => ({
  protectPatient: (req: any, res: any, next: any) => {
    req.user = { id: 'patient_1' };
    next();
  }
}));

import prisma from '../lib/prisma';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/payment', paymentRoutes);

describe('PayU Integration Tests', () => {
  const salt = 'TEST_SALT';
  const key = 'TEST_KEY';

  beforeAll(() => {
    process.env.PAYU_SALT = salt;
    process.env.PAYU_KEY = key;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Hash Verification Unit Tests', () => {
    it('should verify correct reverse hash', () => {
      const txnid = 'txn_123';
      const amount = '500.00';
      const status = 'success';
      const productinfo = 'Appointment';
      const firstname = 'John';
      const email = 'john@example.com';
      const udf1 = 'app_123';
      
      const hashString = `${salt}|${status}||||||||||${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
      const hash = crypto.createHash('sha512').update(hashString).digest('hex');

      const body = { key, txnid, amount, productinfo, firstname, email, udf1, status, hash };
      expect(verifyReverseHash(body, salt)).toBe(true);
    });

    it('should fail with invalid hash', () => {
      const body = { key, txnid: '123', amount: '500', productinfo: 'A', firstname: 'B', email: 'c', status: 'success', hash: 'invalid' };
      expect(verifyReverseHash(body, salt)).toBe(false);
    });
  });

  describe('POST /api/payment/create-payment', () => {
    it('should create payment and return hash fields', async () => {
      (prisma.appointment.findFirst as jest.Mock).mockResolvedValue({
        id: 'app_123',
        patientId: 'patient_1',
        fee: 500.00,
        patient: { name: 'John Doe', email: 'john@example.com' }
      });

      const res = await request(app)
        .post('/api/payment/create-payment')
        .send({ appointmentId: 'app_123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.fields.hash).toBeDefined();
      expect(res.body.fields.txnid).toMatch(/^txn_app_123_/);
      expect(prisma.payment.create).toHaveBeenCalled();
    });
  });

  describe('POST /api/payment/success', () => {
    it('should reject mismatching amount', async () => {
      const txnid = 'txn_123';
      const amount = '400.00';
      const status = 'success';
      const productinfo = 'Appointment';
      const firstname = 'John';
      const email = 'john@example.com';
      const udf1 = 'app_123';
      
      const hashString = `${salt}|${status}||||||||||${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
      const hash = crypto.createHash('sha512').update(hashString).digest('hex');

      (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
        txnid,
        amount: 500.00, // Different amount
        status: 'INITIATED'
      });

      const res = await request(app)
        .post('/api/payment/success')
        .type('form')
        .send({ key, txnid, amount, status, hash, productinfo, firstname, email, udf1 });

      expect(res.status).toBe(400);
      expect(res.text).toBe('Amount mismatch');
      expect(prisma.payment.update).not.toHaveBeenCalled();
    });

    it('should handle verified successful callback and be idempotent', async () => {
      const txnid = 'txn_123';
      const amount = '500.00';
      const status = 'success';
      const productinfo = 'Appointment';
      const firstname = 'John';
      const email = 'john@example.com';
      const udf1 = 'app_123';
      
      const hashString = `${salt}|${status}||||||||||${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
      const hash = crypto.createHash('sha512').update(hashString).digest('hex');

      // 1. Initial success callback
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
        txnid,
        amount: 500.00,
        status: 'INITIATED',
        appointmentId: 'app_123'
      });

      let res = await request(app)
        .post('/api/payment/success')
        .type('form')
        .send({ key, txnid, amount, status, hash, productinfo, firstname, email, udf1 });

      expect(res.status).toBe(302); // redirect
      expect(prisma.payment.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'SUCCESS' })
      }));
      expect(prisma.appointment.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { paymentStatus: 'PAID', status: 'CONFIRMED' }
      }));

      jest.clearAllMocks();

      // 2. Duplicate success callback (Idempotency)
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
        txnid,
        amount: 500.00,
        status: 'SUCCESS', // Already marked success
        appointmentId: 'app_123'
      });

      res = await request(app)
        .post('/api/payment/success')
        .type('form')
        .send({ key, txnid, amount, status, hash, productinfo, firstname, email, udf1 });

      expect(res.status).toBe(302); // Still redirects to success
      expect(prisma.payment.update).not.toHaveBeenCalled(); // No double update
    });
  });

  describe('POST /api/payment/failure', () => {
    it('should handle failure callback without marking paid', async () => {
      const txnid = 'txn_123';
      const amount = '500.00';
      const status = 'failure';
      const productinfo = 'Appointment';
      const firstname = 'John';
      const email = 'john@example.com';
      const udf1 = 'app_123';
      
      const hashString = `${salt}|${status}||||||||||${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
      const hash = crypto.createHash('sha512').update(hashString).digest('hex');

      (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
        txnid,
        amount: 500.00,
        status: 'INITIATED'
      });

      const res = await request(app)
        .post('/api/payment/failure')
        .type('form')
        .send({ key, txnid, amount, status, hash, productinfo, firstname, email, udf1 });

      expect(res.status).toBe(302);
      expect(prisma.payment.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'FAILED' })
      }));
      expect(prisma.appointment.update).not.toHaveBeenCalled();
    });
  });
});
