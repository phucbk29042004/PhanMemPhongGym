/**
 * QR Check-in Controller
 * GET  /api/checkin/my-qr  — Hội viên lấy mã QR (JWT ngắn hạn)
 * POST /api/checkin/scan   — Lễ tân quét QR, ghi nhận check-in
 */

import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { success, error } from '../utils/response.js';
import { ghi_audit_log } from '../utils/audit.js';
import { createNotification } from '../utils/notifications.js';

// ── GET /api/checkin/my-qr ────────────────────────────────
// Chỉ hội viên đã đăng nhập mới gọi được (verifyToken đã chạy)
export const getMyQr = (req, res) => {
  // Tìm hồ sơ hội viên từ tai_khoan_id
  const hoSo = db.prepare(`
    SELECT id, ma_ho_so, ho_ten, avatar_url FROM ho_so
    WHERE tai_khoan_id = ? AND loai_ho_so = 'hoi_vien' AND is_deleted = 0
  `).get(req.user.id);

  if (!hoSo) return error(res, 'Không tìm thấy hồ sơ hội viên.', 404);

  // Đọc TTL từ cấu hình (mặc định 5 phút)
  const cfg = db.prepare(`SELECT gia_tri FROM cau_hinh WHERE khoa = 'qr_token_ttl_phut'`).get();
  const ttlPhut = parseInt(cfg?.gia_tri || '5');

  const qrSecret = process.env.QR_JWT_SECRET || process.env.JWT_SECRET;
  const token = jwt.sign(
    { ho_so_id: hoSo.id, ma_ho_so: hoSo.ma_ho_so, ten: hoSo.ho_ten },
    qrSecret,
    { expiresIn: `${ttlPhut}m` }
  );

  return success(res, {
    token,
    ho_so_id:  hoSo.id,
    ma_ho_so:  hoSo.ma_ho_so,
    ho_ten:    hoSo.ho_ten,
    avatar_url: hoSo.avatar_url,
    het_han_sau_phut: ttlPhut,
  });
};

// ── POST /api/checkin/scan ────────────────────────────────
// Lễ tân / admin quét QR — xác thực token rồi ghi nhận check-in
export const scanQr = (req, res) => {
  const { qr_token, chi_nhanh } = req.body;
  if (!qr_token) return error(res, 'Thiếu qr_token.', 400);

  // Xác thực QR token bằng QR_JWT_SECRET
  const qrSecret = process.env.QR_JWT_SECRET || process.env.JWT_SECRET;
  let payload;
  try {
    payload = jwt.verify(qr_token, qrSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') return error(res, 'Mã QR đã hết hạn. Yêu cầu hội viên làm mới QR.', 401);
    return error(res, 'Mã QR không hợp lệ.', 401);
  }

  const { ho_so_id } = payload;

  // Kiểm tra hồ sơ còn tồn tại
  const hoSo = db.prepare(`
    SELECT h.id, h.ho_ten, h.ma_ho_so, h.avatar_url,
           (
             SELECT MAX(d_ngay) FROM (
               SELECT den_ngay as d_ngay FROM dang_ky_goi_tap WHERE ho_so_id = h.id AND trang_thai = 'dang_hoat_dong'
               UNION ALL
               SELECT den_ngay as d_ngay FROM dang_ky_pt WHERE hoi_vien_id = h.id AND trang_thai = 'dang_hoat_dong'
             )
           ) AS ngay_ket_thuc
    FROM ho_so h
    WHERE h.id = ? AND h.loai_ho_so = 'hoi_vien' AND h.is_deleted = 0
  `).get(ho_so_id);

  if (!hoSo) return error(res, 'Hồ sơ hội viên không tồn tại.', 404);

  // Kiểm tra gói tập hoặc gói PT còn hạn
  if (!hoSo.ngay_ket_thuc) {
    return error(res, `Hội viên ${hoSo.ho_ten} không có gói tập hoặc gói PT đang hoạt động.`, 403);
  }
  const today = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' }).split(' ')[0];
  if (hoSo.ngay_ket_thuc < today) {
    return error(res, `Gói dịch vụ của ${hoSo.ho_ten} đã hết hạn (${hoSo.ngay_ket_thuc}).`, 403);
  }

  // Kiểm tra hôm nay đã check-in chưa (tránh quét 2 lần)
  // today đã có ở trên
  const daCheckin = db.prepare(`
    SELECT id FROM luot_vao_ra
    WHERE ho_so_id = ? AND DATE(thoi_diem) = ? AND loai = 'vao' AND phuong_thuc = 'qr_code'
  `).get(ho_so_id, today);

  if (daCheckin) {
    return error(res, `${hoSo.ho_ten} đã check-in hôm nay rồi.`, 409);
  }

  // Ghi nhận check-in
  const result = db.prepare(`
    INSERT INTO luot_vao_ra (ho_so_id, loai, phuong_thuc, ghi_chu)
    VALUES (?, 'vao', 'qr_code', ?)
  `).run(ho_so_id, chi_nhanh ? `Chi nhánh: ${chi_nhanh}` : null);

  ghi_audit_log(req, 'CREATE', 'luot_vao_ra', result.lastInsertRowid, null,
    { ho_so_id, phuong_thuc: 'qr_code' }, 'QR Check-in');

  const thoiGian = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  createNotification(
    'check_in',
    `Check-in — ${hoSo.ma_ho_so} ${hoSo.ho_ten}`,
    `${hoSo.ma_ho_so} ${hoSo.ho_ten} vừa check-in lúc ${thoiGian}`,
    hoSo.id,
    'ho_so',
    'ca_hai'
  );

  return success(res, {
    ho_so_id:   hoSo.id,
    ma_ho_so:   hoSo.ma_ho_so,
    ho_ten:     hoSo.ho_ten,
    avatar_url: hoSo.avatar_url,
    ngay_ket_thuc: hoSo.ngay_ket_thuc,
    thoi_gian_checkin: new Date().toISOString(),
  }, `Check-in thành công cho ${hoSo.ho_ten}`);
};
