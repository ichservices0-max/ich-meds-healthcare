import express from 'express';
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

export default router;
