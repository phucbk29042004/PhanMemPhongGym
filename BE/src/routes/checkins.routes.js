import { Router } from 'express';
import { getCheckins, createCheckin, getCheckinStats, getMyCheckins } from '../controllers/checkins.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';

const router = Router();
router.use(verifyToken);

router.get('/stats', requireRole('admin', 'nhan_vien'), getCheckinStats); // Thống kê theo giờ
router.get('/me',    getMyCheckins);                                   // Lịch sử của tôi
router.get('/',      requireRole('admin', 'nhan_vien'), getCheckins);     // Lịch sử toàn bộ
router.post('/',     requireRole('admin', 'nhan_vien'), createCheckin);   // Thêm lượt check-in

export default router;
