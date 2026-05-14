/**
 * Hồ Sơ Controller — CRUD cho Hội viên, PT, Nhân viên
 * Tích hợp Cloudinary để upload ảnh
 */

import db from '../config/db.js';
import { success, error } from '../utils/response.js';
import { uploadImage, deleteImage, isCloudinaryReady } from '../utils/cloudinary.js';
import { ghi_audit_log } from '../utils/audit.js';
import { createNotification } from '../utils/notifications.js';
import bcrypt from 'bcryptjs';

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
      -- Tính trạng thái màu sắc
      CASE
        WHEN NOT EXISTS (SELECT 1 FROM dang_ky_goi_tap dk WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong')
             AND NOT EXISTS (SELECT 1 FROM dang_ky_pt dp WHERE dp.hoi_vien_id = h.id AND dp.trang_thai = 'dang_hoat_dong')
          THEN 'chua_dang_ky'
        WHEN (SELECT MAX(d_ngay) FROM (
                SELECT den_ngay as d_ngay FROM dang_ky_goi_tap WHERE ho_so_id = h.id AND trang_thai = 'dang_hoat_dong'
                UNION ALL
                SELECT den_ngay as d_ngay FROM dang_ky_pt WHERE hoi_vien_id = h.id AND trang_thai = 'dang_hoat_dong'
             )) < date('now','localtime')
          THEN 'het_han'
        WHEN (SELECT MAX(d_ngay) FROM (
                SELECT den_ngay as d_ngay FROM dang_ky_goi_tap WHERE ho_so_id = h.id AND trang_thai = 'dang_hoat_dong'
                UNION ALL
                SELECT den_ngay as d_ngay FROM dang_ky_pt WHERE hoi_vien_id = h.id AND trang_thai = 'dang_hoat_dong'
             )) <= date('now','localtime','+7 days')
          THEN 'sap_het_han'
        ELSE 'con_han'
      END AS trang_thai,
      (SELECT MAX(d_ngay) FROM (
         SELECT den_ngay as d_ngay FROM dang_ky_goi_tap WHERE ho_so_id = h.id AND trang_thai = 'dang_hoat_dong'
         UNION ALL
         SELECT den_ngay as d_ngay FROM dang_ky_pt WHERE hoi_vien_id = h.id AND trang_thai = 'dang_hoat_dong'
      )) AS ngay_het_han,
      (SELECT gt.ten_goi FROM dang_ky_goi_tap dk JOIN goi_tap gt ON gt.id = dk.goi_tap_id
       WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong' ORDER BY dk.den_ngay DESC LIMIT 1) AS ten_goi_tap,
      (SELECT COUNT(*) FROM dang_ky_pt dp WHERE dp.hoi_vien_id = h.id AND dp.trang_thai = 'dang_hoat_dong') AS co_pt,
      ((SELECT loai FROM luot_vao_ra WHERE ho_so_id = h.id AND date(thoi_diem) = date('now','localtime') ORDER BY id DESC LIMIT 1) = 'vao') AS da_check_in_hom_nay
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
        'id', dp.id, 'pt_id', dp.pt_id, 'ten_pt', pt.ho_ten, 'avatar_pt', pt.avatar_url,
        'chuyen_mon', pt.chuyen_mon,
        'buoi_dang_ky', dp.so_buoi_dang_ky, 'buoi_da_tap', dp.so_buoi_da_tap,
        'tu_ngay', dp.tu_ngay, 'den_ngay', dp.den_ngay,
        'trang_thai', dp.trang_thai
      )) FROM dang_ky_pt dp JOIN ho_so pt ON pt.id = dp.pt_id
       WHERE dp.hoi_vien_id = h.id AND dp.trang_thai = 'dang_hoat_dong') AS pt_hien_tai,
      ((SELECT loai FROM luot_vao_ra WHERE ho_so_id = h.id AND date(thoi_diem) = date('now','localtime') ORDER BY id DESC LIMIT 1) = 'vao') AS da_check_in_hom_nay
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
  const loai = loai_ho_so || 'hoi_vien';

  let avatar_url = null;
  let cloudinary_public_id = null;

  if (req.file) {
    if (!isCloudinaryReady) {
      console.error('❌ Thất bại: Cố gắng upload ảnh nhưng Cloudinary chưa được cấu hình trong .env');
      return error(res, 'Hệ thống chưa cấu hình lưu trữ ảnh (Cloudinary). Vui lòng kiểm tra file .env hoặc liên hệ admin.', 500);
    }
    try {
      const result = await uploadImage(req.file.buffer, 'paradise-gym/profiles');
      avatar_url = result.url;
      cloudinary_public_id = result.publicId;
    } catch (err) {
      return error(res, `Lỗi upload ảnh: ${err.message}`, 500);
    }
  }

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

  if (loai === 'hoi_vien') {
    createNotification(
      'ho_so_moi',
      `Hồ sơ mới — ${ho_ten}`,
      `Vừa tạo hồ sơ hội viên mới: ${ma_ho_so} ${ho_ten}`,
      result.lastInsertRowid,
      'ho_so',
      'admin'
    );
  }

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
    if (!isCloudinaryReady) {
      return error(res, 'Hệ thống chưa cấu hình lưu trữ ảnh (Cloudinary).', 500);
    }
    if (member.cloudinary_public_id) await deleteImage(member.cloudinary_public_id);

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
export const deleteMember = (req, res) => {
  const { id } = req.params;
  const { ly_do } = req.body;

  const member = db.prepare("SELECT * FROM ho_so WHERE id = ? AND loai_ho_so = 'hoi_vien'").get(id);
  if (!member) return error(res, 'Không tìm thấy hội viên.', 404);

  if (member.is_deleted) {
    return success(res, null, 'Hồ sơ hội viên đã được xoá trước đó');
  }

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

// ── GET /api/members/check-duplicate ─────────────────────
export const checkDuplicate = (req, res) => {
  const { field, value, exclude_id } = req.query;
  const allowed = ['so_dien_thoai', 'cccd', 'email'];
  if (!field || !allowed.includes(field)) return error(res, 'field không hợp lệ', 400);
  if (!value || !value.trim()) return success(res, { exists: false });

  let query = `SELECT id FROM ho_so WHERE ${field} = ? AND is_deleted = 0`;
  const params = [value.trim()];
  if (exclude_id) { query += ' AND id != ?'; params.push(exclude_id); }

  const row = db.prepare(query).get(...params);
  return success(res, { exists: !!row });
};

// ── GET /api/members/expiring ─────────────────────────────
// 🔧 ĐÃ SỬA: dùng query trực tiếp thay vì view để hỗ trợ days động
// và trả về đủ fields mà FE cần (ten_goi_tap, ngay_het_han, so_dien_thoai)
export const getExpiringMembers = (req, res) => {
  const days = parseInt(req.query.days) || 30; // ← mặc định 30 ngày cho trang danh sách

  const rows = db.prepare(`
    SELECT
      h.id, h.ma_ho_so, h.ho_ten, h.so_dien_thoai, h.email, h.avatar_url,
      'sap_het_han' AS trang_thai,
      (SELECT MAX(d_ngay) FROM (
         SELECT den_ngay as d_ngay FROM dang_ky_goi_tap
         WHERE ho_so_id = h.id AND trang_thai = 'dang_hoat_dong'
         UNION ALL
         SELECT den_ngay as d_ngay FROM dang_ky_pt
         WHERE hoi_vien_id = h.id AND trang_thai = 'dang_hoat_dong'
      )) AS ngay_het_han,
      (SELECT gt.ten_goi FROM dang_ky_goi_tap dk
       JOIN goi_tap gt ON gt.id = dk.goi_tap_id
       WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong'
       ORDER BY dk.den_ngay DESC LIMIT 1) AS ten_goi_tap
    FROM ho_so h
    WHERE h.loai_ho_so = 'hoi_vien'
      AND h.is_deleted = 0
      AND (
        SELECT MAX(d_ngay) FROM (
          SELECT den_ngay as d_ngay FROM dang_ky_goi_tap
          WHERE ho_so_id = h.id AND trang_thai = 'dang_hoat_dong'
          UNION ALL
          SELECT den_ngay as d_ngay FROM dang_ky_pt
          WHERE hoi_vien_id = h.id AND trang_thai = 'dang_hoat_dong'
        )
      ) BETWEEN date('now','localtime') AND date('now','localtime', '+' || ? || ' days')
    ORDER BY ngay_het_han ASC
  `).all(days);

  return success(res, rows);
};

// ── GET /api/members/expired ──────────────────────────────
// 🔧 ĐÃ SỬA: query trực tiếp để trả về đủ fields FE cần
export const getExpiredMembers = (req, res) => {
  const rows = db.prepare(`
    SELECT
      h.id, h.ma_ho_so, h.ho_ten, h.so_dien_thoai, h.email, h.avatar_url,
      'het_han' AS trang_thai,
      (SELECT MAX(d_ngay) FROM (
         SELECT den_ngay as d_ngay FROM dang_ky_goi_tap
         WHERE ho_so_id = h.id AND trang_thai = 'dang_hoat_dong'
         UNION ALL
         SELECT den_ngay as d_ngay FROM dang_ky_pt
         WHERE hoi_vien_id = h.id AND trang_thai = 'dang_hoat_dong'
      )) AS ngay_het_han,
      (SELECT gt.ten_goi FROM dang_ky_goi_tap dk
       JOIN goi_tap gt ON gt.id = dk.goi_tap_id
       WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong'
       ORDER BY dk.den_ngay DESC LIMIT 1) AS ten_goi_tap
    FROM ho_so h
    WHERE h.loai_ho_so = 'hoi_vien'
      AND h.is_deleted = 0
      AND NOT EXISTS (
        SELECT 1 FROM dang_ky_goi_tap dk
        WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong'
          AND dk.den_ngay >= date('now','localtime')
      )
      AND NOT EXISTS (
        SELECT 1 FROM dang_ky_pt dp
        WHERE dp.hoi_vien_id = h.id AND dp.trang_thai = 'dang_hoat_dong'
          AND (dp.den_ngay IS NULL OR dp.den_ngay >= date('now','localtime'))
          AND (dp.so_buoi_dang_ky IS NULL OR dp.so_buoi_dang_ky > dp.so_buoi_da_tap)
      )
      AND EXISTS (
        SELECT 1 FROM dang_ky_goi_tap dk2
        WHERE dk2.ho_so_id = h.id
      )
    ORDER BY ngay_het_han DESC
  `).all();

  return success(res, rows);
};

// ── GET /api/members/:id/history ─────────────────────────
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

// ── GET /api/members/birthday ────────────────────────────
export const getBirthday = (req, res) => {
  const { period = 'week' } = req.query;

  let condition;
  if (period === 'today') {
    condition = `strftime('%m-%d', h.ngay_sinh) = strftime('%m-%d', 'now', 'localtime')`;
  } else if (period === 'month') {
    condition = `strftime('%m', h.ngay_sinh) = strftime('%m', 'now', 'localtime')`;
  } else {
    condition = `strftime('%m-%d', h.ngay_sinh) BETWEEN
      strftime('%m-%d', 'now', 'localtime') AND
      strftime('%m-%d', 'now', 'localtime', '+7 days')`;
  }

  const rows = db.prepare(`
    SELECT h.id, h.ma_ho_so, h.ho_ten, h.ngay_sinh, h.so_dien_thoai, h.email, h.avatar_url,
           strftime('%d/%m', h.ngay_sinh) AS ngay_sinh_display
    FROM ho_so h
    WHERE h.loai_ho_so = 'hoi_vien'
      AND h.is_deleted = 0
      AND h.ngay_sinh IS NOT NULL
      AND ${condition}
    ORDER BY strftime('%m-%d', h.ngay_sinh) ASC
  `).all();

  return success(res, rows);
};

// ── GET /api/me/profile ───────────────────────────────────
export const getMyProfile = (req, res) => {
  const hoSo = db.prepare(`
    SELECT h.*, tk.ten_dang_nhap
    FROM ho_so h
    JOIN tai_khoan tk ON tk.id = h.tai_khoan_id
    WHERE tk.id = ? AND h.is_deleted = 0
  `).get(req.user.id);

  if (!hoSo) return error(res, 'Không tìm thấy hồ sơ.', 404);
  delete hoSo.mat_khau_hash;

  if (hoSo.loai_ho_so === 'hoi_vien') {
    hoSo.goi_tap = db.prepare(`
      SELECT dk.id, dk.tu_ngay, dk.den_ngay, dk.gia_thuc_te, dk.trang_thai,
             gt.ten_goi, gt.so_thang
      FROM dang_ky_goi_tap dk
      JOIN goi_tap gt ON gt.id = dk.goi_tap_id
      WHERE dk.ho_so_id = ? AND dk.trang_thai = 'dang_hoat_dong'
      ORDER BY dk.den_ngay DESC
    `).all(hoSo.id);

    hoSo.dang_ky_pt = db.prepare(`
      SELECT dp.id, dp.so_buoi_dang_ky, dp.so_buoi_da_tap, dp.tu_ngay, dp.den_ngay,
             dp.trang_thai, pt.ho_ten AS ten_pt, pt.avatar_url AS avatar_pt, pt.chuyen_mon
      FROM dang_ky_pt dp
      JOIN ho_so pt ON pt.id = dp.pt_id
      WHERE dp.hoi_vien_id = ? AND dp.trang_thai = 'dang_hoat_dong'
    `).all(hoSo.id);
  }

  if (hoSo.loai_ho_so === 'pt') {
    hoSo.lich_day_sap_toi = db.prepare(`
      SELECT lt.id, lt.ngay_tap, lt.gio_bat_dau, lt.gio_ket_thuc,
             lt.trang_thai, hv.ho_ten AS ten_hoi_vien
      FROM lich_tap lt
      JOIN ho_so hv ON hv.id = lt.hoi_vien_id
      WHERE lt.pt_id = ? AND lt.trang_thai = 'cho_tap'
        AND lt.ngay_tap >= date('now', 'localtime')
      ORDER BY lt.ngay_tap ASC, lt.gio_bat_dau ASC
      LIMIT 10
    `).all(hoSo.id);
  }

  return success(res, hoSo);
};

// ── POST /api/members/:id/package ────────────────────────
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

  createNotification(
    'gia_han_goi_tap',
    'Gia hạn gói tập',
    `${member.ho_ten} vừa đăng ký ${goiTap.ten_goi} — ${Number(gia_thuc_te).toLocaleString('vi-VN')}đ`,
    result.lastInsertRowid,
    'dang_ky_goi_tap',
    'admin'
  );

  return success(res, { id: result.lastInsertRowid, den_ngay: denNgay }, 'Đăng ký gói tập thành công', 201);
};

