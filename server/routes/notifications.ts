import { Router } from 'express';
import { dbRepo } from '../config/db.ts';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const notifications = await dbRepo.listNotifications(req.user!.userId);
    res.json({ notifications });
  } catch (err) {
    console.error('List notifications error:', err);
    res.status(500).json({ error: 'Failed to load notifications.' });
  }
});

router.patch('/:id/read', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await dbRepo.markNotificationRead(req.params.id, req.user!.userId);
    res.json({ ok: true });
  } catch (err) {
    console.error('Mark notification read error:', err);
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

router.post('/read-all', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await dbRepo.markAllNotificationsRead(req.user!.userId);
    res.json({ ok: true });
  } catch (err) {
    console.error('Mark all notifications read error:', err);
    res.status(500).json({ error: 'Failed to mark notifications as read.' });
  }
});

export default router;
