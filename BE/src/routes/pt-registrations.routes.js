/**
 * Routes cho Đăng Ký PT
 * Base: /api/pt/registrations
 */

import { Router } from 'express';
import {
  getRegistrations, getRegistrationById,
  createRegistration, updateRegistration, cancelRegistration,
  cancelPendingPtPayment
} from '../controllers/pt-registrations.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';

const router = Router();
router.use(verifyToken);

router.get('/',    requireRole('admin', 'nhan_vien', 'pt'), getRegistrations);
router.get('/:id', requireRole('admin', 'nhan_vien', 'pt'), getRegistrationById);
router.post('/',          requireRole('admin', 'nhan_vien'), createRegistration);   // Đăng ký gói PT mới
router.put('/:id',        requireRole('admin', 'nhan_vien'), updateRegistration);     // Sửa gói PT
router.put('/:id/cancel', requireRole('admin'), cancelRegistration);               // Hủy gói PT — chỉ admin
router.delete('/payment/:orderCode', requireRole('admin', 'nhan_vien'), cancelPendingPtPayment); // Hủy giao dịch PT tạm thời

export default router;