// ── POST /api/members/:id/create-account ─────────────────
export const createAccount = async (req, res) => {
  const { id } = req.params;
  const { ten_dang_nhap, mat_khau } = req.body;

  if (!ten_dang_nhap || !mat_khau) {
    return error(res, 'Thiếu tên đăng nhập hoặc mật khẩu.', 400);
  }
  if (mat_khau.length < 6) {
    return error(res, 'Mật khẩu phải có ít nhất 6 ký tự.', 400);
  }

  const hoSo = db.prepare('SELECT id, ho_ten, loai_ho_so, tai_khoan_id FROM ho_so WHERE id = ? AND is_deleted = 0').get(id);
  if (!hoSo) return error(res, 'Không tìm thấy hồ sơ.', 404);

  if (hoSo.tai_khoan_id) {
    return error(res, 'Hồ sơ này đã có tài khoản đăng nhập.', 409);
  }

  const existing = db.prepare('SELECT id FROM tai_khoan WHERE ten_dang_nhap = ?').get(ten_dang_nhap.trim());
  if (existing) {
    return error(res, 'Tên đăng nhập đã được sử dụng.', 409);
  }

  const roleMap = { hoi_vien: 'hoi_vien', pt: 'pt', le_tan: 'le_tan', nhan_vien: 'le_tan' };
  const maVaiTro = roleMap[hoSo.loai_ho_so] || 'hoi_vien';
  const vaiTro = db.prepare('SELECT id FROM vai_tro WHERE ma_vai_tro = ?').get(maVaiTro);
  if (!vaiTro) return error(res, 'Không xác định được vai trò.', 500);

  const hash = await bcrypt.hash(mat_khau, 12);

  const createTx = db.transaction(() => {
    const ins = db.prepare(`
      INSERT INTO tai_khoan (ten_dang_nhap, mat_khau_hash, vai_tro_id, nguoi_tao_id)
      VALUES (?, ?, ?, ?)
    `).run(ten_dang_nhap.trim(), hash, vaiTro.id, req.user.id);

    db.prepare('UPDATE ho_so SET tai_khoan_id = ? WHERE id = ?').run(ins.lastInsertRowid, id);
    return ins.lastInsertRowid;
  });

  const newTaiKhoanId = createTx();

  ghi_audit_log(req, 'CREATE', 'tai_khoan', newTaiKhoanId, null,
    { ho_so_id: id, ten_dang_nhap: ten_dang_nhap.trim(), vai_tro: maVaiTro },
    `Tạo tài khoản đăng nhập cho hồ sơ ${hoSo.ho_ten}`);

  const nguoiTao = req.user.ten_dang_nhap ||
    db.prepare('SELECT ten_dang_nhap FROM tai_khoan WHERE id = ?').get(req.user.id)?.ten_dang_nhap ||
    `ID ${req.user.id}`;

  createNotification(
    'tai_khoan_moi',
    'Tài khoản mới được tạo',
    `${nguoiTao} vừa tạo tài khoản cho ${hoSo.ho_ten} (${maVaiTro})`,
    newTaiKhoanId,
    'tai_khoan',
    'admin'
  );

  return success(res, { tai_khoan_id: newTaiKhoanId, ten_dang_nhap: ten_dang_nhap.trim() },
    'Tạo tài khoản thành công', 201);
};

