import { Router, Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../lib/prisma';
import { authenticateDoctor } from '../middleware/auth';

const router = Router();

// Secure route: Only logged in doctors
router.use(authenticateDoctor);

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
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `record-${uniqueSuffix}${ext}`);
  },
});

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ─── GET /api/doctor/patients/:patientId/records ──────────────────────────────
router.get('/:patientId/records', async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = (req as any).doctor?.id || (req as any).user?.id;
    const { patientId } = req.params;

    // Optional: Verify that the doctor has had an appointment with this patient
    const hasAppointment = await prisma.appointment.findFirst({
      where: { doctorId, patientId }
    });

    if (!hasAppointment) {
      res.status(403).json({ error: 'You are not authorized to view this patient\'s records.' });
      return;
    }

    const records = await prisma.medicalRecord.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    console.error('Fetch patient records error:', error);
    res.status(500).json({ error: 'Could not fetch records.' });
  }
});

// ─── POST /api/doctor/patients/:patientId/records ─────────────────────────────
router.post(
  '/:patientId/records',
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded.' });
        return;
      }

      const doctorId = (req as any).doctor?.id || (req as any).user?.id;
      const { patientId } = req.params;
      const { type } = req.body;

      if (!type) {
        fs.unlink(req.file.path, () => {});
        res.status(400).json({ error: 'Record type is required.' });
        return;
      }

      // Verify doctor-patient relationship
      const hasAppointment = await prisma.appointment.findFirst({
        where: { doctorId, patientId }
      });

      if (!hasAppointment) {
        fs.unlink(req.file.path, () => {});
        res.status(403).json({ error: 'You are not authorized to upload to this patient.' });
        return;
      }

      const fileUrl = `/uploads/${req.file.filename}`;

      const record = await prisma.medicalRecord.create({
        data: {
          patientId,
          type,
          fileName: req.file.originalname,
          fileUrl,
          fileSize: req.file.size,
        },
      });

      res.status(201).json({ success: true, data: record });
    } catch (error: unknown) {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          res.status(413).json({ error: 'File size exceeds the 10 MB limit.' });
          return;
        }
        res.status(400).json({ error: error.message });
        return;
      }
      if (error instanceof Error && error.message.includes('Only PDF')) {
        res.status(415).json({ error: error.message });
        return;
      }
      console.error('Doctor upload record error:', error);
      res.status(500).json({ error: 'Could not upload medical record.' });
    }
  },
);

// ─── DELETE /api/doctor/patients/:patientId/records/:recordId ─────────────────
router.delete('/:patientId/records/:recordId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId, recordId } = req.params;

    const record = await prisma.medicalRecord.findFirst({
      where: { id: recordId, patientId },
    });

    if (!record) {
      res.status(404).json({ error: 'Medical record not found.' });
      return;
    }

    // Delete from DB
    await prisma.medicalRecord.delete({ where: { id: recordId } });

    // Delete physical file from disk
    const filePath = path.join(UPLOADS_DIR, path.basename(record.fileUrl));
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.warn(`Could not delete file ${filePath}:`, err.message);
      }
    });

    res.status(200).json({ success: true, message: 'Medical record deleted successfully.' });
  } catch (error) {
    console.error('Delete record error:', error);
    res.status(500).json({ error: 'Could not delete medical record.' });
  }
});

export default router;
