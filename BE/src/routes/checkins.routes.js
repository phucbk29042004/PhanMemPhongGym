import { Router } from 'express';
import { getCheckins, createCheckin, getCheckinStats, getMyCheckins } from '../controllers/checkins.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';

const router = Router();
router.use(verifyToken);

router.get('/stats', requireRole('admin', 'le_tan'), getCheckinStats); // Thống kê theo giờ
router.get('/me',    getMyCheckins);                                   // Lịch sử của tôi
router.get('/',      requireRole('admin', 'le_tan'), getCheckins);     // Lịch sử toàn bộ
router.post('/',     requireRole('admin', 'le_tan'), createCheckin);   // Thêm lượt check-in

export default router;