// ── GET /api/me/notifications ─────────────────────────────
// Tính toán thông báo realtime từ DB, KHÔNG lưu vào bảng thong_bao
// Tự động phân biệt role từ req.user.vai_tro
export const getMyNotifications = (req, res) => {
  const { vai_tro, id: tai_khoan_id } = req.user;

  // Lấy hồ sơ liên kết với tài khoản
  const hoSo = db.prepare(`
    SELECT id, ho_ten, loai_ho_so FROM ho_so
    WHERE tai_khoan_id = ? AND is_deleted = 0
  `).get(tai_khoan_id);

  // Nếu không có hồ sơ → trả về rỗng (admin/le_tan không dùng endpoint này)
  if (!hoSo || (vai_tro !== 'hoi_vien' && vai_tro !== 'pt')) {
    return success(res, { notifications: [], da_check_in_hom_nay: false });
  }

  const ho_so_id = hoSo.id;
  const notifications = [];
  let da_check_in_hom_nay = false;

  // ── HÀNH TRÌNH HỘI VIÊN ─────────────────────────────────
  if (vai_tro === 'hoi_vien') {

    // 1. Gói tập ĐÃ HẾT HẠN (den_ngay < today, trang_thai = 'dang_hoat_dong')
    const goiHetHan = db.prepare(`
      SELECT dk.id, gt.ten_goi, dk.den_ngay
      FROM dang_ky_goi_tap dk
      JOIN goi_tap gt ON gt.id = dk.goi_tap_id
      WHERE dk.ho_so_id = ? AND dk.trang_thai = 'dang_hoat_dong'
        AND dk.den_ngay < date('now','localtime')
      ORDER BY dk.den_ngay DESC LIMIT 1
    `).get(ho_so_id);

    if (goiHetHan) {
      notifications.push({
        muc_do: 'danger',
        icon: 'warning',
        tieu_de: 'Gói tập đã hết hạn',
        noi_dung: `Gói "${goiHetHan.ten_goi}" của bạn đã hết hạn từ ${new Date(goiHetHan.den_ngay).toLocaleDateString('vi-VN')}. Liên hệ lễ tân để gia hạn ngay!`,
      });
    }

    // 2. Gói tập SẮP HẾT HẠN (den_ngay trong 7 ngày tới)
    const goiSapHet = db.prepare(`
      SELECT dk.id, gt.ten_goi, dk.den_ngay,
        CAST(julianday(dk.den_ngay) - julianday(date('now','localtime')) AS INTEGER) AS so_ngay_con
      FROM dang_ky_goi_tap dk
      JOIN goi_tap gt ON gt.id = dk.goi_tap_id
      WHERE dk.ho_so_id = ? AND dk.trang_thai = 'dang_hoat_dong'
        AND dk.den_ngay >= date('now','localtime')
        AND dk.den_ngay <= date('now','localtime','+7 days')
      ORDER BY dk.den_ngay ASC LIMIT 1
    `).get(ho_so_id);

    if (goiSapHet) {
      notifications.push({
        muc_do: goiSapHet.so_ngay_con <= 2 ? 'danger' : 'warning',
        icon: 'hourglass_top',
        tieu_de: 'Gói tập sắp hết hạn',
        noi_dung: `Gói "${goiSapHet.ten_goi}" còn ${goiSapHet.so_ngay_con} ngày (${new Date(goiSapHet.den_ngay).toLocaleDateString('vi-VN')}). Hãy gia hạn sớm để không gián đoạn!`,
      });
    }

    // 3. Gói PT SẮP HẾT BUỔI (so_buoi_dang_ky - so_buoi_da_tap <= 2)
    const goiPtSapHet = db.prepare(`
      SELECT dp.id, pt.ho_ten AS ten_pt,
        (dp.so_buoi_dang_ky - dp.so_buoi_da_tap) AS buoi_con_lai
      FROM dang_ky_pt dp
      JOIN ho_so pt ON pt.id = dp.pt_id
      WHERE dp.hoi_vien_id = ? AND dp.trang_thai = 'dang_hoat_dong'
        AND dp.so_buoi_dang_ky IS NOT NULL
        AND (dp.so_buoi_dang_ky - dp.so_buoi_da_tap) <= 2
        AND (dp.so_buoi_dang_ky - dp.so_buoi_da_tap) >= 0
      ORDER BY buoi_con_lai ASC LIMIT 1
    `).get(ho_so_id);

    if (goiPtSapHet) {
      notifications.push({
        muc_do: goiPtSapHet.buoi_con_lai === 0 ? 'danger' : 'warning',
        icon: 'sports_gymnastics',
        tieu_de: goiPtSapHet.buoi_con_lai === 0 ? 'Gói PT đã dùng hết buổi' : 'Gói PT sắp hết buổi',
        noi_dung: goiPtSapHet.buoi_con_lai === 0
          ? `Bạn đã dùng hết toàn bộ buổi tập với PT ${goiPtSapHet.ten_pt}. Đăng ký thêm để tiếp tục luyện tập!`
          : `Gói PT với ${goiPtSapHet.ten_pt} còn ${goiPtSapHet.buoi_con_lai} buổi. Liên hệ lễ tân để đăng ký thêm.`,
      });
    }

    // 4. Buổi PT HÔM NAY (lich_tap.ngay_tap = today AND trang_thai = 'cho_tap')
    const buoiHomNay = db.prepare(`
      SELECT lt.id, lt.gio_bat_dau, lt.gio_ket_thuc, lt.loai_buoi, lt.da_checkin,
             pt.ho_ten AS ten_pt
      FROM lich_tap lt
      JOIN ho_so pt ON pt.id = lt.pt_id
      WHERE lt.hoi_vien_id = ? AND lt.ngay_tap = date('now','localtime')
        AND lt.trang_thai = 'cho_tap'
      ORDER BY lt.gio_bat_dau ASC LIMIT 1
    `).get(ho_so_id);

    if (buoiHomNay) {
      const daCheckin = buoiHomNay.da_checkin === 1;
      notifications.push({
        muc_do: daCheckin ? 'success' : 'info',
        icon: daCheckin ? 'check_circle' : 'fitness_center',
        tieu_de: daCheckin ? 'Đã check-in — sẵn sàng tập' : 'Có buổi PT hôm nay',
        noi_dung: daCheckin
          ? `Bạn đã check-in thành công. Buổi tập với PT ${buoiHomNay.ten_pt} lúc ${buoiHomNay.gio_bat_dau} đang chờ bạn!`
          : `Buổi tập với PT ${buoiHomNay.ten_pt} vào lúc ${buoiHomNay.gio_bat_dau}–${buoiHomNay.gio_ket_thuc}. Nhớ check-in trước khi vào tập nhé!`,
      });
    }

    // 5. Check-in hôm nay — lấy lượt vào đầu tiên trong ngày
    const checkInHomNay = db.prepare(`
      SELECT id FROM luot_vao_ra
      WHERE ho_so_id = ? AND loai = 'vao'
        AND date(thoi_diem) = date('now','localtime')
      LIMIT 1
    `).get(ho_so_id);

    da_check_in_hom_nay = !!checkInHomNay;

    if (!checkInHomNay && !buoiHomNay) {
      // Chỉ nhắc check-in nếu chưa vào và không có thông báo buổi tập
      // (tránh thông báo trùng lặp)
    }

    // 6. Buổi PT bị HỦY trong 7 ngày qua
    const buoiHuy = db.prepare(`
      SELECT COUNT(*) AS so_buoi_huy
      FROM lich_tap
      WHERE hoi_vien_id = ? AND trang_thai = 'da_huy'
        AND ngay_huy >= date('now','localtime','-7 days')
    `).get(ho_so_id);

    if (buoiHuy && buoiHuy.so_buoi_huy > 0) {
      notifications.push({
        muc_do: 'warning',
        icon: 'event_busy',
        tieu_de: 'Buổi tập bị hủy gần đây',
        noi_dung: `Có ${buoiHuy.so_buoi_huy} buổi tập bị hủy trong 7 ngày qua. Liên hệ lễ tân để sắp xếp lại lịch tập.`,
      });
    }
  }

  // ── HÀNH TRÌNH PT ────────────────────────────────────────
  if (vai_tro === 'pt') {

    // 1. Học viên vừa CHECK-IN có lịch hôm nay (nhắc PT chuẩn bị)
    const hvCheckinHomNay = db.prepare(`
      SELECT COUNT(DISTINCT lt.hoi_vien_id) AS so_hv
      FROM lich_tap lt
      WHERE lt.pt_id = ? AND lt.ngay_tap = date('now','localtime')
        AND lt.trang_thai = 'cho_tap' AND lt.da_checkin = 1
    `).get(ho_so_id);

    if (hvCheckinHomNay && hvCheckinHomNay.so_hv > 0) {
      notifications.push({
        muc_do: 'info',
        icon: 'how_to_reg',
        tieu_de: 'Học viên đã vào phòng tập',
        noi_dung: `${hvCheckinHomNay.so_hv} học viên đã check-in và có lịch tập với bạn hôm nay. Hãy chuẩn bị!`,
      });
    }

    // 2. Buổi tập HÔM NAY chưa check-in và còn ≤ 30 phút đến giờ tập
    const buoiSapToi = db.prepare(`
      SELECT lt.id, lt.gio_bat_dau, hv.ho_ten AS ten_hv
      FROM lich_tap lt
      JOIN ho_so hv ON hv.id = lt.hoi_vien_id
      WHERE lt.pt_id = ? AND lt.ngay_tap = date('now','localtime')
        AND lt.trang_thai = 'cho_tap' AND lt.da_checkin = 0
        AND time(lt.gio_bat_dau) <= time('now','localtime','+30 minutes')
        AND time(lt.gio_bat_dau) >= time('now','localtime')
      ORDER BY lt.gio_bat_dau ASC LIMIT 1
    `).get(ho_so_id);

    if (buoiSapToi) {
      notifications.push({
        muc_do: 'warning',
        icon: 'schedule',
        tieu_de: 'Học viên chưa check-in',
        noi_dung: `${buoiSapToi.ten_hv} chưa check-in nhưng lịch tập bắt đầu lúc ${buoiSapToi.gio_bat_dau}. Vui lòng xác nhận với lễ tân.`,
      });
    }

    // 3. Lịch tập MỚI được đặt trong 24h qua
    const lichMoi = db.prepare(`
      SELECT COUNT(*) AS so_lich
      FROM lich_tap
      WHERE pt_id = ? AND trang_thai = 'cho_tap'
        AND ngay_tao >= datetime('now','localtime','-24 hours')
    `).get(ho_so_id);

    if (lichMoi && lichMoi.so_lich > 0) {
      notifications.push({
        muc_do: 'success',
        icon: 'event_available',
        tieu_de: 'Lịch tập mới',
        noi_dung: `Có ${lichMoi.so_lich} buổi tập mới vừa được đặt trong 24 giờ qua. Kiểm tra lịch của bạn!`,
      });
    }

    // 4. Buổi tập bị HỦY trong 7 ngày qua
    const buoiHuyPt = db.prepare(`
      SELECT COUNT(*) AS so_huy
      FROM lich_tap
      WHERE pt_id = ? AND trang_thai = 'da_huy'
        AND ngay_huy >= date('now','localtime','-7 days')
    `).get(ho_so_id);

    if (buoiHuyPt && buoiHuyPt.so_huy > 0) {
      notifications.push({
        muc_do: 'warning',
        icon: 'event_busy',
        tieu_de: 'Buổi tập bị hủy gần đây',
        noi_dung: `${buoiHuyPt.so_huy} buổi tập bị hủy trong 7 ngày qua. Xem lại lịch để cập nhật kế hoạch.`,
      });
    }

    // 5. Học viên MỚI đăng ký gói PT trong 7 ngày qua
    const hvMoi = db.prepare(`
      SELECT COUNT(*) AS so_hv
      FROM dang_ky_pt
      WHERE pt_id = ? AND trang_thai = 'dang_hoat_dong'
        AND ngay_tao >= date('now','localtime','-7 days')
    `).get(ho_so_id);

    if (hvMoi && hvMoi.so_hv > 0) {
      notifications.push({
        muc_do: 'success',
        icon: 'person_add',
        tieu_de: 'Học viên mới đăng ký',
        noi_dung: `${hvMoi.so_hv} học viên vừa đăng ký gói PT với bạn trong 7 ngày qua. Hãy liên hệ để lên kế hoạch tập luyện!`,
      });
    }
  }

  // Sắp xếp theo mức độ ưu tiên: danger(1) > warning(2) > info(3) > success(4)
  const MUC_DO_ORDER = { danger: 1, warning: 2, info: 3, success: 4 };
  notifications.sort((a, b) => (MUC_DO_ORDER[a.muc_do] || 5) - (MUC_DO_ORDER[b.muc_do] || 5));

  return success(res, { notifications, da_check_in_hom_nay });
};