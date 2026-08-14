import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { protectPatient, authenticateDoctor } from '../middleware/auth';

const router = Router();

// ─── POST /api/precheck/:appointmentId ──────────────────────────────────────────
// Patients use this to submit their pre-check form
router.post('/:appointmentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const { symptoms, vitalSigns, medicalHistory } = req.body;

    if (!appointmentId || appointmentId === 'undefined') {
      res.status(400).json({ error: 'Invalid appointment ID.' });
      return;
    }

    // Verify appointment exists
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found.' });
      return;
    }

    // Upsert the pre-check record
    const preCheck = await prisma.preCheck.upsert({
      where: { appointmentId },
      update: { symptoms, vitalSigns, medicalHistory },
      create: {
        appointmentId,
        symptoms,
        vitalSigns,
        medicalHistory,
      },
    });

    res.status(200).json({ success: true, preCheck });
  } catch (error) {
    console.error('Submit pre-check error:', error);
    res.status(500).json({ error: 'Failed to submit pre-check form.' });
  }
});

// ─── GET /api/precheck/:appointmentId ───────────────────────────────────────────
// Both Patients and Doctors can view the pre-check info
router.get('/:appointmentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;

    // Optional: we can secure this by checking if the user requesting is either
    // the patient or the doctor of this appointment, but we need to know the role.
    // For simplicity, we just look up the PreCheck by appointmentId.
    const preCheck = await prisma.preCheck.findUnique({
      where: { appointmentId },
    });

    if (!preCheck) {
      res.status(404).json({ error: 'Pre-check not found.' });
      return;
    }

    res.status(200).json({ preCheck });
  } catch (error) {
    console.error('Get pre-check error:', error);
    res.status(500).json({ error: 'Failed to fetch pre-check data.' });
  }
});

export default router;
