/**
 * Auth Controller — Xử lý đăng nhập, đổi mật khẩu
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { success, error } from '../utils/response.js';
import { ghi_audit_log } from '../utils/audit.js';

const findAccount = db.prepare(`
  SELECT t.id, t.ten_dang_nhap, t.mat_khau_hash, t.trang_thai,
         t.so_lan_dang_nhap_sai, t.vai_tro_id,
         v.ma_vai_tro AS vai_tro, v.ten_hien_thi AS ten_vai_tro, v.quyen_json,
         h.id AS ho_so_id, h.ho_ten, h.avatar_url, h.loai_ho_so
  FROM tai_khoan t
  JOIN vai_tro v ON v.id = t.vai_tro_id
  LEFT JOIN ho_so h ON h.tai_khoan_id = t.id AND h.is_deleted = 0
  WHERE t.ten_dang_nhap = ? COLLATE NOCASE
`);

const resetLoginFail = db.prepare(`
  UPDATE tai_khoan SET so_lan_dang_nhap_sai = 0, lan_dang_nhap_cuoi = datetime('now','localtime') WHERE id = ?
`);
const increaseLoginFail = db.prepare(`
  UPDATE tai_khoan SET so_lan_dang_nhap_sai = so_lan_dang_nhap_sai + 1 WHERE id = ?
`);
const lockAccount = db.prepare(`
  UPDATE tai_khoan SET trang_thai = 'khoa' WHERE id = ?
`);

// ── POST /api/auth/login ──────────────────────────────────
export const login = (req, res) => {
  const { ten_dang_nhap, mat_khau } = req.body;
  if (!ten_dang_nhap || !mat_khau) {
    return error(res, 'Vui lòng nhập tên đăng nhập và mật khẩu.', 400);
  }

  const account = findAccount.get(ten_dang_nhap);
  if (!account) return error(res, 'Tên đăng nhập hoặc mật khẩu không đúng.', 401);

  // Kiểm tra trạng thái tài khoản
  if (account.trang_thai === 'khoa') {
    return error(res, 'Tài khoản đã bị khoá. Liên hệ quản trị viên.', 403);
  }
  if (account.trang_thai === 'cho_xac_nhan') {
    return error(res, 'Tài khoản chưa được kích hoạt.', 403);
  }

  // Kiểm tra mật khẩu
  const isMatch = bcrypt.compareSync(mat_khau, account.mat_khau_hash);
  if (!isMatch) {
    increaseLoginFail.run(account.id);
    if (account.so_lan_dang_nhap_sai + 1 >= 5) {
      lockAccount.run(account.id);
      return error(res, 'Sai mật khẩu quá 5 lần. Tài khoản đã bị khoá.', 403);
    }
    return error(res, `Mật khẩu không đúng. Còn ${4 - account.so_lan_dang_nhap_sai} lần thử.`, 401);
  }

  // Đăng nhập thành công
  resetLoginFail.run(account.id);

  const payload = { id: account.id, vai_tro: account.vai_tro };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

  ghi_audit_log(req, 'LOGIN', 'tai_khoan', account.id, null, null, 'Đăng nhập thành công');

  return success(res, {
    token,
    user: {
      id:          account.id,
      ten_dang_nhap: account.ten_dang_nhap,
      vai_tro:     account.vai_tro,
      ten_vai_tro: account.ten_vai_tro,
      ho_so_id:    account.ho_so_id,
      ho_ten:      account.ho_ten,
      avatar_url:  account.avatar_url,
      loai_ho_so:  account.loai_ho_so,
      quyen:       JSON.parse(account.quyen_json || '{}'),
    },
  }, 'Đăng nhập thành công');
};

// ── POST /api/auth/doi-mat-khau ───────────────────────────
export const doiMatKhau = (req, res) => {
  const { mat_khau_cu, mat_khau_moi } = req.body;
  if (!mat_khau_cu || !mat_khau_moi) {
    return error(res, 'Vui lòng nhập đầy đủ mật khẩu cũ và mới.', 400);
  }
  if (mat_khau_moi.length < 6) {
    return error(res, 'Mật khẩu mới phải có ít nhất 6 ký tự.', 400);
  }

  const account = db.prepare('SELECT mat_khau_hash FROM tai_khoan WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(mat_khau_cu, account.mat_khau_hash)) {
    return error(res, 'Mật khẩu cũ không đúng.', 400);
  }

  const newHash = bcrypt.hashSync(mat_khau_moi, 12);
  db.prepare('UPDATE tai_khoan SET mat_khau_hash = ? WHERE id = ?').run(newHash, req.user.id);

  ghi_audit_log(req, 'UPDATE', 'tai_khoan', req.user.id, null, { action: 'doi_mat_khau' }, 'Đổi mật khẩu thành công');
  return success(res, null, 'Đổi mật khẩu thành công');
};

// ── GET /api/auth/me ──────────────────────────────────────
export const getMe = (req, res) => {
  const account = db.prepare(`
    SELECT t.id, t.ten_dang_nhap, v.ma_vai_tro AS vai_tro, v.ten_hien_thi AS ten_vai_tro, v.quyen_json,
           h.id AS ho_so_id, h.ho_ten, h.avatar_url, h.loai_ho_so, h.so_dien_thoai, h.email
    FROM tai_khoan t
    JOIN vai_tro v ON v.id = t.vai_tro_id
    LEFT JOIN ho_so h ON h.tai_khoan_id = t.id AND h.is_deleted = 0
    WHERE t.id = ?
  `).get(req.user.id);

  return success(res, {
    ...account,
    quyen: JSON.parse(account?.quyen_json || '{}'),
  });
};
