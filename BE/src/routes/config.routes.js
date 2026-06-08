import { Router } from 'express';
import {
  getConfig, updateConfig, getConfigByKey,
  getRules, getAllRules, createRule, updateRule, deleteRule,
} from '../controllers/config.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';

const router = Router();
router.use(verifyToken);

// ── Cấu hình hệ thống ─────────────────────────────────────
router.get('/',         requireRole('admin'), getConfig);
router.put('/',         requireRole('admin'), updateConfig);

// ── Nội quy phòng tập ─────────────────────────────────────
router.get('/rules/all', requireRole('admin', 'chu_phong_gym', 'quan_ly', 'nhan_vien'), getAllRules);  // admin/nhân viên xem cả inactive
router.get('/rules',     getRules);                           // tất cả user đăng nhập
router.post('/rules',    requireRole('brand', 'admin', 'chu_phong_gym', 'quan_ly', 'nhan_vien'), createRule);
router.put('/rules/:id', requireRole('brand', 'admin', 'chu_phong_gym', 'quan_ly', 'nhan_vien'), updateRule);
router.delete('/rules/:id', requireRole('brand', 'admin', 'chu_phong_gym', 'quan_ly', 'nhan_vien'), deleteRule);

// ── Lấy 1 cấu hình cụ thể (wildcard - phải đặt dưới cùng) ──
router.get('/:khoa',    getConfigByKey);   // public — mobile dùng để lấy gio_dong_cua, v.v.

export default router;
