import { Router } from 'express';
import { getSchedules, createSchedule, confirmSchedule, cancelSchedule, updateSchedule, revertSchedule } from '../controllers/pt-schedules.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';

const router = Router();
router.use(verifyToken);

router.get('/',               getSchedules);                                            // Xem lịch (phân quyền trong controller)
router.post('/',              requireRole('admin', 'le_tan'), createSchedule);          // Đặt lịch
router.put('/:id',            requireRole('admin'), updateSchedule);                   // Sửa lịch
router.put('/:id/confirm',    requireRole('admin', 'le_tan', 'pt'), confirmSchedule);  // Xác nhận đã tập (PT tự xác nhận lịch của mình)
router.put('/:id/cancel',     requireRole('admin', 'le_tan'), cancelSchedule);        // Hủy lịch
router.patch('/:id/hoan-tac', requireRole('admin', 'le_tan'), revertSchedule);         // Hoàn tác (chỉ buổi do cron xác nhận)

export default router;
