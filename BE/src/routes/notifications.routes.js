import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.js';
import {
  getNotifications,
  getUnreadCount,
  getSummary,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  broadcastNotification
} from '../controllers/notifications.controller.js';
import { requireRole } from '../middlewares/role.js';

const router = Router();

router.use(verifyToken);

router.get('/',              getNotifications);
router.get('/unread-count',  getUnreadCount);
router.get('/summary',       getSummary);
router.patch('/read-all',    markAllAsRead);
router.patch('/:id/read',    markAsRead);
router.delete('/',           deleteAllNotifications);
router.delete('/:id',        deleteNotification);

// Broadcast cho Hội viên & PT
router.post('/broadcast',    requireRole('admin'), broadcastNotification);

export default router;
