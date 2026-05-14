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
} from '../controllers/notifications.controller.js';

const router = Router();

router.use(verifyToken);

router.get('/',              getNotifications);
router.get('/unread-count',  getUnreadCount);
router.get('/summary',       getSummary);
router.patch('/read-all',    markAllAsRead);
router.patch('/:id/read',    markAsRead);
router.delete('/',           deleteAllNotifications);
router.delete('/:id',        deleteNotification);

export default router;
