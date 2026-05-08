/**
 * Routes cho Nhân Viên (Staff)
 * Base: /api/staff
 */

import { Router } from 'express';
import {
  getStaff, getStaffById, createStaff, updateStaff, deleteStaff,
} from '../controllers/staff.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';
import { uploadAvatar } from '../middlewares/upload.js';

const router = Router();
router.use(verifyToken);

router.get('/',    requireRole('admin'), getStaff);
router.get('/:id', requireRole('admin'), getStaffById);
router.post('/',   requireRole('admin'), uploadAvatar, createStaff);
router.put('/:id', requireRole('admin'), updateStaff);
router.delete('/:id', requireRole('admin'), deleteStaff);

export default router;
