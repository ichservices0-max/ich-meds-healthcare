import express from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import prisma from '../lib/prisma';
import { authenticateDoctor } from '../middleware/auth';
import { getIO } from '../socket';

const router = express.Router();

// ─── Multer Configuration ──────────────────────────────────────────────────────
const UPLOADS_DIR = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.resolve(__dirname, '../../uploads');

try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e) {
  // ignore in read-only environment
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `prescription-${uniqueSuffix}${ext}`);
  },
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const fileFilter = (
  _req: express.Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, WEBP, and PNG files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


// @route   GET /api/doctor/appointments
// @desc    Get all appointments for the logged-in doctor
router.get('/', authenticateDoctor, async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { doctorId: req.user.id },
      include: {
        patient: { select: { id: true, name: true, email: true, phone: true } },
        session: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(appointments);
  } catch (error) {
    console.error('Fetch Appointments Error:', error);
    res.status(500).json({ error: 'Server error fetching appointments' });
  }
});

// @route   PUT /api/doctor/appointments/:id/status
// @desc    Update appointment status (Accept, Reject, Complete)
router.put('/:id/status', authenticateDoctor, async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    
    console.log(`[DEBUG] PUT /:id/status called with id=${id}, status=${status}`);

    if (!['WAITING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'].includes(status)) {
      console.log(`[DEBUG] Returning 400 because status '${status}' is invalid`);
      return res.status(400).json({ error: 'Invalid status' });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment || appointment.doctorId !== req.user.id) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        patient: { select: { id: true, name: true, email: true } },
        session: true,
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update Appointment Error:', error);
    res.status(500).json({ error: 'Server error updating appointment' });
  }
});

// ─── GET /api/doctor/appointments/sessions ─────────────────────────────────────
// @desc    Get all sessions for the logged-in doctor
router.get('/sessions', authenticateDoctor, async (req, res) => {
  try {
    const sessions = await prisma.doctorSession.findMany({
      where: { doctorId: req.user.id },
      orderBy: { date: 'asc' },
      include: {
        appointments: {
          orderBy: { tokenNumber: 'asc' }
        }
      }
    });
    res.json(sessions);
  } catch (error) {
    console.error('Fetch Sessions Error:', error);
    res.status(500).json({ error: 'Server error fetching sessions' });
  }
});

// ─── POST /api/doctor/appointments/sessions ────────────────────────────────────
// @desc    Add a new session for the logged-in doctor
router.post('/sessions', authenticateDoctor, async (req, res) => {
  try {
    const { date, sessionType, startTime, endTime, maxTokens } = req.body;
    
    if (!date || !sessionType || !startTime || !endTime || !maxTokens) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const session = await prisma.doctorSession.create({
      data: {
        doctorId: req.user.id,
        date: new Date(date),
        sessionType,
        startTime,
        endTime,
        maxTokens: parseInt(maxTokens, 10),
        currentToken: 0,
      },
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('Add Session Error:', error);
    res.status(500).json({ error: 'Server error adding session' });
  }
});

// ─── PATCH /api/doctor/appointments/sessions/:id/action ────────────────────────
// @desc    Perform queue action (CALL_NEXT, START, COMPLETE, SKIP)
router.patch('/sessions/:id/action', authenticateDoctor, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, tokenNumber } = req.body;
    
    const session = await prisma.doctorSession.findUnique({
      where: { id },
      include: { appointments: true },
    });

    if (!session || session.doctorId !== req.user.id) {
      return res.status(404).json({ error: 'Session not found' });
    }

    let targetToken = tokenNumber || session.currentToken;

    if (action === 'CALL_NEXT') {
      targetToken = session.currentToken + 1;
      const maxBookedToken = session.appointments.reduce((max, appt) => Math.max(max, appt.tokenNumber), 0);
      
      if (targetToken > maxBookedToken) {
        return res.status(400).json({ error: 'No more patients in queue' });
      }
      
      await prisma.$transaction([
        prisma.doctorSession.update({
          where: { id },
          data: { currentToken: targetToken },
        }),
        prisma.appointment.updateMany({
          where: { sessionId: id, tokenNumber: targetToken },
          data: { status: 'CALLED' },
        })
      ]);
    } else if (action === 'START') {
      await prisma.appointment.updateMany({
        where: { sessionId: id, tokenNumber: targetToken },
        data: { status: 'IN_CONSULTATION' },
      });
    } else if (action === 'COMPLETE') {
      await prisma.appointment.updateMany({
        where: { sessionId: id, tokenNumber: targetToken },
        data: { status: 'COMPLETED' },
      });
    } else if (action === 'SKIP') {
      await prisma.appointment.updateMany({
        where: { sessionId: id, tokenNumber: targetToken },
        data: { status: 'NO_SHOW' },
      });
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    try {
      const io = getIO();
      const updatedSession = await prisma.doctorSession.findUnique({ where: { id } });
      io.to(`session_${id}`).emit('queue-updated', { 
        sessionId: id,
        currentToken: updatedSession?.currentToken || session.currentToken 
      });
    } catch (socketErr) {
      console.error('Socket error emitting queue update:', socketErr);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Queue Action Error:', error);
    res.status(500).json({ error: 'Server error processing queue action' });
  }
});

// ─── POST /api/doctor/appointments/:id/prescription/extract ───────────────────
// @desc    Upload image and extract text using AI
router.post('/:id/prescription/extract', authenticateDoctor, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true }
    });

    if (!appointment || appointment.doctorId !== req.user.id) {
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Convert file to base64 for Gemini
    const fileBytes = fs.readFileSync(req.file.path);
    const base64Image = fileBytes.toString('base64');
    const mimeType = req.file.mimetype;

    // Call Gemini API to extract prescription data
    const prompt = `You are a medical assistant OCR AI. 
Extract the handwritten prescription details from the following image. 
Format it clearly with Markdown. Include:
1. Medicines (Name, Dosage, Frequency, Duration)
2. Instructions
3. Any other relevant notes.
Return ONLY the formatted text.`;

    let digitalText = '';
    try {
      const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [
              prompt,
              { inlineData: { data: base64Image, mimeType: mimeType } }
          ]
      });
      digitalText = response.text || 'Could not extract text.';
    } catch (aiError: any) {
      console.warn('Gemini AI failed to extract text:', aiError?.message || aiError);
      digitalText = 'Failed to automatically extract text (API Limit reached). Please type the prescription details manually.';
    }
    const imageUrl = `/uploads/${req.file.filename}`;

    res.json({ digitalText, imageUrl });
  } catch (error) {
    console.error('Extract Prescription Error:', error);
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: 'Server error extracting prescription' });
  }
});

// ─── POST /api/doctor/appointments/:id/prescription/save ──────────────────────
// @desc    Save the digitized prescription
router.post('/:id/prescription/save', authenticateDoctor, async (req, res) => {
  try {
    const { id } = req.params;
    const { digitalText, imageUrl } = req.body;

    if (!digitalText) {
      return res.status(400).json({ error: 'Digital text is required' });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment || appointment.doctorId !== req.user.id) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Upsert the prescription
    const prescription = await prisma.prescription.upsert({
      where: { appointmentId: id },
      update: {
        digitalText,
        imageUrl,
      },
      create: {
        appointmentId: id,
        doctorId: req.user.id,
        patientId: appointment.patientId,
        digitalText,
        imageUrl,
      }
    });

    res.json(prescription);
  } catch (error) {
    console.error('Save Prescription Error:', error);
    res.status(500).json({ error: 'Server error saving prescription' });
  }
});

export default router;
