import { Router } from 'express';
import { getTrainers, getTrainerById, createTrainer, updateTrainer, updateTrainerAvatar, getTrainerSchedules } from '../controllers/trainers.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';
import { uploadAvatar } from '../middlewares/upload.js';

const router = Router();
router.use(verifyToken);

router.get('/',            requireRole('admin', 'le_tan'), getTrainers);
router.get('/:id',         requireRole('admin', 'le_tan'), getTrainerById);
router.get('/:id/schedules', requireRole('admin', 'le_tan', 'pt'), getTrainerSchedules);
router.post('/',           requireRole('admin'), uploadAvatar, createTrainer);
router.put('/:id',         requireRole('admin'), updateTrainer);
router.put('/:id/avatar',  requireRole('admin'), uploadAvatar, updateTrainerAvatar);

export default router;
