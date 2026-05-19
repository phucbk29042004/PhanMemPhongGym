/**
 * Routes cho Đăng Ký PT
 * Base: /api/pt/registrations
 */

import { Router } from 'express';
import {
  getRegistrations, getRegistrationById,
  createRegistration, updateRegistration, cancelRegistration,
} from '../controllers/pt-registrations.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';

const router = Router();
router.use(verifyToken);

router.get('/',    requireRole('admin', 'le_tan', 'pt'), getRegistrations);
router.get('/:id', requireRole('admin', 'le_tan', 'pt'), getRegistrationById);
router.post('/',          requireRole('admin', 'le_tan'), createRegistration);   // Đăng ký gói PT mới
router.put('/:id',        requireRole('admin', 'le_tan'), updateRegistration);     // Sửa gói PT
router.put('/:id/cancel', requireRole('admin', 'le_tan'), cancelRegistration);               // Hủy gói PT — cả admin và lễ tân

export default router;
