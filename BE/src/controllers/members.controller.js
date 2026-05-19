/**
 * Hồ Sơ Controller — CRUD cho Hội viên, PT, Nhân viên
 * Tích hợp Cloudinary để upload ảnh
 */

import db from '../config/db.js';
import { success, error } from '../utils/response.js';
import { uploadImage, deleteImage, isCloudinaryReady } from '../utils/cloudinary.js';
import { ghi_audit_log } from '../utils/audit.js';
import { createNotification, createUserNotification } from '../utils/notifications.js';
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
      ((SELECT loai FROM luot_vao_ra WHERE ho_so_id = h.id AND date(thoi_diem) = date('now','localtime') ORDER BY id DESC LIMIT 1) = 'vao') AS da_check_in_hom_nay,
      EXISTS (SELECT 1 FROM dang_ky_goi_tap WHERE ho_so_id = h.id AND trang_thai = 'cho_duyet') AS co_yeu_cau_gia_han
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
      -- Gói tập đang hoạt động (sắp xếp mới nhất lên đầu)
      (SELECT json_group_array(json_object(
        'id', dk.id, 'ten_goi', gt.ten_goi, 'tu_ngay', dk.tu_ngay,
        'den_ngay', dk.den_ngay, 'gia_thuc_te', dk.gia_thuc_te, 'trang_thai', dk.trang_thai
      )) FROM dang_ky_goi_tap dk JOIN goi_tap gt ON gt.id = dk.goi_tap_id
       WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong'
       ORDER BY dk.den_ngay DESC, dk.id DESC) AS goi_tap_hien_tai,
      -- PT đang đăng ký
      (SELECT json_group_array(json_object(
        'id', dp.id, 'pt_id', dp.pt_id, 'goi_pt_id', dp.goi_pt_id, 'ten_pt', pt.ho_ten, 'avatar_pt', pt.avatar_url,
        'chuyen_mon', pt.chuyen_mon,
        'buoi_dang_ky', dp.so_buoi_dang_ky, 'buoi_da_tap', dp.so_buoi_da_tap,
        'tu_ngay', dp.tu_ngay, 'den_ngay', dp.den_ngay,
        'trang_thai', dp.trang_thai, 'gia_thuc_te', dp.gia_thuc_te, 'ghi_chu_tt', dp.ghi_chu_tt
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
       ORDER BY dk.den_ngay DESC LIMIT 1) AS ten_goi_tap,
      EXISTS (SELECT 1 FROM dang_ky_goi_tap WHERE ho_so_id = h.id AND trang_thai = 'cho_duyet') AS co_yeu_cau_gia_han
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
       ORDER BY dk.den_ngay DESC LIMIT 1) AS ten_goi_tap,
      EXISTS (SELECT 1 FROM dang_ky_goi_tap WHERE ho_so_id = h.id AND trang_thai = 'cho_duyet') AS co_yeu_cau_gia_han
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

// ── POST /api/members/:id/birthday-wish ──────────────────
// Gửi lời chúc sinh nhật thủ công cho 1 hội viên (admin, le_tan)
export const sendBirthdayWish = (req, res) => {
  const { id } = req.params;
  const hoSo = db.prepare('SELECT id, ho_ten FROM ho_so WHERE id = ? AND loai_ho_so = \'hoi_vien\' AND is_deleted = 0').get(id);
  if (!hoSo) return error(res, 'Không tìm thấy hội viên.', 404);

  const msg = `🎂 Chúc mừng sinh nhật ${hoSo.ho_ten}! Paradise GYM chúc bạn một ngày thật vui vẻ và tràn đầy năng lượng!`;
  createUserNotification(hoSo.id, '🎂 Chúc mừng sinh nhật!', msg, 'sinh_nhat');

  ghi_audit_log(req, 'NOTIFY', 'ho_so', hoSo.id, null, { loai: 'sinh_nhat' }, `Gửi lời chúc sinh nhật cho ${hoSo.ho_ten}`);
  return success(res, null, `Đã gửi lời chúc sinh nhật đến ${hoSo.ho_ten}.`);
};

// ── POST /api/members/birthday-wish-all ──────────────────
// Gửi lời chúc sinh nhật hàng loạt cho tất cả HV sinh nhật hôm nay (admin, le_tan)
export const sendBirthdayWishAll = (req, res) => {
  const todayBirthdays = db.prepare(`
    SELECT id, ho_ten FROM ho_so
    WHERE loai_ho_so = 'hoi_vien' AND is_deleted = 0
      AND strftime('%m-%d', ngay_sinh) = strftime('%m-%d', 'now', 'localtime')
  `).all();

  if (todayBirthdays.length === 0) return error(res, 'Hôm nay không có hội viên nào sinh nhật.', 404);

  for (const hv of todayBirthdays) {
    const msg = `🎂 Chúc mừng sinh nhật ${hv.ho_ten}! Paradise GYM chúc bạn một ngày thật vui vẻ và tràn đầy năng lượng!`;
    createUserNotification(hv.id, '🎂 Chúc mừng sinh nhật!', msg, 'sinh_nhat');
  }

  ghi_audit_log(req, 'NOTIFY', 'ho_so', null, null, { loai: 'sinh_nhat_hang_loat', so_luong: todayBirthdays.length }, `Gửi lời chúc sinh nhật hàng loạt cho ${todayBirthdays.length} hội viên`);
  return success(res, { so_luong: todayBirthdays.length }, `Đã gửi lời chúc đến ${todayBirthdays.length} hội viên sinh nhật hôm nay.`);
};

// ── GET /api/me/profile ───────────────────────────────────
export const getMyProfile = (req, res) => {
  let hoSo = db.prepare(`
    SELECT h.*, tk.ten_dang_nhap
    FROM ho_so h
    JOIN tai_khoan tk ON tk.id = h.tai_khoan_id
    WHERE tk.id = ? AND h.is_deleted = 0
  `).get(req.user.id);

  if (!hoSo) {
    // Fallback cực kỳ linh hoạt cho các tài khoản test có profile bị xóa hoặc chưa hoàn thiện
    const tk = db.prepare('SELECT ten_dang_nhap FROM tai_khoan WHERE id = ?').get(req.user.id);
    if (!tk) return error(res, 'Không tìm thấy thông tin tài khoản.', 404);

    hoSo = {
      id: req.user.id,
      ho_ten: tk.ten_dang_nhap,
      ten_dang_nhap: tk.ten_dang_nhap,
      loai_ho_so: req.user.vai_tro === 'pt' ? 'pt' : 'hoi_vien',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      goi_tap: [],
      dang_ky_pt: [],
      lich_day_sap_toi: []
    };
    return success(res, hoSo);
  }

  delete hoSo.mat_khau_hash;

  if (hoSo.loai_ho_so === 'hoi_vien') {
    hoSo.goi_tap = db.prepare(`
      SELECT dk.id, dk.tu_ngay, dk.den_ngay, dk.gia_thuc_te,
             CASE 
               WHEN dk.trang_thai = 'dang_hoat_dong' AND dk.den_ngay < date('now', 'localtime') THEN 'het_han'
               ELSE dk.trang_thai
             END AS trang_thai,
             gt.ten_goi, gt.so_thang
      FROM dang_ky_goi_tap dk
      JOIN goi_tap gt ON gt.id = dk.goi_tap_id
      WHERE dk.ho_so_id = ? AND dk.trang_thai IN ('dang_hoat_dong', 'cho_duyet')
      ORDER BY 
        CASE WHEN dk.trang_thai = 'dang_hoat_dong' THEN 0 ELSE 1 END,
        dk.den_ngay DESC
    `).all(hoSo.id);

    hoSo.dang_ky_pt = db.prepare(`
      SELECT dp.id, dp.so_buoi_dang_ky, dp.so_buoi_da_tap, dp.tu_ngay, dp.den_ngay,
             dp.trang_thai, pt.ho_ten AS ten_pt, pt.avatar_url AS avatar_pt, pt.chuyen_mon,
             gp.ten_goi AS ten_goi_pt
      FROM dang_ky_pt dp
      JOIN ho_so pt ON pt.id = dp.pt_id
      LEFT JOIN goi_pt gp ON gp.id = dp.goi_pt_id
      WHERE dp.hoi_vien_id = ? AND dp.trang_thai = 'dang_hoat_dong'
      ORDER BY
        CASE WHEN dp.den_ngay IS NULL THEN 1 ELSE 0 END,
        dp.den_ngay DESC,
        dp.ngay_tao DESC
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

  const validTT = ['tien_mat', 'chuyen_khoan'];
  if (!validTT.includes(phuong_thuc_tt)) {
    return error(res, `phuong_thuc_tt phải là: ${validTT.join(', ')}`, 400);
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
      (ho_so_id, goi_tap_id, tu_ngay, den_ngay, gia_thuc_te, ghi_chu_gia, phuong_thuc_tt, nguoi_thu_id, ma_giao_dich, ghi_chu_tt, nguoi_tao_id, nguoi_cap_nhat_id, trang_thai, ngay_thanh_toan)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'dang_hoat_dong', datetime('now','localtime'))
  `).run(id, goi_tap_id, tu_ngay, denNgay, gia_thuc_te, ghi_chu_gia || null,
    phuong_thuc_tt, req.user.id, ma_giao_dich || null, ghi_chu_tt || null, req.user.id, req.user.id);

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

// ── POST /api/members/me/package-request ──────────────────
export const requestPackageRenewal = (req, res) => {
  try {
    const { goi_tap_id, tu_ngay, ghi_chu } = req.body;

    if (!goi_tap_id || !tu_ngay) {
      return error(res, 'Thiếu thông tin: goi_tap_id, tu_ngay', 400);
    }

    // Lấy id hồ sơ từ user (hoi_vien)
    const hoSo = db.prepare('SELECT id, ho_ten FROM ho_so WHERE tai_khoan_id = ?').get(req.user.id);
    if (!hoSo) return error(res, 'Không tìm thấy hồ sơ hội viên gắn với tài khoản này.', 404);

    const goiTap = db.prepare('SELECT * FROM goi_tap WHERE id = ? AND is_deleted = 0').get(goi_tap_id);
    if (!goiTap) return error(res, 'Gói tập không tồn tại.', 404);

    const dateResult = db.prepare(`
      SELECT date(?, '+' || ? || ' months', '+' || ? || ' days') AS den_ngay
    `).get(tu_ngay, goiTap.so_thang || 0, goiTap.so_ngay_them || 0);

    const denNgay = dateResult ? dateResult.den_ngay : null;
    if (!denNgay) return error(res, 'Không thể tính toán ngày hết hạn. Vui lòng kiểm tra lại ngày bắt đầu.', 400);

    const result = db.prepare(`
      INSERT INTO dang_ky_goi_tap
        (ho_so_id, goi_tap_id, tu_ngay, den_ngay, gia_thuc_te, ghi_chu_gia, trang_thai, nguoi_tao_id, nguoi_cap_nhat_id)
      VALUES (?, ?, ?, ?, ?, ?, 'cho_duyet', ?, ?)
    `).run(hoSo.id, goi_tap_id, tu_ngay, denNgay, goiTap.gia, ghi_chu || 'Yêu cầu gia hạn từ App', req.user.id, req.user.id);

    createNotification(
      'gia_han_goi_tap',
      'Yêu cầu gia hạn mới',
      `${hoSo.ho_ten} vừa gửi yêu cầu gia hạn gói ${goiTap.ten_goi}. Vui lòng kiểm tra và duyệt.`,
      result.lastInsertRowid,
      'dang_ky_goi_tap',
      'admin'
    );

    return success(res, { id: result.lastInsertRowid }, 'Gửi yêu cầu gia hạn thành công. Vui lòng đến quầy lễ tân để hoàn tất thanh toán.', 201);
  } catch (err) {
    console.error('[BACKEND] Lỗi requestPackageRenewal:', err);
    return error(res, `Lỗi hệ thống: ${err.message}`, 500);
  }
};

// ── GET /api/members/package-requests ─────────────────────
export const getPackageRequests = (req, res) => {
  const requests = db.prepare(`
    SELECT
      dk.id, dk.ho_so_id, dk.goi_tap_id as goi_tap_id, dk.tu_ngay, dk.den_ngay,
      dk.gia_thuc_te, dk.ghi_chu_gia, dk.trang_thai, dk.ngay_tao,
      h.ho_ten, h.ma_ho_so, gt.ten_goi as ten_goi_tap
    FROM dang_ky_goi_tap dk
    JOIN ho_so h ON h.id = dk.ho_so_id
    JOIN goi_tap gt ON gt.id = dk.goi_tap_id
    WHERE dk.trang_thai = 'cho_duyet'
    ORDER BY dk.ngay_tao DESC
  `).all();

  return success(res, requests);
};

// ── PUT /api/members/package-requests/:id/approve ─────────
export const approvePackageRequest = (req, res) => {
  const { id } = req.params;
  const { action, gia_thuc_te, phuong_thuc_tt, ghi_chu_tt } = req.body; // action: 'approve' or 'reject'

  if (action !== 'reject') {
    const validTT = ['tien_mat', 'chuyen_khoan'];
    if (phuong_thuc_tt && !validTT.includes(phuong_thuc_tt)) {
      return error(res, `phuong_thuc_tt phải là: ${validTT.join(', ')}`, 400);
    }
  }

  const request = db.prepare(`
    SELECT dk.*, gt.ten_goi
    FROM dang_ky_goi_tap dk
    LEFT JOIN goi_tap gt ON gt.id = dk.goi_tap_id
    WHERE dk.id = ?
  `).get(id);
  if (!request) return error(res, 'Không tìm thấy yêu cầu.', 404);
  if (request.trang_thai !== 'cho_duyet') return error(res, 'Yêu cầu này đã được xử lý.', 400);

  const member = db.prepare('SELECT ho_ten FROM ho_so WHERE id = ?').get(request.ho_so_id);

  if (action === 'reject') {
    db.prepare('UPDATE dang_ky_goi_tap SET trang_thai = ?, nguoi_cap_nhat_id = ? WHERE id = ?')
      .run('huy', req.user.id, id);

    createUserNotification(
      request.ho_so_id,
      'Yêu cầu bị từ chối ❌',
      `Yêu cầu gia hạn gói "${request.ten_goi || 'Hội viên'}" của bạn đã bị từ chối. Vui lòng liên hệ lễ tân để biết thêm chi tiết.`,
      'nhac_nho_gia_han'
    );

    return success(res, null, 'Đã từ chối yêu cầu gia hạn.');
  }

  // Approve: Chuyển sang dang_hoat_dong và cập nhật thông tin thanh toán
  db.prepare(`
    UPDATE dang_ky_goi_tap SET
      trang_thai = 'dang_hoat_dong',
      gia_thuc_te = COALESCE(?, gia_thuc_te),
      phuong_thuc_tt = ?,
      nguoi_thu_id = ?,
      ghi_chu_tt = ?,
      nguoi_cap_nhat_id = ?,
      ngay_thanh_toan = datetime('now','localtime')
    WHERE id = ?
  `).run(gia_thuc_te, phuong_thuc_tt || 'tien_mat', req.user.id, ghi_chu_tt || 'Duyệt từ App', req.user.id, id);

  ghi_audit_log(req, 'UPDATE', 'dang_ky_goi_tap', id, request, { trang_thai: 'dang_hoat_dong' }, `Duyệt gia hạn gói tập cho ${member.ho_ten}`);

  createUserNotification(
    request.ho_so_id,
    'Gia hạn thành công 🎉',
    `Gói tập "${request.ten_goi}" của bạn đã được kích hoạt thành công. Chúc bạn có những buổi tập hiệu quả!`,
    'thong_bao_chung'
  );

  return success(res, null, 'Duyệt gia hạn gói tập thành công.');
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

    // NEW: Lấy thông báo từ bảng thong_bao_user
    const userNotifs = db.prepare(`
      SELECT id, loai, tieu_de, noi_dung, da_doc, ngay_tao
      FROM thong_bao_user
      WHERE ho_so_id = ?
      ORDER BY ngay_tao DESC LIMIT 10
    `).all(ho_so_id);

    userNotifs.forEach(un => {
      let muc_do = 'info';
      if (un.loai === 'nhac_nho_gia_han' || un.loai === 'broadcast_danger') muc_do = 'danger';
      else if (un.loai === 'broadcast_warning') muc_do = 'warning';

      notifications.push({
        id: un.id,
        muc_do: muc_do,
        icon: un.loai === 'nhac_nho_gia_han' ? 'notification_important' : (un.loai.startsWith('broadcast') ? 'campaign' : 'chat'),
        tieu_de: un.tieu_de,
        noi_dung: un.noi_dung,
        ngay_tao: un.ngay_tao,
        is_custom: true,
        da_doc: un.da_doc
      });
    });

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

    // 5. Check-in hôm nay — lấy lượt vào gần nhất trong ngày
    const checkInHomNay = db.prepare(`
      SELECT id, phuong_thuc, strftime('%H:%M', thoi_diem) AS gio_hien_thi
      FROM luot_vao_ra
      WHERE ho_so_id = ? AND loai = 'vao'
        AND date(thoi_diem) = date('now','localtime')
      ORDER BY thoi_diem DESC
      LIMIT 1
    `).get(ho_so_id);

    da_check_in_hom_nay = !!checkInHomNay;

    if (checkInHomNay) {
      notifications.push({
        muc_do: 'success',
        icon: 'check_circle',
        tieu_de: 'Check-in thành công',
        noi_dung: `Bạn đã check-in thành công lúc ${checkInHomNay.gio_hien_thi || 'hôm nay'}${checkInHomNay.phuong_thuc === 'qr_code' ? ' bằng mã QR' : ''}. Chúc bạn có một buổi tập hiệu quả!`,
      });
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

    // ── THÔNG BÁO TỪ BẢNG thong_bao_user (Cho cả HV và PT) ─────
    const ptNotifs = db.prepare(`
      SELECT id, loai, tieu_de, noi_dung, da_doc, ngay_tao
      FROM thong_bao_user
      WHERE ho_so_id = ?
      ORDER BY ngay_tao DESC LIMIT 10
    `).all(ho_so_id);

    ptNotifs.forEach(un => {
      let muc_do = 'info';
      if (un.loai === 'broadcast_danger') muc_do = 'danger';
      else if (un.loai === 'broadcast_warning') muc_do = 'warning';

      notifications.push({
        id: un.id,
        muc_do: muc_do,
        icon: un.loai.startsWith('broadcast') ? 'campaign' : 'chat',
        tieu_de: un.tieu_de,
        noi_dung: un.noi_dung,
        ngay_tao: un.ngay_tao,
        is_custom: true,
        da_doc: un.da_doc
      });
    });
  }

  // Sắp xếp theo mức độ ưu tiên: danger(1) > warning(2) > info(3) > success(4)
  const MUC_DO_ORDER = { danger: 1, warning: 2, info: 3, success: 4 };
  notifications.sort((a, b) => (MUC_DO_ORDER[a.muc_do] || 5) - (MUC_DO_ORDER[b.muc_do] || 5));

  return success(res, { notifications, da_check_in_hom_nay });
};

// ── POST /api/members/:id/notify ───────────────────────────
export const notifyMember = (req, res) => {
  const { id } = req.params;
  const { tieu_de, noi_dung, loai } = req.body;

  if (!tieu_de || !noi_dung) return error(res, 'Thiếu tiêu đề hoặc nội dung.', 400);

  const hoSo = db.prepare('SELECT id FROM ho_so WHERE id = ? AND is_deleted = 0').get(id);
  if (!hoSo) return error(res, 'Không tìm thấy hồ sơ hội viên.', 404);

  db.prepare(`
    INSERT INTO thong_bao_user (ho_so_id, loai, tieu_de, noi_dung)
    VALUES (?, ?, ?, ?)
  `).run(id, loai || 'thong_bao_chung', tieu_de, noi_dung);

  return success(res, null, 'Đã gửi thông báo thành công.');
};

// ── POST /api/members/me/notifications/read ──────────────────
export const markMyNotificationsRead = (req, res) => {
  const userId = req.user.id;

  // Lấy ho_so_id gắn với user
  const hoSo = db.prepare('SELECT id FROM ho_so WHERE tai_khoan_id = ?').get(userId);
  if (!hoSo) return error(res, 'Không tìm thấy hồ sơ hội viên.', 404);

  db.prepare(`
    UPDATE thong_bao_user SET da_doc = 1 
    WHERE ho_so_id = ? AND da_doc = 0
  `).run(hoSo.id);

  return success(res, null, 'Đã đánh dấu tất cả thông báo là đã đọc.');
};

// ── DELETE /api/members/me/notifications ──────────────────────
export const clearMyNotifications = (req, res) => {
  const userId = req.user.id;
  const hoSo = db.prepare('SELECT id FROM ho_so WHERE tai_khoan_id = ?').get(userId);
  if (!hoSo) return error(res, 'Không tìm thấy hồ sơ hội viên.', 404);

  db.prepare('DELETE FROM thong_bao_user WHERE ho_so_id = ?').run(hoSo.id);
  return success(res, null, 'Đã xoá sạch thông báo cá nhân.');
};

// ── PATCH /api/members/:id/package/:pkgId/cancel ──────────────
export const cancelPackage = (req, res) => {
  const { id, pkgId } = req.params;
  const { ly_do_huy, so_tien_hoan = 0 } = req.body;

  const hoSo = db.prepare('SELECT id, ho_ten FROM ho_so WHERE id = ? AND is_deleted = 0').get(id);
  if (!hoSo) return error(res, 'Không tìm thấy hồ sơ hội viên.', 404);

  const pkg = db.prepare(`
    SELECT dk.*, gt.ten_goi
    FROM dang_ky_goi_tap dk
    JOIN goi_tap gt ON gt.id = dk.goi_tap_id
    WHERE dk.id = ? AND dk.ho_so_id = ?
  `).get(pkgId, id);
  if (!pkg) return error(res, 'Không tìm thấy đăng ký gói tập.', 404);
  if (pkg.trang_thai === 'huy') return error(res, 'Gói tập này đã bị hủy trước đó.', 400);
  if (pkg.trang_thai === 'het_han') return error(res, 'Không thể hủy gói tập đã hết hạn.', 400);

  const oldData = { ...pkg };
  db.prepare(`
    UPDATE dang_ky_goi_tap
    SET trang_thai = 'huy', ly_do_huy = ?, so_tien_hoan = ?, ngay_huy = datetime('now','localtime'),
        nguoi_cap_nhat_id = ?, ngay_cap_nhat = datetime('now','localtime')
    WHERE id = ?
  `).run(ly_do_huy || null, so_tien_hoan, req.user.id, pkgId);

  ghi_audit_log(req, 'UPDATE', 'dang_ky_goi_tap', pkgId, oldData,
    { trang_thai: 'huy', ly_do_huy, so_tien_hoan },
    `Hủy gói "${pkg.ten_goi}" của ${hoSo.ho_ten}`);

  // Thông báo cho admin/le_tan
  createNotification(
    'huy_buoi_tap',
    'Gói tập bị hủy',
    `${req.user.ten_dang_nhap || 'Nhân viên'} đã hủy gói "${pkg.ten_goi}" của ${hoSo.ho_ten}${so_tien_hoan > 0 ? `, hoàn tiền ${so_tien_hoan.toLocaleString('vi-VN')}đ` : ''}.`,
    pkgId,
    'dang_ky_goi_tap',
    'admin'
  );

  // Thông báo cho hội viên trên mobile
  createUserNotification(
    hoSo.id,
    'Gói tập đã bị hủy',
    `Gói tập "${pkg.ten_goi}" của bạn đã được hủy${ly_do_huy ? ` (${ly_do_huy})` : ''}. ${so_tien_hoan > 0 ? `Hoàn tiền: ${Number(so_tien_hoan).toLocaleString('vi-VN')}đ.` : ''} Liên hệ lễ tân để biết thêm chi tiết.`,
    'thong_bao_chung'
  );

  return success(res, null, `Đã hủy gói tập "${pkg.ten_goi}" thành công.`);
};

// ── PATCH /api/members/:id/package/:pkgId ─────────────────────
export const editPackage = (req, res) => {
  const { id, pkgId } = req.params;
  const { tu_ngay, den_ngay, gia_thuc_te, phuong_thuc_tt, ghi_chu_tt, ghi_chu_gia } = req.body;

  if (phuong_thuc_tt) {
    const validTT = ['tien_mat', 'chuyen_khoan'];
    if (!validTT.includes(phuong_thuc_tt)) {
      return error(res, `phuong_thuc_tt phải là: ${validTT.join(', ')}`, 400);
    }
  }

  const hoSo = db.prepare('SELECT id, ho_ten FROM ho_so WHERE id = ? AND is_deleted = 0').get(id);
  if (!hoSo) return error(res, 'Không tìm thấy hồ sơ hội viên.', 404);

  const pkg = db.prepare(`
    SELECT dk.*, gt.ten_goi
    FROM dang_ky_goi_tap dk
    JOIN goi_tap gt ON gt.id = dk.goi_tap_id
    WHERE dk.id = ? AND dk.ho_so_id = ?
  `).get(pkgId, id);
  if (!pkg) return error(res, 'Không tìm thấy đăng ký gói tập.', 404);
  if (pkg.trang_thai === 'huy') return error(res, 'Không thể chỉnh sửa gói tập đã hủy.', 400);

  if (tu_ngay && den_ngay && new Date(den_ngay) <= new Date(tu_ngay)) {
    return error(res, 'Ngày kết thúc phải sau ngày bắt đầu.', 400);
  }

  const oldData = { ...pkg };
  db.prepare(`
    UPDATE dang_ky_goi_tap
    SET tu_ngay = COALESCE(?, tu_ngay),
        den_ngay = COALESCE(?, den_ngay),
        gia_thuc_te = COALESCE(?, gia_thuc_te),
        phuong_thuc_tt = COALESCE(?, phuong_thuc_tt),
        ghi_chu_tt = COALESCE(?, ghi_chu_tt),
        ghi_chu_gia = COALESCE(?, ghi_chu_gia),
        nguoi_cap_nhat_id = ?,
        ngay_cap_nhat = datetime('now','localtime')
    WHERE id = ?
  `).run(tu_ngay || null, den_ngay || null, gia_thuc_te || null, phuong_thuc_tt || null,
         ghi_chu_tt || null, ghi_chu_gia || null, req.user.id, pkgId);

  ghi_audit_log(req, 'UPDATE', 'dang_ky_goi_tap', pkgId, oldData,
    { tu_ngay, den_ngay, gia_thuc_te, phuong_thuc_tt, ghi_chu_tt, ghi_chu_gia },
    `Chỉnh sửa gói "${pkg.ten_goi}" của ${hoSo.ho_ten}`);

  // Thông báo cho hội viên trên mobile
  createUserNotification(
    hoSo.id,
    'Thông tin gói tập được cập nhật',
    `Gói tập "${pkg.ten_goi}" của bạn vừa được cập nhật thông tin. Vui lòng kiểm tra lại trong ứng dụng.`,
    'thong_bao_chung'
  );

  return success(res, null, `Đã cập nhật gói tập "${pkg.ten_goi}" thành công.`);
};

// ── POST /api/members/:id/package/switch ──────────────────────
export const switchPackage = (req, res) => {
  const { id } = req.params;
  const { pkg_id_cu, goi_tap_id_moi, tu_ngay, ly_do_huy = 'Đổi sang gói mới', so_tien_hoan = 0,
          gia_thuc_te, phuong_thuc_tt, ghi_chu_tt } = req.body;

  if (phuong_thuc_tt) {
    const validTT = ['tien_mat', 'chuyen_khoan'];
    if (!validTT.includes(phuong_thuc_tt)) {
      return error(res, `phuong_thuc_tt phải là: ${validTT.join(', ')}`, 400);
    }
  }

  if (!pkg_id_cu || !goi_tap_id_moi || !tu_ngay) {
    return error(res, 'Thiếu thông tin: pkg_id_cu, goi_tap_id_moi, tu_ngay.', 400);
  }

  const hoSo = db.prepare('SELECT id, ho_ten FROM ho_so WHERE id = ? AND is_deleted = 0').get(id);
  if (!hoSo) return error(res, 'Không tìm thấy hồ sơ hội viên.', 404);

  const pkgCu = db.prepare(`
    SELECT dk.*, gt.ten_goi
    FROM dang_ky_goi_tap dk
    JOIN goi_tap gt ON gt.id = dk.goi_tap_id
    WHERE dk.id = ? AND dk.ho_so_id = ?
  `).get(pkg_id_cu, id);
  if (!pkgCu) return error(res, 'Không tìm thấy gói tập cũ.', 404);
  if (pkgCu.trang_thai === 'huy') return error(res, 'Gói tập cũ đã bị hủy rồi.', 400);

  const goiMoi = db.prepare('SELECT * FROM goi_tap WHERE id = ? AND is_deleted = 0').get(goi_tap_id_moi);
  if (!goiMoi) return error(res, 'Gói tập mới không tồn tại.', 404);

  // Tính ngày kết thúc cho gói mới
  let denNgay;
  if (goiMoi.so_thang && goiMoi.so_thang > 0) {
    const dateResult = db.prepare(`SELECT date(?, '+' || ? || ' months', '+' || COALESCE(?, 0) || ' days') AS den_ngay`)
      .get(tu_ngay, goiMoi.so_thang, goiMoi.so_ngay_them || 0);
    denNgay = dateResult?.den_ngay;
  } else if (goiMoi.so_ngay_them) {
    const dateResult = db.prepare(`SELECT date(?, '+' || ? || ' days') AS den_ngay`)
      .get(tu_ngay, goiMoi.so_ngay_them);
    denNgay = dateResult?.den_ngay;
  }
  if (!denNgay) return error(res, 'Không tính được ngày kết thúc cho gói mới.', 400);

  const switchTx = db.transaction(() => {
    // Hủy gói cũ
    db.prepare(`
      UPDATE dang_ky_goi_tap
      SET trang_thai = 'huy', ly_do_huy = ?, so_tien_hoan = ?, ngay_huy = datetime('now','localtime'),
          nguoi_cap_nhat_id = ?, ngay_cap_nhat = datetime('now','localtime')
      WHERE id = ?
    `).run(ly_do_huy, so_tien_hoan, req.user.id, pkg_id_cu);

    // Đăng ký gói mới
    const ins = db.prepare(`
      INSERT INTO dang_ky_goi_tap
        (ho_so_id, goi_tap_id, tu_ngay, den_ngay, gia_thuc_te, phuong_thuc_tt, ghi_chu_tt,
         trang_thai, nguoi_tao_id, nguoi_cap_nhat_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'dang_hoat_dong', ?, ?)
    `).run(hoSo.id, goi_tap_id_moi, tu_ngay, denNgay,
           gia_thuc_te ?? goiMoi.gia, phuong_thuc_tt || null, ghi_chu_tt || null,
           req.user.id, req.user.id);

    return ins.lastInsertRowid;
  });

  let newPkgId;
  try {
    newPkgId = switchTx();
  } catch (err) {
    console.error('[switchPackage] error:', err);
    return error(res, 'Lỗi khi đổi gói tập.', 500);
  }

  ghi_audit_log(req, 'UPDATE', 'dang_ky_goi_tap', pkg_id_cu, pkgCu,
    { trang_thai: 'huy', ly_do_huy, goi_moi_id: newPkgId },
    `Đổi gói "${pkgCu.ten_goi}" → "${goiMoi.ten_goi}" cho ${hoSo.ho_ten}`);

  // Thông báo cho admin
  createNotification(
    'gia_han_goi_tap',
    'Đổi gói tập',
    `${req.user.ten_dang_nhap || 'Nhân viên'} đã đổi gói "${pkgCu.ten_goi}" → "${goiMoi.ten_goi}" cho ${hoSo.ho_ten}.`,
    newPkgId,
    'dang_ky_goi_tap',
    'admin'
  );

  // Thông báo cho hội viên trên mobile
  createUserNotification(
    hoSo.id,
    'Gói tập đã được đổi',
    `Gói tập cũ "${pkgCu.ten_goi}" đã được đổi sang gói "${goiMoi.ten_goi}" (hiệu lực từ ${new Date(tu_ngay).toLocaleDateString('vi-VN')} đến ${new Date(denNgay).toLocaleDateString('vi-VN')}).${so_tien_hoan > 0 ? ` Hoàn tiền gói cũ: ${Number(so_tien_hoan).toLocaleString('vi-VN')}đ.` : ''}`,
    'thong_bao_chung'
  );

  return success(res, { new_pkg_id: newPkgId, den_ngay: denNgay },
    `Đã đổi sang gói "${goiMoi.ten_goi}" thành công.`);
};

// ── GET /api/members/lookup ───────────────────────────────
// Tra cứu nhanh HV bằng SĐT / tên / mã hồ sơ (admin, le_tan)
export const lookupMember = (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) return error(res, 'Từ khoá phải có ít nhất 2 ký tự.', 400);

  const s = `%${q.trim()}%`;
  const rows = db.prepare(`
    SELECT
      h.id, h.ma_ho_so, h.ho_ten, h.so_dien_thoai, h.email, h.gioi_tinh, h.avatar_url,
      (SELECT gt.ten_goi FROM dang_ky_goi_tap dk JOIN goi_tap gt ON gt.id = dk.goi_tap_id
       WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong'
       ORDER BY dk.den_ngay DESC LIMIT 1) AS ten_goi_tap,
      (SELECT dk.den_ngay FROM dang_ky_goi_tap dk
       WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong'
       ORDER BY dk.den_ngay DESC LIMIT 1) AS het_han_goi_tap
    FROM ho_so h
    WHERE h.loai_ho_so = 'hoi_vien' AND h.is_deleted = 0
      AND (h.ho_ten LIKE ? OR h.so_dien_thoai LIKE ? OR h.ma_ho_so LIKE ?)
    ORDER BY h.ho_ten ASC
    LIMIT 20
  `).all(s, s, s);

  return success(res, rows);
};

// ── GET /api/members/me/payments ─────────────────────────
// HV xem lịch sử thanh toán gói tập của bản thân
export const getMyPayments = (req, res) => {
  const hoSo = db.prepare('SELECT id FROM ho_so WHERE tai_khoan_id = ?').get(req.user.id);
  if (!hoSo) return error(res, 'Không tìm thấy hồ sơ.', 404);

  const rows = db.prepare(`
    SELECT
      dk.id, dk.tu_ngay, dk.den_ngay, dk.gia_thuc_te, dk.phuong_thuc_tt,
      dk.trang_thai, dk.ghi_chu_tt, dk.ngay_tao,
      gt.ten_goi, gt.loai_goi
    FROM dang_ky_goi_tap dk
    JOIN goi_tap gt ON gt.id = dk.goi_tap_id
    WHERE dk.ho_so_id = ?
    ORDER BY dk.ngay_tao DESC
  `).all(hoSo.id);

  return success(res, rows);
};

// ── POST /api/members/me/package-pause-request ───────────
// HV yêu cầu tạm dừng gói tập đang hoạt động
export const requestPackagePause = (req, res) => {
  const hoSo = db.prepare('SELECT id, ho_ten FROM ho_so WHERE tai_khoan_id = ?').get(req.user.id);
  if (!hoSo) return error(res, 'Không tìm thấy hồ sơ.', 404);

  const { ly_do } = req.body;

  const pkg = db.prepare(`
    SELECT dk.id, dk.ho_so_id, dk.den_ngay, gt.ten_goi
    FROM dang_ky_goi_tap dk
    JOIN goi_tap gt ON gt.id = dk.goi_tap_id
    WHERE dk.ho_so_id = ? AND dk.trang_thai = 'dang_hoat_dong'
    ORDER BY dk.den_ngay DESC LIMIT 1
  `).get(hoSo.id);

  if (!pkg) return error(res, 'Không có gói tập đang hoạt động.', 404);

  // Ghi yêu cầu vào bảng yeu_cau_goi_tap (tái dụng bảng hiện có)
  const ins = db.prepare(`
    INSERT INTO yeu_cau_goi_tap (ho_so_id, dang_ky_id, loai_yeu_cau, ly_do, trang_thai, ngay_tao)
    VALUES (?, ?, 'tam_dung', ?, 'cho_duyet', datetime('now','localtime'))
  `).run(hoSo.id, pkg.id, ly_do || null);

  createNotification(
    'ho_so_moi',
    'Yêu cầu tạm dừng gói',
    `${hoSo.ho_ten} yêu cầu tạm dừng gói "${pkg.ten_goi}". Lý do: ${ly_do || 'Không có'}.`,
    ins.lastInsertRowid,
    'yeu_cau_goi_tap',
    'ca_hai'
  );

  return success(res, { request_id: ins.lastInsertRowid }, 'Đã gửi yêu cầu tạm dừng. Chờ admin/lễ tân duyệt.');
};

// ── GET /api/members/:id/package/:pkgId/invoice ──────────
// Lấy dữ liệu biên lai để hiển thị / in (admin, le_tan)
export const getInvoice = (req, res) => {
  const { id, pkgId } = req.params;

  const hoSo = db.prepare('SELECT id, ma_ho_so, ho_ten, so_dien_thoai, email FROM ho_so WHERE id = ? AND is_deleted = 0').get(id);
  if (!hoSo) return error(res, 'Không tìm thấy hồ sơ.', 404);

  const pkg = db.prepare(`
    SELECT dk.id, dk.tu_ngay, dk.den_ngay, dk.gia_thuc_te, dk.phuong_thuc_tt,
           dk.ghi_chu_tt, dk.trang_thai, dk.ngay_tao,
           gt.ten_goi, gt.loai_goi, gt.gia AS gia_niem_yet,
           tc.ten_dang_nhap AS thu_ngan
    FROM dang_ky_goi_tap dk
    JOIN goi_tap gt ON gt.id = dk.goi_tap_id
    LEFT JOIN tai_khoan tc ON tc.id = dk.nguoi_tao_id
    WHERE dk.id = ? AND dk.ho_so_id = ?
  `).get(pkgId, hoSo.id);

  if (!pkg) return error(res, 'Không tìm thấy đăng ký gói tập.', 404);

  const chiNhanh = db.prepare(`SELECT gia_tri FROM cau_hinh WHERE khoa = 'ten_phong_gym'`).get();

  return success(res, {
    phong_gym: chiNhanh?.gia_tri || 'Paradise GYM',
    hoi_vien: hoSo,
    goi_tap: pkg,
    ngay_in: new Date().toISOString(),
  });
};
