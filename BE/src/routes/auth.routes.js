/**
 * Routes cho Auth module
 * Base: /api/auth
 */

import { Router } from 'express';
import { login, doiMatKhau, getMe, updateMe, updateAvatarMe } from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { uploadAvatar } from '../middlewares/upload.js';

const router = Router();

// POST /api/auth/login — Đăng nhập (public)
router.post('/login', login);

// GET /api/auth/me — Xem thông tin tài khoản hiện tại (yêu cầu đăng nhập)
router.get('/me', verifyToken, getMe);

// PUT /api/auth/me — Cập nhật thông tin tài khoản (yêu cầu đăng nhập)
router.put('/me', verifyToken, updateMe);

// PUT /api/auth/me/avatar — Cập nhật ảnh đại diện (yêu cầu đăng nhập)
router.put('/me/avatar', verifyToken, uploadAvatar, updateAvatarMe);

// POST /api/auth/doi-mat-khau — Đổi mật khẩu (yêu cầu đăng nhập)
router.post('/doi-mat-khau', verifyToken, doiMatKhau);

export default router;
