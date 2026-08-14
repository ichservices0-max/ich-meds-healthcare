import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { protectPatient } from '../middleware/auth';

const router = Router();

// All notification routes require authentication
router.use(protectPatient);

// ─── GET /api/notifications ───────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const patientId = req.user!.id;

    const notifications = await prisma.notification.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.status(200).json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, error: 'Could not fetch notifications.' });
  }
});

// ─── PATCH /api/notifications/read-all ───────────────────────────────────────
// Note: This route must come BEFORE /:id to avoid route conflict
router.patch('/read-all', async (req: Request, res: Response): Promise<void> => {
  try {
    const patientId = req.user!.id;

    const result = await prisma.notification.updateMany({
      where: { patientId, isRead: false },
      data: { isRead: true },
    });

    res.status(200).json({
      message: `${result.count} notification(s) marked as read.`,
      updated: result.count,
    });
  } catch (error) {
    console.error('Read-all notifications error:', error);
    res.status(500).json({ error: 'Could not mark notifications as read.' });
  }
});

// ─── PATCH /api/notifications/:id/read ───────────────────────────────────────
router.patch('/:id/read', async (req: Request, res: Response): Promise<void> => {
  try {
    const patientId = req.user!.id;
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: { id, patientId },
    });

    if (!notification) {
      res.status(404).json({ error: 'Notification not found.' });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.status(200).json({ notification: updated });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Could not mark notification as read.' });
  }
});

export default router;
