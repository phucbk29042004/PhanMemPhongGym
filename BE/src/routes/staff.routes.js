import { Router } from 'express';
import {
  getStaff, getStaffById, createStaff, updateStaff, deleteStaff,
  getAccounts, updateAccount, deleteAccount
} from '../controllers/staff.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';
import { uploadAvatar } from '../middlewares/upload.js';

const router = Router();
router.use(verifyToken);

router.get('/accounts', requireRole('admin', 'chu_phong_gym'), getAccounts);
router.put('/accounts/:id', requireRole('admin', 'chu_phong_gym'), updateAccount);
router.delete('/accounts/:id', requireRole('admin', 'chu_phong_gym'), deleteAccount);

router.get('/', requireRole('admin', 'chu_phong_gym', 'quan_ly', 'nhan_vien'), getStaff);
router.get('/:id', requireRole('admin', 'chu_phong_gym', 'quan_ly', 'nhan_vien'), getStaffById);
router.post('/', requireRole('admin', 'chu_phong_gym', 'quan_ly'), uploadAvatar, createStaff);
router.put('/:id', requireRole('admin', 'chu_phong_gym', 'quan_ly'), uploadAvatar, updateStaff);
router.delete('/:id', requireRole('admin', 'chu_phong_gym', 'quan_ly'), deleteStaff);

export default router;