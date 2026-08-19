import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { authenticateDoctor } from '../middleware/auth';

const router = express.Router();

// @route   PUT /api/doctor/profile/update
// @desc    Update doctor profile details
router.put('/update', authenticateDoctor, async (req, res) => {
  try {
    const {
      name, qualification, degree, experience, specialty,
      fee, bio, languagesSpoken, clinicName, clinicAddress,
      city, state, country
    } = req.body;

    const updated = await prisma.doctor.update({
      where: { id: req.user.id },
      data: {
        name,
        qualification,
        degree,
        experience: experience ? parseInt(experience) : undefined,
        specialty,
        fee: fee ? parseFloat(fee) : undefined,
        bio,
        languagesSpoken: Array.isArray(languagesSpoken) ? languagesSpoken : undefined,
        clinicName,
        clinicAddress,
        city,
        state,
        country
      }
    });

    const { passwordHash: _, ...doctorData } = updated;
    res.json({ doctor: doctorData });
  } catch (error) {
    console.error('Update Doctor Profile Error:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// @route   POST /api/doctor/profile/change-password
// @desc    Change doctor password
router.post('/change-password', authenticateDoctor, async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, doctor.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.doctor.update({
      where: { id: doctorId },
      data: { passwordHash: hashedPassword },
    });

    res.json({ message: 'Password has been updated successfully.' });
  } catch (error) {
    console.error('Change Doctor Password Error:', error);
    res.status(500).json({ error: 'Server error changing password' });
  }
});

export default router;
