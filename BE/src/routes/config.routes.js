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
router.get('/rules/all', requireRole('admin'), getAllRules);  // admin xem cả inactive
router.get('/rules',     getRules);                           // tất cả user đăng nhập
router.post('/rules',    requireRole('admin'), createRule);
router.put('/rules/:id', requireRole('admin'), updateRule);
router.delete('/rules/:id', requireRole('admin'), deleteRule);

// ── Lấy 1 cấu hình cụ thể (wildcard - phải đặt dưới cùng) ──
router.get('/:khoa',    getConfigByKey);   // public — mobile dùng để lấy gio_dong_cua, v.v.

export default router;
