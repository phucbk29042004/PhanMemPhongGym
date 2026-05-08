import { Router } from 'express';
import { getSchedules, createSchedule, confirmSchedule, cancelSchedule, updateSchedule } from '../controllers/pt-schedules.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';

const router = Router();
router.use(verifyToken);

router.get('/',               getSchedules);                                            // Xem lịch (phân quyền trong controller)
router.post('/',              requireRole('admin', 'le_tan'), createSchedule);          // Đặt lịch
router.put('/:id',            requireRole('admin'), updateSchedule);                   // Sửa lịch
router.put('/:id/confirm',    requireRole('admin', 'le_tan'), confirmSchedule);        // Xác nhận đã tập
router.put('/:id/cancel',     requireRole('admin'), cancelSchedule);                   // Hủy lịch

export default router;
