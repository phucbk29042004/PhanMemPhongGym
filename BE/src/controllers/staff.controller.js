/**
 * Staff Controller — Quản lý nhân viên lễ tân / nội bộ
 * Base route: /api/staff
 */

import db from '../config/db.js';
import { success, error } from '../utils/response.js';
import { uploadImage, deleteImage } from '../utils/cloudinary.js';
import { ghi_audit_log } from '../utils/audit.js';
import bcrypt from 'bcryptjs';

// ── GET /api/staff ────────────────────────────────────────
export const getStaff = (req, res) => {
  const { search, loai, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = `WHERE h.loai_ho_so IN ('le_tan', 'nhan_vien') AND h.is_deleted = 0`;
  const params = [];

  if (loai && ['le_tan', 'nhan_vien'].includes(loai)) {
    where += ' AND h.loai_ho_so = ?'; params.push(loai);
  }
  if (search) {
    where += ` AND (h.ho_ten LIKE ? OR h.ma_ho_so LIKE ? OR h.so_dien_thoai LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  const rows = db.prepare(`
    SELECT
      h.id, h.ma_ho_so, h.loai_ho_so, h.ho_ten, h.gioi_tinh, h.ngay_sinh,
      h.so_dien_thoai, h.email, h.avatar_url, h.chuc_vu, h.ngay_tao,
      tk.ten_dang_nhap, tk.trang_thai AS tk_trang_thai
    FROM ho_so h
    LEFT JOIN tai_khoan tk ON tk.id = h.tai_khoan_id
    ${where}
    ORDER BY h.ngay_tao DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) AS cnt FROM ho_so h ${where}`).get(...params).cnt;

  return success(res, {
    data: rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
};

// ── GET /api/staff/:id ────────────────────────────────────
export const getStaffById = (req, res) => {
  const { id } = req.params;
  const staff = db.prepare(`
    SELECT h.*, tk.ten_dang_nhap, tk.trang_thai AS tk_trang_thai,
           vt.ten_vai_tro, vt.quyen_json
    FROM ho_so h
    LEFT JOIN tai_khoan tk ON tk.id = h.tai_khoan_id
    LEFT JOIN vai_tro vt ON vt.id = tk.vai_tro_id
    WHERE h.id = ? AND h.loai_ho_so IN ('le_tan', 'nhan_vien') AND h.is_deleted = 0
  `).get(id);

  if (!staff) return error(res, 'Không tìm thấy nhân viên.', 404);
  delete staff.mat_khau_hash;
  return success(res, staff);
};

// ── POST /api/staff ───────────────────────────────────────
// Tạo hồ sơ nhân viên (tùy chọn tạo tài khoản luôn)
export const createStaff = async (req, res) => {
  const {
    ho_ten, gioi_tinh, ngay_sinh, so_dien_thoai, email, dia_chi_tam_tru,
    loai_ho_so = 'le_tan', chuc_vu, chi_nhanh, ghi_chu,
    // Thông tin tài khoản (tuỳ chọn)
    ten_dang_nhap, mat_khau,
  } = req.body;

  if (!ho_ten) return error(res, 'Họ tên là bắt buộc.', 400);
  if (!['le_tan', 'nhan_vien'].includes(loai_ho_so)) {
    return error(res, 'loai_ho_so phải là le_tan hoặc nhan_vien.', 400);
  }

  let avatar_url = null;
  let cloudinary_public_id = null;
  if (req.file) {
    try {
      const result = await uploadImage(req.file.buffer, 'paradise-gym/staff');
      avatar_url = result.url;
      cloudinary_public_id = result.publicId;
    } catch (err) {
      return error(res, `Lỗi upload ảnh: ${err.message}`, 500);
    }
  }

  // Tạo mã nhân viên
  const prefix = loai_ho_so === 'le_tan' ? 'LT' : 'NV';
  const last = db.prepare(`SELECT ma_ho_so FROM ho_so WHERE loai_ho_so = ? ORDER BY id DESC LIMIT 1`).get(loai_ho_so);
  let nextNum = '001';
  if (last?.ma_ho_so) {
    const m = last.ma_ho_so.match(/\d+/);
    if (m) nextNum = String(parseInt(m[0]) + 1).padStart(3, '0');
  }
  const ma_ho_so = `${prefix}${nextNum}`;

  // Tạo tài khoản nếu cung cấp thông tin đăng nhập
  let tai_khoan_id = null;
  if (ten_dang_nhap && mat_khau) {
    const exists = db.prepare('SELECT id FROM tai_khoan WHERE ten_dang_nhap = ?').get(ten_dang_nhap);
    if (exists) return error(res, 'Tên đăng nhập đã tồn tại.', 409);

    const vaiTro = db.prepare("SELECT id FROM vai_tro WHERE ma_vai_tro = ?").get(loai_ho_so === 'le_tan' ? 'le_tan' : 'nhan_vien');
    const hash = await bcrypt.hash(mat_khau, 12);
    const tkResult = db.prepare(`
      INSERT INTO tai_khoan (ten_dang_nhap, mat_khau_hash, vai_tro_id) VALUES (?, ?, ?)
    `).run(ten_dang_nhap, hash, vaiTro?.id || null);
    tai_khoan_id = tkResult.lastInsertRowid;
  }

  const result = db.prepare(`
    INSERT INTO ho_so (
      ma_ho_so, loai_ho_so, ho_ten, gioi_tinh, ngay_sinh, so_dien_thoai, email,
      dia_chi_tam_tru, avatar_url, cloudinary_public_id, chuc_vu, chi_nhanh,
      ghi_chu, tai_khoan_id, nguoi_tao_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    ma_ho_so, loai_ho_so, ho_ten, gioi_tinh || null, ngay_sinh || null,
    so_dien_thoai || null, email || null, dia_chi_tam_tru || null,
    avatar_url, cloudinary_public_id, chuc_vu || null, chi_nhanh || null,
    ghi_chu || null, tai_khoan_id, req.user.id,
  );

  ghi_audit_log(req, 'CREATE', 'ho_so', result.lastInsertRowid, null,
    { ho_ten, loai_ho_so }, 'Thêm nhân viên mới');

  const newStaff = db.prepare('SELECT * FROM ho_so WHERE id = ?').get(result.lastInsertRowid);
  delete newStaff.mat_khau_hash;
  return success(res, newStaff, 'Thêm nhân viên thành công', 201);
};

// ── PUT /api/staff/:id ────────────────────────────────────
export const updateStaff = (req, res) => {
  const { id } = req.params;
  const old = db.prepare("SELECT * FROM ho_so WHERE id = ? AND loai_ho_so IN ('le_tan','nhan_vien') AND is_deleted = 0").get(id);
  if (!old) return error(res, 'Không tìm thấy nhân viên.', 404);

  const {
    ho_ten, gioi_tinh, ngay_sinh, so_dien_thoai, email,
    dia_chi_tam_tru, chuc_vu, chi_nhanh, ghi_chu,
  } = req.body;

  db.prepare(`
    UPDATE ho_so SET
      ho_ten         = COALESCE(?, ho_ten),
      gioi_tinh      = COALESCE(?, gioi_tinh),
      ngay_sinh      = COALESCE(?, ngay_sinh),
      so_dien_thoai  = COALESCE(?, so_dien_thoai),
      email          = COALESCE(?, email),
      dia_chi_tam_tru= COALESCE(?, dia_chi_tam_tru),
      chuc_vu        = COALESCE(?, chuc_vu),
      chi_nhanh      = COALESCE(?, chi_nhanh),
      ghi_chu        = COALESCE(?, ghi_chu),
      nguoi_cap_nhat_id = ?
    WHERE id = ?
  `).run(
    ho_ten || null, gioi_tinh || null, ngay_sinh || null, so_dien_thoai || null,
    email || null, dia_chi_tam_tru || null, chuc_vu || null, chi_nhanh || null,
    ghi_chu || null, req.user.id, id,
  );

  const updated = db.prepare('SELECT * FROM ho_so WHERE id = ?').get(id);
  ghi_audit_log(req, 'UPDATE', 'ho_so', parseInt(id), old, updated, 'Cập nhật thông tin nhân viên');
  delete updated.mat_khau_hash;
  return success(res, updated, 'Cập nhật nhân viên thành công');
};

// ── DELETE /api/staff/:id ─────────────────────────────────
// Soft Delete
export const deleteStaff = (req, res) => {
  const { id } = req.params;
  const { ly_do } = req.body;

  const staff = db.prepare("SELECT * FROM ho_so WHERE id = ? AND loai_ho_so IN ('le_tan','nhan_vien') AND is_deleted = 0").get(id);
  if (!staff) return error(res, 'Không tìm thấy nhân viên.', 404);

  db.prepare(`
    UPDATE ho_so SET
      is_deleted = 1,
      ngay_xoa = datetime('now','localtime'),
      nguoi_xoa_id = ?,
      ly_do_xoa = ?
    WHERE id = ?
  `).run(req.user.id, ly_do || 'Không có lý do', id);

  ghi_audit_log(req, 'DELETE', 'ho_so', parseInt(id), staff, null, ly_do || 'Xóa hồ sơ nhân viên');
  return success(res, null, 'Đã xóa nhân viên (Soft Delete)');
};
