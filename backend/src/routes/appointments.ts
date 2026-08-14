import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { protectPatient } from '../middleware/auth';

const router = Router();

// All appointment routes require authentication
router.use(protectPatient);

// ─── POST /api/appointments ───────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const patientId = req.user!.id;
    const { doctorId, sessionId, notes, type } = req.body;

    if (!doctorId || !sessionId) {
      res.status(400).json({ error: 'doctorId and sessionId are required.' });
      return;
    }

    // Validate session exists
    const session = await prisma.doctorSession.findUnique({
      where: { id: sessionId },
      include: {
        _count: { select: { appointments: true } }
      }
    });
    
    if (!session) {
      res.status(404).json({ error: 'Session not found.' });
      return;
    }
    
    if (session.doctorId !== doctorId) {
      res.status(400).json({ error: 'Session does not belong to the specified doctor.' });
      return;
    }

    if (session._count.appointments >= session.maxTokens) {
      res.status(409).json({ error: 'This session is fully booked (no tokens left).' });
      return;
    }

    // Validate doctor exists
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      res.status(404).json({ error: 'Doctor not found.' });
      return;
    }

    // Assign next available token number
    const tokenNumber = session._count.appointments + 1;

    // Atomic: create appointment + create notification
    const [appointment] = await prisma.$transaction([
      prisma.appointment.create({
        data: {
          patientId,
          doctorId,
          sessionId,
          tokenNumber,
          notes: notes ?? null,
          status: type === 'video' ? 'PENDING' : 'WAITING',
          type: type || 'in-person',
        },
        include: {
          doctor: {
            select: { id: true, name: true, specialty: true, imageUrl: true },
          },
          session: true,
        },
      }),
      prisma.notification.create({
        data: {
          patientId,
          title: 'Appointment Booked',
          body: `Your appointment with Dr. ${doctor.name} has been booked successfully.`,
          type: 'APPOINTMENT',
          isRead: false,
        },
      }),
    ]);

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Could not create appointment.' });
  }
});

// ─── GET /api/appointments ────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const patientId = req.user!.id;

    const appointments = await prisma.appointment.findMany({
      where: { patientId },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
            imageUrl: true,
            city: true,
          },
        },
        session: true,
        prescription: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Could not fetch appointments.' });
  }
});

// ─── GET /api/appointments/:id ────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const appointment = await prisma.appointment.findFirst({
      where: { 
        id,
        OR: [
          { patientId: userId },
          { doctorId: userId }
        ]
      },
      include: {
        doctor: true,
        session: true,
        prescription: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found.' });
      return;
    }

    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ error: 'Could not fetch appointment.' });
  }
});

// ─── PATCH /api/appointments/:id/status ──────────────────────────────────────
router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const patientId = req.user!.id;
    const { id } = req.params;
    const { status } = req.body;

    // Patients may only cancel their appointments
    const PATIENT_ALLOWED_STATUSES = ['CANCELLED'];

    if (!status || !PATIENT_ALLOWED_STATUSES.includes(status)) {
      res.status(400).json({
        error: `Patients may only set status to: ${PATIENT_ALLOWED_STATUSES.join(', ')}.`,
      });
      return;
    }

    const appointment = await prisma.appointment.findFirst({
      where: { id, patientId },
    });

    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found.' });
      return;
    }

    if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED') {
      res.status(409).json({ error: `Cannot change status of a ${appointment.status} appointment.` });
      return;
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        doctor: { select: { id: true, name: true, specialty: true } },
        session: true,
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ error: 'Could not update appointment status.' });
  }
});

// ─── DELETE /api/appointments/:id ─────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const patientId = req.user!.id;
    const { id } = req.params;

    const appointment = await prisma.appointment.findFirst({
      where: { id, patientId },
      include: { session: true },
    });

    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found.' });
      return;
    }

    if (appointment.status === 'COMPLETED') {
      res.status(409).json({ error: 'Cannot cancel a completed appointment.' });
      return;
    }

    // Atomic: cancel appointment
    await prisma.$transaction([
      prisma.appointment.update({
        where: { id },
        data: { status: 'CANCELLED' },
      }),
    ]);

    res.status(200).json({ success: true, message: 'Appointment cancelled successfully.' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ error: 'Could not cancel appointment.' });
  }
});

export default router;
