import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { protectPatient } from '../middleware/auth';
import { authIpLimiter, authAccountLimiter } from '../middleware/rateLimiter';

const router = Router();

// ─── Helper: sign JWT ─────────────────────────────────────────────────────────
const signToken = (id: string): string => {
  const secret = process.env.JWT_SECRET || 'hc-jwt-secret-2026-antigravity-secure-key-xK9mP2';
  return jwt.sign({ id }, secret, { expiresIn: '7d' });
};

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', authIpLimiter, authAccountLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const name = req.body.name;
    const email = req.body.email?.trim()?.toLowerCase();
    const phone = req.body.phone || req.body.mobile;
    const password = req.body.password;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      res.status(400).json({ error: 'name, email, phone, and password are required.' });
      return;
    }

    if (typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format.' });
      return;
    }

    // Check for duplicates
    const existingEmail = await prisma.patient.findUnique({ where: { email } });
    if (existingEmail) {
      res.status(409).json({ error: 'Email is already registered.' });
      return;
    }

    const existingPhone = await prisma.patient.findUnique({ where: { phone } });
    if (existingPhone) {
      res.status(409).json({ error: 'Phone number is already registered.' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create patient
    const patient = await prisma.patient.create({
      data: { name, email, phone, passwordHash: hashedPassword },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    const token = signToken(patient.id);

    res.status(201).json({ token, patient });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', authIpLimiter, authAccountLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const rawEmail = req.body.email;
const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
const password = req.body.password;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const patient = await prisma.patient.findUnique({ where: { email } });
    if (!patient) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, patient.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const { passwordHash: _pw, ...patientData } = patient;
    const token = signToken(patient.id);

    res.status(200).json({ token, patient: patientData });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post('/forgot-password', authIpLimiter, authAccountLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }

    const patient = await prisma.patient.findUnique({ where: { email } });
    if (!patient) {
      // Return success even if not found (security best practice)
      res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
      return;
    }

    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // +1 hour

    await prisma.passwordReset.create({
      data: {
        token: resetToken,
        patientId: patient.id,
        expiresAt,
        usedAt: null,
      },
    });

    // In production, send resetToken via email. Here we return it for testing.
    res.status(200).json({
      message: 'Password reset token generated. Check your email.',
      resetToken, // Remove in production — rely on email delivery
    });
  } catch (error) {
    console.error('Forgot-password error:', error);
    res.status(500).json({ error: 'Could not process request. Please try again.' });
  }
});

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
router.post('/reset-password', authIpLimiter, authAccountLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: 'token and newPassword are required.' });
      return;
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        token,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetRecord) {
      res.status(400).json({ error: 'Invalid or expired reset token.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.patient.update({
        where: { id: resetRecord.patientId },
        data: { passwordHash: hashedPassword },
      }),
      prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset-password error:', error);
    res.status(500).json({ error: 'Could not reset password. Please try again.' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', protectPatient, async (req: Request, res: Response): Promise<void> => {
  try {
    const patientId = req.user!.id;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        bloodGroup: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!patient) {
      res.status(404).json({ error: 'Patient not found.' });
      return;
    }

    res.status(200).json({ patient });
  } catch (error) {
    console.error('Get /me error:', error);
    res.status(500).json({ error: 'Could not fetch profile.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', protectPatient, async (req: Request, res: Response): Promise<void> => {
  try {
    const patientId = req.user!.id;
    const { name, phone, dateOfBirth, bloodGroup, address } = req.body;

    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        name,
        phone,
        dateOfBirth,
        bloodGroup,
        address,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        bloodGroup: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({ patient: updatedPatient });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Could not update profile.' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', protectPatient, async (req: Request, res: Response): Promise<void> => {
  try {
    const patientId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required.' });
      return;
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      res.status(404).json({ error: 'Patient not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, patient.passwordHash);
    if (!isMatch) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.patient.update({
      where: { id: patientId },
      data: { passwordHash: hashedPassword },
    });

    res.status(200).json({ message: 'Password has been updated successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Could not change password. Please try again.' });
  }
});

export default router;
