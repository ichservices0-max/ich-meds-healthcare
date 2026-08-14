import express from 'express';
import prisma from '../lib/prisma';
import { authenticateDoctor } from '../middleware/auth';

const router = express.Router();

// @route   GET /api/doctor/reviews
// @desc    Get all reviews for the logged-in doctor
router.get('/', authenticateDoctor, async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { doctorId: req.user.id },
      include: {
        patient: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(reviews);
  } catch (error) {
    console.error('Fetch Reviews Error:', error);
    res.status(500).json({ error: 'Server error fetching reviews' });
  }
});

export default router;
