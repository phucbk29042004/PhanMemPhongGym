/**
 * Routes cho Hội Viên (Members)
 * Base: /api/members
 */

import { Router } from 'express';
import {
  getMembers, getMemberById, createMember, updateMember,
  deleteMember, updateAvatar, getExpiringMembers,
  getExpiredMembers, getMemberHistory, registerPackage,
  getBirthday, getMyProfile, updateMyHealth, createAccount, checkDuplicate,
  getMyNotifications, requestPackageRenewal, cancelPackageRequest, checkPayosStatus, getPackageRequests, approvePackageRequest,
  notifyMember, markMyNotificationsRead, clearMyNotifications, deleteMyNotification,
  cancelPackage, editPackage, switchPackage,
  lookupMember, getMyPayments, requestPackagePause, getInvoice,
  sendBirthdayWish, sendBirthdayWishAll, importMembers,
} from '../controllers/members.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';
import { uploadAvatar, uploadExcel } from '../middlewares/upload.js';
import db from '../config/db.js';

const router = Router();

// Tất cả routes bên dưới yêu cầu đăng nhập
router.use(verifyToken);

// Các route static phải đặt TRƯỚC /:id để không bị conflict
router.get('/lookup',              requireRole('admin', 'nhan_vien'), lookupMember);
router.post('/birthday-wish-all', requireRole('admin', 'nhan_vien'), sendBirthdayWishAll); // Gửi lời chúc hàng loạt cho HV sinh nhật hôm nay
router.get('/expiring',           requireRole('admin', 'nhan_vien'), getExpiringMembers);
router.get('/expired',          requireRole('admin', 'nhan_vien'), getExpiredMembers);
router.get('/birthday',         requireRole('admin', 'nhan_vien'), getBirthday);
router.get('/check-duplicate',  requireRole('admin', 'nhan_vien'), checkDuplicate);
router.get('/package-requests', requireRole('admin', 'nhan_vien'), getPackageRequests); // Xem các yêu cầu chờ duyệt
router.get('/me/profile', verifyToken, getMyProfile);
router.patch('/me/health', updateMyHealth);
router.get('/me/notifications', getMyNotifications); // Thông báo realtime + inbox
router.post('/me/notifications/read', markMyNotificationsRead); // Đánh dấu đã đọc
router.delete('/me/notifications', clearMyNotifications); // Xoá sạch thông báo inbox
router.delete('/me/notifications/:id', deleteMyNotification); // Xoá 1 thông báo inbox
router.get('/me/payments',         getMyPayments);          // HV xem lịch sử thanh toán
router.post('/me/package-request', requestPackageRenewal); // Yêu cầu gia hạn từ App
router.post('/me/package-request/:id/cancel', cancelPackageRequest); // HV tự hủy yêu cầu gia hạn đang chờ
router.get('/me/payos-status/:orderCode', checkPayosStatus); // Kiểm tra trạng thái thanh toán PayOS
router.post('/me/package-pause-request', requestPackagePause); // HV yêu cầu tạm dừng gói
router.put('/package-requests/:id/approve', requireRole('admin', 'nhan_vien'), approvePackageRequest); // Duyệt yêu cầu gia hạn

// CRUD cơ bản
router.get('/',    requireRole('admin', 'nhan_vien'), getMembers);
router.get('/:id', requireRole('admin', 'nhan_vien'), getMemberById);
router.post('/',   requireRole('admin', 'nhan_vien'), uploadAvatar, createMember);
router.post('/import', requireRole('admin', 'nhan_vien'), uploadExcel, importMembers);
router.put('/:id', requireRole('admin', 'nhan_vien'), updateMember);
router.delete('/:id', requireRole('admin'), deleteMember);

// Upload ảnh đại diện
router.put('/:id/avatar', requireRole('admin', 'nhan_vien'), uploadAvatar, updateAvatar);

// Lịch sử & đăng ký gói tập
router.get('/:id/history', requireRole('admin', 'nhan_vien'), getMemberHistory);
// Hủy / Chỉnh sửa / Đổi gói tập — đặt TRƯỚC route đăng ký để tránh conflict
router.post('/:id/package/switch',         requireRole('admin', 'nhan_vien'), switchPackage);   // Đổi gói
router.patch('/:id/package/:pkgId/cancel', requireRole('admin'), cancelPackage);            // Hủy gói — chỉ admin
router.patch('/:id/package/:pkgId',        requireRole('admin', 'nhan_vien'), editPackage);    // Sửa gói
router.post('/:id/package', requireRole('admin', 'nhan_vien'), registerPackage);              // Đăng ký gói mới
router.get('/:id/package/:pkgId/invoice', requireRole('admin', 'nhan_vien'), getInvoice);     // Xem biên lai

// Tạo tài khoản đăng nhập cho hồ sơ
router.post('/:id/create-account', requireRole('admin', 'nhan_vien'), createAccount);

// Gửi thông báo cá nhân cho hội viên
router.post('/:id/notify',         requireRole('admin', 'nhan_vien'), notifyMember);
router.post('/:id/birthday-wish',  requireRole('admin', 'nhan_vien'), sendBirthdayWish);  // Gửi lời chúc sinh nhật cho 1 HV

export default router;
