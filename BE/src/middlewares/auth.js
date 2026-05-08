/**
 * Middleware xác thực JWT
 * Gắn thông tin user vào req.user sau khi xác thực thành công
 */

import jwt from 'jsonwebtoken';
import { error } from '../utils/response.js';
import db from '../config/db.js';

const getAccount = db.prepare(`
  SELECT t.id, t.ten_dang_nhap, t.trang_thai, t.vai_tro_id,
         v.ma_vai_tro AS vai_tro, v.quyen_json
  FROM tai_khoan t
  JOIN vai_tro v ON v.id = t.vai_tro_id
  WHERE t.id = ?
`);

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Không có token xác thực. Vui lòng đăng nhập.', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kiểm tra tài khoản còn hoạt động không
    const account = getAccount.get(decoded.id);
    if (!account) return error(res, 'Tài khoản không tồn tại.', 401);
    if (account.trang_thai !== 'hoat_dong') return error(res, 'Tài khoản đã bị khoá hoặc chưa xác nhận.', 403);

    req.user = {
      id:           account.id,
      ten_dang_nhap: account.ten_dang_nhap,
      vai_tro:      account.vai_tro,
      vai_tro_id:   account.vai_tro_id,
      quyen:        JSON.parse(account.quyen_json || '{}'),
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return error(res, 'Token đã hết hạn. Vui lòng đăng nhập lại.', 401);
    return error(res, 'Token không hợp lệ.', 401);
  }
};

/**
 * Middleware tuỳ chọn xác thực (không bắt buộc — nếu có token thì gắn user)
 * Dùng cho các endpoint public nhưng cần biết user là ai nếu đã login
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const account = getAccount.get(decoded.id);
    if (account && account.trang_thai === 'hoat_dong') {
      req.user = {
        id:           account.id,
        ten_dang_nhap: account.ten_dang_nhap,
        vai_tro:      account.vai_tro,
        vai_tro_id:   account.vai_tro_id,
        quyen:        JSON.parse(account.quyen_json || '{}'),
      };
    }
  } catch (_) { /* bỏ qua nếu token lỗi */ }
  next();
};
