/**
 * Hồ Sơ Controller — CRUD cho Hội viên, PT, Nhân viên
 * Tích hợp Cloudinary để upload ảnh
 */

import db from '../config/db.js';
import { success, error } from '../utils/response.js';
import { uploadImage, deleteImage } from '../utils/cloudinary.js';
import { ghi_audit_log } from '../utils/audit.js';

// ── GET /api/members ──────────────────────────────────────
// Lấy danh sách hội viên (hỗ trợ filter và phân trang)
export const getMembers = (req, res) => {
  const { search, status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = `WHERE h.loai_ho_so = 'hoi_vien' AND h.is_deleted = 0`;
  const params = [];

  if (search) {
    where += ` AND (h.ho_ten LIKE ? OR h.ma_ho_so LIKE ? OR h.so_dien_thoai LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  // Lấy danh sách kèm thông tin gói tập từ view
  const rows = db.prepare(`
    SELECT
      h.id, h.ma_ho_so, h.ho_ten, h.gioi_tinh, h.ngay_sinh,
      h.so_dien_thoai, h.email, h.avatar_url, h.ghi_chu, h.ngay_tao,
      h.chi_nhanh, h.phong_tap, h.noi_sinh, h.cccd, h.que_quan,
      h.tinh_thanh, h.quan_huyen, h.phuong_xa, h.loai_hv,
      -- Tính trạng thái màu sắc (tương tự view v_trang_thai_hoi_vien)
      CASE
        WHEN NOT EXISTS (SELECT 1 FROM dang_ky_goi_tap dk WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong')
          THEN 'chua_dang_ky'
        WHEN (SELECT MAX(den_ngay) FROM dang_ky_goi_tap dk WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong')
             < date('now','localtime')
          THEN 'het_han'
        WHEN (SELECT MAX(den_ngay) FROM dang_ky_goi_tap dk WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong')
             <= date('now','localtime','+7 days')
          THEN 'sap_het_han'
        ELSE 'con_han'
      END AS trang_thai,
      (SELECT MAX(den_ngay) FROM dang_ky_goi_tap dk WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong') AS ngay_het_han,
      (SELECT gt.ten_goi FROM dang_ky_goi_tap dk JOIN goi_tap gt ON gt.id = dk.goi_tap_id
       WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong' ORDER BY dk.den_ngay DESC LIMIT 1) AS ten_goi_tap,
      (SELECT COUNT(*) FROM dang_ky_pt dp WHERE dp.hoi_vien_id = h.id AND dp.trang_thai = 'dang_hoat_dong') AS co_pt
    FROM ho_so h
    ${where}
    ORDER BY h.ngay_tao DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  // Lọc theo status nếu có (sau khi query vì tính từ subquery)
  const filtered = status ? rows.filter(r => r.trang_thai === status) : rows;

  // Đếm tổng
  const total = db.prepare(`SELECT COUNT(*) as cnt FROM ho_so h ${where}`).get(...params).cnt;

  return success(res, {
    data: filtered,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
};

// ── GET /api/members/:id ──────────────────────────────────
export const getMemberById = (req, res) => {
  const { id } = req.params;
  const member = db.prepare(`
    SELECT
      h.*,
      tk.ten_dang_nhap,
      -- Gói tập đang hoạt động
      (SELECT json_group_array(json_object(
        'id', dk.id, 'ten_goi', gt.ten_goi, 'tu_ngay', dk.tu_ngay,
        'den_ngay', dk.den_ngay, 'gia_thuc_te', dk.gia_thuc_te, 'trang_thai', dk.trang_thai
      )) FROM dang_ky_goi_tap dk JOIN goi_tap gt ON gt.id = dk.goi_tap_id
       WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong') AS goi_tap_hien_tai,
      -- PT đang đăng ký
      (SELECT json_group_array(json_object(
        'pt_id', dp.pt_id, 'ten_pt', pt.ho_ten, 'avatar_pt', pt.avatar_url,
        'buoi_dang_ky', dp.so_buoi_dang_ky, 'buoi_da_tap', dp.so_buoi_da_tap,
        'trang_thai', dp.trang_thai
      )) FROM dang_ky_pt dp JOIN ho_so pt ON pt.id = dp.pt_id
       WHERE dp.hoi_vien_id = h.id AND dp.trang_thai = 'dang_hoat_dong') AS pt_hien_tai
    FROM ho_so h
    LEFT JOIN tai_khoan tk ON tk.id = h.tai_khoan_id
    WHERE h.id = ? AND h.loai_ho_so = 'hoi_vien' AND h.is_deleted = 0
  `).get(id);

  if (!member) return error(res, 'Không tìm thấy hội viên.', 404);

  // Parse JSON strings
  member.goi_tap_hien_tai = JSON.parse(member.goi_tap_hien_tai || '[]');
  member.pt_hien_tai = JSON.parse(member.pt_hien_tai || '[]');
  delete member.mat_khau_hash;

  return success(res, member);
};

// ── POST /api/members ─────────────────────────────────────
export const createMember = async (req, res) => {
  const {
    ho_ten, gioi_tinh, ngay_sinh, so_dien_thoai, email, dia_chi_tam_tru, ghi_chu,
    loai_ho_so, chi_nhanh, phong_tap, noi_sinh, cccd, que_quan,
    tinh_thanh, quan_huyen, phuong_xa, chuyen_mon, chuc_vu, loai_hv
  } = req.body;

  if (!ho_ten) return error(res, 'Họ tên là bắt buộc.', 400);
  const loai = loai_ho_so || 'hoi_vien'; // Mặc định là hội viên

  let avatar_url = null;
  let cloudinary_public_id = null;

  // Upload ảnh nếu có
  if (req.file) {
    try {
      const result = await uploadImage(req.file.buffer, 'paradise-gym/profiles');
      avatar_url = result.url;
      cloudinary_public_id = result.publicId;
    } catch (err) {
      return error(res, `Lỗi upload ảnh: ${err.message}`, 500);
    }
  }

  // Tạo mã hồ sơ tự động theo loại: HV, PT, NV
  const prefixes = { 'hoi_vien': 'HV', 'pt': 'PT', 'nhan_vien': 'NV', 'le_tan': 'LT' };
  const prefix = prefixes[loai] || 'HS';

  const lastHoSo = db.prepare(`
    SELECT ma_ho_so FROM ho_so WHERE loai_ho_so = ? ORDER BY id DESC LIMIT 1
  `).get(loai);

  let nextNum = '001';
  if (lastHoSo && lastHoSo.ma_ho_so) {
    const match = lastHoSo.ma_ho_so.match(/\d+/);
    if (match) nextNum = String(parseInt(match[0]) + 1).padStart(3, '0');
  }
  const ma_ho_so = `${prefix}${nextNum}`;

  const result = db.prepare(`
    INSERT INTO ho_so (
      ma_ho_so, loai_ho_so, ho_ten, gioi_tinh, ngay_sinh, so_dien_thoai, email,
      dia_chi_tam_tru, avatar_url, cloudinary_public_id, ghi_chu, nguoi_tao_id,
      chi_nhanh, phong_tap, noi_sinh, cccd, que_quan, tinh_thanh, quan_huyen, phuong_xa,
      chuyen_mon, chuc_vu, loai_hv
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    ma_ho_so, loai, ho_ten, gioi_tinh || null, ngay_sinh || null, so_dien_thoai || null, email || null,
    dia_chi_tam_tru || null, avatar_url, cloudinary_public_id, ghi_chu || null, req.user.id,
    chi_nhanh || null, phong_tap || null, noi_sinh || null, cccd || null, que_quan || null,
    tinh_thanh || null, quan_huyen || null, phuong_xa || null, chuyen_mon || null, chuc_vu || null, loai_hv || null
  );

  const newMember = db.prepare('SELECT * FROM ho_so WHERE id = ?').get(result.lastInsertRowid);
  ghi_audit_log(req, 'CREATE', 'ho_so', result.lastInsertRowid, null, { ho_ten, loai_ho_so: loai }, `Thêm hồ sơ ${loai} mới`);

  return success(res, newMember, 'Thêm hồ sơ thành công', 201);
};

// ── PUT /api/members/:id ──────────────────────────────────
export const updateMember = (req, res) => {
  const { id } = req.params;
  const old = db.prepare('SELECT * FROM ho_so WHERE id = ? AND is_deleted = 0').get(id);
  if (!old) return error(res, 'Không tìm thấy hồ sơ.', 404);

  const {
    ho_ten, gioi_tinh, ngay_sinh, so_dien_thoai, email, dia_chi_tam_tru, ghi_chu,
    chi_nhanh, phong_tap, noi_sinh, cccd, que_quan, tinh_thanh, quan_huyen, phuong_xa,
    chuyen_mon, chuc_vu, loai_hv
  } = req.body;

  db.prepare(`
    UPDATE ho_so SET
      ho_ten = COALESCE(?, ho_ten),
      gioi_tinh = COALESCE(?, gioi_tinh),
      ngay_sinh = COALESCE(?, ngay_sinh),
      so_dien_thoai = COALESCE(?, so_dien_thoai),
      email = COALESCE(?, email),
      dia_chi_tam_tru = COALESCE(?, dia_chi_tam_tru),
      ghi_chu = COALESCE(?, ghi_chu),
      chi_nhanh = COALESCE(?, chi_nhanh),
      phong_tap = COALESCE(?, phong_tap),
      noi_sinh = COALESCE(?, noi_sinh),
      cccd = COALESCE(?, cccd),
      que_quan = COALESCE(?, que_quan),
      tinh_thanh = COALESCE(?, tinh_thanh),
      quan_huyen = COALESCE(?, quan_huyen),
      phuong_xa = COALESCE(?, phuong_xa),
      chuyen_mon = COALESCE(?, chuyen_mon),
      chuc_vu = COALESCE(?, chuc_vu),
      loai_hv = COALESCE(?, loai_hv),
      nguoi_cap_nhat_id = ?
    WHERE id = ?
  `).run(
    ho_ten || null, gioi_tinh || null, ngay_sinh || null, so_dien_thoai || null, email || null, dia_chi_tam_tru || null, ghi_chu || null,
    chi_nhanh || null, phong_tap || null, noi_sinh || null, cccd || null, que_quan || null, tinh_thanh || null, quan_huyen || null, phuong_xa || null,
    chuyen_mon || null, chuc_vu || null, loai_hv || null, req.user.id, id
  );

  const updated = db.prepare('SELECT * FROM ho_so WHERE id = ?').get(id);
  ghi_audit_log(req, 'UPDATE', 'ho_so', parseInt(id), old, updated, 'Cập nhật thông tin hồ sơ');

  return success(res, updated, 'Cập nhật thành công');
};

// ── PUT /api/members/:id/avatar ───────────────────────────
export const updateAvatar = async (req, res) => {
  const { id } = req.params;
  const member = db.prepare('SELECT * FROM ho_so WHERE id = ? AND is_deleted = 0').get(id);
  if (!member) return error(res, 'Không tìm thấy hồ sơ.', 404);
  if (!req.file) return error(res, 'Vui lòng chọn file ảnh.', 400);

  try {
    // Xóa ảnh cũ trên Cloudinary
    if (member.cloudinary_public_id) await deleteImage(member.cloudinary_public_id);

    // Upload ảnh mới
    const result = await uploadImage(req.file.buffer, 'paradise-gym/profiles', member.ma_ho_so);
    db.prepare(`
      UPDATE ho_so SET avatar_url = ?, cloudinary_public_id = ?, nguoi_cap_nhat_id = ? WHERE id = ?
    `).run(result.url, result.publicId, req.user.id, id);

    ghi_audit_log(req, 'UPDATE', 'ho_so', parseInt(id), { avatar_url: member.avatar_url }, { avatar_url: result.url }, 'Cập nhật ảnh đại diện');
    return success(res, { avatar_url: result.url }, 'Cập nhật ảnh thành công');
  } catch (err) {
    return error(res, `Lỗi upload ảnh: ${err.message}`, 500);
  }
};

// ── DELETE /api/members/:id ───────────────────────────────
// Soft Delete (KHÔNG xóa thật theo nghiệp vụ)
export const deleteMember = (req, res) => {
  const { id } = req.params;
  const { ly_do } = req.body;

  const member = db.prepare('SELECT * FROM ho_so WHERE id = ? AND is_deleted = 0').get(id);
  if (!member) return error(res, 'Không tìm thấy hội viên.', 404);

  db.prepare(`
    UPDATE ho_so SET
      is_deleted = 1,
      ngay_xoa = datetime('now','localtime'),
      nguoi_xoa_id = ?,
      ly_do_xoa = ?
    WHERE id = ?
  `).run(req.user.id, ly_do || 'Không có lý do', id);

  ghi_audit_log(req, 'DELETE', 'ho_so', parseInt(id), member, null, ly_do || 'Xóa hồ sơ hội viên');
  return success(res, null, 'Đã xoá hồ sơ hội viên (Soft Delete)');
};

// ── GET /api/members/expiring ─────────────────────────────
export const getExpiringMembers = (req, res) => {
  const { days = 7 } = req.query;
  const rows = db.prepare(`
    SELECT * FROM v_trang_thai_hoi_vien
    WHERE trang_thai_mau = 'sap_het_han'
      AND den_ngay_xa_nhat <= date('now','localtime','+' || ? || ' days')
    ORDER BY den_ngay_xa_nhat ASC
  `).all(parseInt(days));
  return success(res, rows);
};

// ── GET /api/members/expired ──────────────────────────────
export const getExpiredMembers = (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM v_trang_thai_hoi_vien
    WHERE trang_thai_mau = 'het_han'
    ORDER BY den_ngay_xa_nhat DESC
  `).all();
  return success(res, rows);
};

// ── GET /api/members/:id/history ─────────────────────────
// Lịch sử đăng ký gói tập của hội viên
export const getMemberHistory = (req, res) => {
  const { id } = req.params;
  const rows = db.prepare(`
    SELECT dk.*, gt.ten_goi, gt.so_thang, gt.so_ngay_them,
           thu.ho_ten AS ten_nguoi_thu
    FROM dang_ky_goi_tap dk
    JOIN goi_tap gt ON gt.id = dk.goi_tap_id
    LEFT JOIN ho_so thu ON thu.id = dk.nguoi_thu_id
    WHERE dk.ho_so_id = ?
    ORDER BY dk.ngay_tao DESC
  `).all(id);
  return success(res, rows);
};

// ── POST /api/members/:id/package ────────────────────────
// Đăng ký gói tập cho hội viên
export const registerPackage = (req, res) => {
  const { id } = req.params;
  const { goi_tap_id, tu_ngay, gia_thuc_te, phuong_thuc_tt, ma_giao_dich, ghi_chu_tt, ghi_chu_gia } = req.body;

  if (!goi_tap_id || !tu_ngay || gia_thuc_te === undefined || !phuong_thuc_tt) {
    return error(res, 'Thiếu thông tin bắt buộc: goi_tap_id, tu_ngay, gia_thuc_te, phuong_thuc_tt', 400);
  }

  const member = db.prepare('SELECT * FROM ho_so WHERE id = ? AND is_deleted = 0').get(id);
  if (!member) return error(res, 'Không tìm thấy hội viên.', 404);

  const goiTap = db.prepare('SELECT * FROM goi_tap WHERE id = ? AND is_deleted = 0').get(goi_tap_id);
  if (!goiTap) return error(res, 'Gói tập không tồn tại.', 404);

  // Tính ngày kết thúc = tu_ngay + so_thang tháng + so_ngay_them ngày
  const denNgay = db.prepare(`
    SELECT date(?, '+' || ? || ' months', '+' || ? || ' days') AS den_ngay
  `).get(tu_ngay, goiTap.so_thang, goiTap.so_ngay_them).den_ngay;

  const result = db.prepare(`
    INSERT INTO dang_ky_goi_tap
      (ho_so_id, goi_tap_id, tu_ngay, den_ngay, gia_thuc_te, ghi_chu_gia, phuong_thuc_tt, nguoi_thu_id, ma_giao_dich, ghi_chu_tt, nguoi_tao_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, goi_tap_id, tu_ngay, denNgay, gia_thuc_te, ghi_chu_gia || null,
         phuong_thuc_tt, req.user.id, ma_giao_dich || null, ghi_chu_tt || null, req.user.id);

  ghi_audit_log(req, 'CREATE', 'dang_ky_goi_tap', result.lastInsertRowid, null,
    { ho_so_id: id, goi_tap_id, gia: gia_thuc_te }, 'Đăng ký gói tập cho hội viên');

  return success(res, { id: result.lastInsertRowid, den_ngay: denNgay }, 'Đăng ký gói tập thành công', 201);
};
