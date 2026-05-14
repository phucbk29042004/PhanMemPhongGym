/**
 * Auth Controller — Xử lý đăng nhập, đổi mật khẩu
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { success, error } from '../utils/response.js';
import { ghi_audit_log } from '../utils/audit.js';
import { createNotification } from '../utils/notifications.js';
import { uploadImage, deleteImage, isCloudinaryReady } from '../utils/cloudinary.js';

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
      // Sinh thông báo tài khoản bị khóa cho admin
      const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'Không xác định';
      createNotification(
        'tai_khoan_bi_khoa',
        '⚠️ Tài khoản bị khóa',
        `Tài khoản ${account.ten_dang_nhap} bị khóa do đăng nhập sai 5 lần liên tiếp — IP: ${ipAddress}`,
        account.id,
        'tai_khoan',
        'admin'
      );
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
      id: account.id,
      ten_dang_nhap: account.ten_dang_nhap,
      vai_tro: account.vai_tro,
      ten_vai_tro: account.ten_vai_tro,
      ho_so_id: account.ho_so_id,
      ho_ten: account.ho_ten,
      avatar_url: account.avatar_url,
      loai_ho_so: account.loai_ho_so,
      quyen: JSON.parse(account.quyen_json || '{}'),
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

// ── PUT /api/auth/me ──────────────────────────────────────
export const updateMe = (req, res) => {
  const { ho_ten, so_dien_thoai, email, avatar_url } = req.body;
  const userId = req.user.id;

  // Tìm hồ sơ gắn với tài khoản này
  let hoSo = db.prepare('SELECT id FROM ho_so WHERE tai_khoan_id = ? AND is_deleted = 0').get(userId);

  if (hoSo) {
    db.prepare(`
      UPDATE ho_so SET
        ho_ten = COALESCE(?, ho_ten),
        so_dien_thoai = COALESCE(?, so_dien_thoai),
        email = COALESCE(?, email),
        avatar_url = COALESCE(?, avatar_url)
      WHERE id = ?
    `).run(ho_ten || null, so_dien_thoai || null, email || null, avatar_url || null, hoSo.id);
  } else {
    // Nếu chưa có hồ sơ (ví dụ admin mặc định), tạo mới hồ sơ loại 'nhan_vien' hoặc 'admin'
    // Để an toàn, chỉ tạo hồ sơ tối thiểu
    const result = db.prepare(`
      INSERT INTO ho_so (loai_ho_so, ho_ten, so_dien_thoai, email, avatar_url, tai_khoan_id)
      VALUES ('nhan_vien', ?, ?, ?, ?, ?)
    `).run(ho_ten || 'Admin', so_dien_thoai || null, email || null, avatar_url || null, userId);
    hoSo = { id: result.lastInsertRowid };
  }

  ghi_audit_log(req, 'UPDATE', 'ho_so', hoSo.id, null, { action: 'update_me' }, 'Cập nhật thông tin cá nhân');
  return success(res, null, 'Cập nhật thông tin cá nhân thành công');
};

// ── PUT /api/auth/me/avatar ───────────────────────────────
export const updateAvatarMe = async (req, res) => {
  const userId = req.user.id;
  if (!req.file) return error(res, 'Vui lòng chọn file ảnh.', 400);

  try {
    if (!isCloudinaryReady) {
      return error(res, 'Hệ thống chưa cấu hình lưu trữ ảnh (Cloudinary).', 500);
    }

    let hoSo = db.prepare('SELECT id, ma_ho_so, cloudinary_public_id, avatar_url FROM ho_so WHERE tai_khoan_id = ? AND is_deleted = 0').get(userId);

    // Xóa ảnh cũ nếu có
    if (hoSo && hoSo.cloudinary_public_id) {
      await deleteImage(hoSo.cloudinary_public_id);
    }

    const maHoSo = hoSo ? hoSo.ma_ho_so : `ADMIN_${userId}`;
    const result = await uploadImage(req.file.buffer, 'paradise-gym/profiles', maHoSo);

    if (hoSo) {
      db.prepare(`
        UPDATE ho_so SET avatar_url = ?, cloudinary_public_id = ? WHERE id = ?
      `).run(result.url, result.publicId, hoSo.id);
    } else {
      // Create minimum record if doesn't exist
      const insertRes = db.prepare(`
        INSERT INTO ho_so (loai_ho_so, ho_ten, avatar_url, cloudinary_public_id, tai_khoan_id)
        VALUES ('nhan_vien', 'Admin', ?, ?, ?)
      `).run(result.url, result.publicId, userId);
      hoSo = { id: insertRes.lastInsertRowid };
    }

    ghi_audit_log(req, 'UPDATE', 'ho_so', hoSo.id, { avatar_url: hoSo?.avatar_url }, { avatar_url: result.url }, 'Cập nhật ảnh đại diện cá nhân');
    return success(res, { avatar_url: result.url }, 'Cập nhật ảnh thành công');
  } catch (err) {
    return error(res, `Lỗi upload ảnh: ${err.message}`, 500);
  }
};