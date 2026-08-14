import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../lib/prisma';
import { authenticateDoctor } from '../middleware/auth';

const router = Router();

// All message routes require doctor authentication
router.use(authenticateDoctor);

// ─── GET /api/doctor/messages/:appointmentId ─────────────────────────────────
router.get('/:appointmentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = (req as any).user!.id;
    const { appointmentId } = req.params;

    // Verify the doctor owns this appointment
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, doctorId },
    });

    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found or access denied.' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { appointmentId },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json({ messages });
  } catch (error) {
    console.error('Get doctor messages error:', error);
    res.status(500).json({ error: 'Could not fetch messages.' });
  }
});

// ─── Multer Configuration for Chats ────────────────────────────────────────────
const CHAT_UPLOADS_DIR = process.env.VERCEL
  ? path.join('/tmp', 'uploads', 'chats')
  : path.resolve(__dirname, '../../uploads/chats');

try {
  if (!fs.existsSync(CHAT_UPLOADS_DIR)) {
    fs.mkdirSync(CHAT_UPLOADS_DIR, { recursive: true });
  }
} catch (e) {
  // ignore in read-only environment
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, CHAT_UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `chat-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ─── POST /api/doctor/messages/upload ─────────────────────────────────────────
router.post(
  '/upload',
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded.' });
        return;
      }
      // Return the public URL for the uploaded file
      const fileUrl = `/uploads/chats/${req.file.filename}`;
      res.status(201).json({ success: true, fileUrl });
    } catch (error) {
      console.error('Doctor chat file upload error:', error);
      res.status(500).json({ error: 'File upload failed.' });
    }
  }
);

export default router;
