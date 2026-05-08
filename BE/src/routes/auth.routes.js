/**
 * Routes cho Auth module
 * Base: /api/auth
 */

import { Router } from 'express';
import { login, doiMatKhau, getMe } from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.js';

const router = Router();

// POST /api/auth/login — Đăng nhập (public)
router.post('/login', login);

// GET /api/auth/me — Xem thông tin tài khoản hiện tại (yêu cầu đăng nhập)
router.get('/me', verifyToken, getMe);

// POST /api/auth/doi-mat-khau — Đổi mật khẩu (yêu cầu đăng nhập)
router.post('/doi-mat-khau', verifyToken, doiMatKhau);

export default router;
