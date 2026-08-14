import { Router, Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../lib/prisma';
import { protectPatient } from '../middleware/auth';

const router = Router();

// All records routes require authentication
router.use(protectPatient);

// ─── Multer Configuration ──────────────────────────────────────────────────────
const UPLOADS_DIR = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.resolve(__dirname, '../../uploads');

// Ensure uploads directory exists
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

// ─── POST /api/records/upload ─────────────────────────────────────────────────
router.post(
  '/upload',
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded.' });
        return;
      }

      const patientId = req.user!.id;
      const { type } = req.body;

      if (!type) {
        // Clean up uploaded file if validation fails
        fs.unlink(req.file.path, () => {});
        res.status(400).json({ error: 'Record type is required.' });
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
      // Handle multer errors (file size, file type)
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
      console.error('Upload record error:', error);
      res.status(500).json({ error: 'Could not upload medical record.' });
    }
  },
);

// ─── GET /api/records ─────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const patientId = req.user!.id;

    const records = await prisma.medicalRecord.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ error: 'Could not fetch medical records.' });
  }
});

// ─── DELETE /api/records/:id ──────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const patientId = req.user!.id;
    const { id } = req.params;

    const record = await prisma.medicalRecord.findFirst({
      where: { id, patientId },
    });

    if (!record) {
      res.status(404).json({ error: 'Medical record not found.' });
      return;
    }

    // Delete from DB
    await prisma.medicalRecord.delete({ where: { id } });

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
