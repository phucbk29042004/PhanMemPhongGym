import { Router } from 'express';
import {
  getTrainers, getTrainerById, createTrainer, updateTrainer,
  updateTrainerAvatar, getTrainerSchedules, getTrainerMembers,
  deleteTrainer
} from '../controllers/trainers.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';
import { uploadAvatar } from '../middlewares/upload.js';

const router = Router();
router.use(verifyToken);

router.get('/', requireRole('admin', 'nhan_vien'), getTrainers);
router.get('/:id', requireRole('admin', 'nhan_vien'), getTrainerById);
router.get('/:id/members', requireRole('admin', 'nhan_vien'), getTrainerMembers);
router.get('/:id/schedules', requireRole('admin', 'nhan_vien', 'pt'), getTrainerSchedules);
router.post('/', requireRole('admin', 'nhan_vien'), uploadAvatar, createTrainer);
router.put('/:id', requireRole('admin', 'nhan_vien'), updateTrainer);
router.put('/:id/avatar', requireRole('admin', 'nhan_vien'), uploadAvatar, updateTrainerAvatar);
router.delete('/:id', requireRole('admin'), deleteTrainer);

export default router;
