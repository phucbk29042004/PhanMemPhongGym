/**
 * Routes cho Hội Viên (Members)
 * Base: /api/members
 */

import { Router } from 'express';
import {
  getMembers, getMemberById, createMember, updateMember,
  deleteMember, updateAvatar, getExpiringMembers,
  getExpiredMembers, getMemberHistory, registerPackage,
  getBirthday, getMyProfile, createAccount, checkDuplicate,
  getMyNotifications, requestPackageRenewal, getPackageRequests, approvePackageRequest,
  notifyMember, markMyNotificationsRead, clearMyNotifications
} from '../controllers/members.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';
import { uploadAvatar } from '../middlewares/upload.js';

const router = Router();
// Tất cả routes bên dưới yêu cầu đăng nhập
router.use(verifyToken);

// Các route static phải đặt TRƯỚC /:id để không bị conflict
router.get('/expiring',         requireRole('admin', 'le_tan'), getExpiringMembers);
router.get('/expired',          requireRole('admin', 'le_tan'), getExpiredMembers);
router.get('/birthday',         requireRole('admin', 'le_tan'), getBirthday);
router.get('/check-duplicate',  requireRole('admin', 'le_tan'), checkDuplicate);
router.get('/package-requests', requireRole('admin', 'le_tan'), getPackageRequests); // Xem các yêu cầu chờ duyệt
router.get('/me/profile', verifyToken, getMyProfile);
router.get('/me/notifications', getMyNotifications); // Thông báo realtime + inbox
router.post('/me/notifications/read', markMyNotificationsRead); // Đánh dấu đã đọc
router.delete('/me/notifications', clearMyNotifications); // Xoá sạch thông báo inbox
router.post('/me/package-request', requestPackageRenewal); // Yêu cầu gia hạn từ App
router.put('/package-requests/:id/approve', requireRole('admin', 'le_tan'), approvePackageRequest); // Duyệt/Từ chối yêu cầu

// CRUD cơ bản
router.get('/',    requireRole('admin', 'le_tan'), getMembers);
router.get('/:id', requireRole('admin', 'le_tan'), getMemberById);
router.post('/',   requireRole('admin', 'le_tan'), uploadAvatar, createMember);
router.put('/:id', requireRole('admin', 'le_tan'), updateMember);
router.delete('/:id', requireRole('admin'), deleteMember);

// Upload ảnh đại diện
router.put('/:id/avatar', requireRole('admin', 'le_tan'), uploadAvatar, updateAvatar);

// Lịch sử & đăng ký gói tập
router.get('/:id/history', requireRole('admin', 'le_tan'), getMemberHistory);
router.post('/:id/package', requireRole('admin', 'le_tan'), registerPackage);

// Tạo tài khoản đăng nhập cho hồ sơ
router.post('/:id/create-account', requireRole('admin', 'le_tan'), createAccount);

// Gửi thông báo cá nhân cho hội viên
router.post('/:id/notify', requireRole('admin', 'le_tan'), notifyMember);

export default router;
