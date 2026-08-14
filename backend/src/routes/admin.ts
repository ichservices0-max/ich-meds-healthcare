import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

// Admin Login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, role: 'admin' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email } });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get all doctors (Admin Protected)
router.get('/doctors', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    
    let whereClause = {};
    if (status && typeof status === 'string') {
      whereClause = { verificationStatus: status.toUpperCase() };
    }

    const doctors = await prisma.doctor.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        specialty: true,
        verificationStatus: true,
        createdAt: true,
        registrationNumber: true,
        documents: true
      }
    });

    res.json({ data: doctors });
  } catch (error) {
    console.error('Fetch doctors error:', error);
    res.status(500).json({ error: 'Server error fetching doctors' });
  }
});

// Verify Doctor
router.patch('/doctors/:id/verify', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'APPROVED' or 'REJECTED'

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const doctor = await prisma.doctor.update({
      where: { id },
      data: { verificationStatus: status }
    });

    res.json({ data: doctor, message: `Doctor successfully ${status}` });
  } catch (error) {
    console.error('Verify doctor error:', error);
    res.status(500).json({ error: 'Server error updating doctor status' });
  }
});

export default router;
