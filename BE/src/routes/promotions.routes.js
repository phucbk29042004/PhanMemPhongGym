import { Router } from 'express';
import {
  listPromotions, getPromotion, createPromotion, updatePromotion, deletePromotion,
  getActivePromotions,
} from '../controllers/promotions.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';

const router = Router();
router.use(verifyToken);

router.get('/active',  getActivePromotions);                    // tất cả đăng nhập — dùng khi đăng ký gói
router.get('/',        requireRole('admin', 'nhan_vien'), listPromotions);
router.get('/:id',     requireRole('admin', 'nhan_vien'), getPromotion);
router.post('/',       requireRole('admin'), createPromotion);
router.put('/:id',     requireRole('admin'), updatePromotion);
router.delete('/:id',  requireRole('admin'), deletePromotion);

export default router;
