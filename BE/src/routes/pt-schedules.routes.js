import { Router } from 'express';
import { getSchedules, createSchedule, confirmSchedule, cancelSchedule, updateSchedule, revertSchedule, updateNote, getMyMembers, getScheduleRating, upsertScheduleRating } from '../controllers/pt-schedules.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';

const router = Router();
router.use(verifyToken);

router.get('/my-members',     requireRole('pt'), getMyMembers);                        // PT xem học viên của mình
router.get('/',               getSchedules);                                            // Xem lịch (phân quyền trong controller)
router.post('/',              requireRole('admin', 'nhan_vien', 'pt'), createSchedule);   // Đặt lịch (PT tự đặt được)
router.put('/:id',            requireRole('admin', 'pt'), updateSchedule);             // Sửa lịch
router.put('/:id/confirm',    requireRole('admin', 'nhan_vien', 'pt', 'hoi_vien'), confirmSchedule);  // Xác nhận đã tập
router.put('/:id/cancel',     requireRole('admin', 'nhan_vien', 'pt'), cancelSchedule);   // Hủy lịch (PT huỷ được lịch của mình)
router.get('/:id/rating',     requireRole('admin', 'nhan_vien', 'pt', 'hoi_vien'), getScheduleRating);
router.post('/:id/rating',    requireRole('hoi_vien'), upsertScheduleRating);
router.patch('/:id/hoan-tac', requireRole('admin', 'nhan_vien'), revertSchedule);         // Hoàn tác (chỉ buổi do cron xác nhận)
router.patch('/:id/note',    updateNote);                                               // Ghi chú buổi tập — HV + PT + staff

export default router;
