/**
 * Trainers Controller — Quản lý PT/Huấn luyện viên
 * Tích hợp upload ảnh Cloudinary
 */

import db from '../config/db.js';
import { success, error } from '../utils/response.js';
import { uploadImage, deleteImage } from '../utils/cloudinary.js';
import { ghi_audit_log } from '../utils/audit.js';

// ── GET /api/trainers ─────────────────────────────────────
export const getTrainers = (req, res) => {
  const { search } = req.query;
  let where = `WHERE h.loai_ho_so = 'pt' AND h.is_deleted = 0`;
  const params = [];

  if (search) {
    where += ` AND (h.ho_ten LIKE ? OR h.so_dien_thoai LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  const rows = db.prepare(`
    SELECT
      h.id, h.ma_ho_so, h.ho_ten, h.gioi_tinh, h.ngay_sinh,
      h.so_dien_thoai, h.email, h.avatar_url, h.ghi_chu, h.ngay_tao,
      -- Số học viên đang tập
      (SELECT COUNT(DISTINCT dp.hoi_vien_id) FROM dang_ky_pt dp WHERE dp.pt_id = h.id AND dp.trang_thai = 'dang_hoat_dong') AS so_hoc_vien,
      -- Tổng buổi đã dạy
      (SELECT COUNT(*) FROM lich_tap lt WHERE lt.pt_id = h.id AND lt.trang_thai = 'da_tap') AS tong_buoi_da_day,
      -- Gói PT đang nhận
      (SELECT COUNT(*) FROM dang_ky_pt dp WHERE dp.pt_id = h.id AND dp.trang_thai = 'dang_hoat_dong') AS so_goi_dang_day
    FROM ho_so h
    ${where}
    ORDER BY h.ho_ten ASC
  `).all(...params);

  return success(res, rows);
};

// ── GET /api/trainers/:id ─────────────────────────────────
export const getTrainerById = (req, res) => {
  const { id } = req.params;
  const trainer = db.prepare(`
    SELECT h.*,
           (SELECT json_group_array(json_object(
             'hoi_vien_id', dp.hoi_vien_id, 'ten_hoi_vien', hv.ho_ten,
             'avatar_hoi_vien', hv.avatar_url, 'buoi_con_lai', dp.so_buoi_dang_ky - dp.so_buoi_da_tap,
             'trang_thai', dp.trang_thai
           )) FROM dang_ky_pt dp JOIN ho_so hv ON hv.id = dp.hoi_vien_id
            WHERE dp.pt_id = h.id AND dp.trang_thai = 'dang_hoat_dong') AS hoc_vien_hien_tai
    FROM ho_so h
    WHERE h.id = ? AND h.loai_ho_so = 'pt' AND h.is_deleted = 0
  `).get(id);

  if (!trainer) return error(res, 'Không tìm thấy PT.', 404);
  trainer.hoc_vien_hien_tai = JSON.parse(trainer.hoc_vien_hien_tai || '[]');
  return success(res, trainer);
};

// ── POST /api/trainers ────────────────────────────────────
export const createTrainer = async (req, res) => {
  const { ho_ten, gioi_tinh, ngay_sinh, so_dien_thoai, email, ghi_chu } = req.body;
  if (!ho_ten) return error(res, 'Họ tên là bắt buộc.', 400);

  let avatar_url = null, cloudinary_public_id = null;
  if (req.file) {
    try {
      const result = await uploadImage(req.file.buffer, 'paradise-gym/trainers');
      avatar_url = result.url;
      cloudinary_public_id = result.publicId;
    } catch (err) {
      return error(res, `Lỗi upload ảnh: ${err.message}`, 500);
    }
  }

  const lastMaHoSo = db.prepare(`SELECT ma_ho_so FROM ho_so WHERE loai_ho_so = 'pt' ORDER BY id DESC LIMIT 1`).get();
  const nextNum = lastMaHoSo ? String(parseInt(lastMaHoSo.ma_ho_so.replace('PT', '')) + 1).padStart(3, '0') : '001';
  const ma_ho_so = `PT${nextNum}`;

  const result = db.prepare(`
    INSERT INTO ho_so (ma_ho_so, loai_ho_so, ho_ten, gioi_tinh, ngay_sinh, so_dien_thoai, email, avatar_url, cloudinary_public_id, ghi_chu, nguoi_tao_id)
    VALUES (?, 'pt', ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(ma_ho_so, ho_ten, gioi_tinh || null, ngay_sinh || null, so_dien_thoai || null, email || null, avatar_url, cloudinary_public_id, ghi_chu || null, req.user.id);

  ghi_audit_log(req, 'CREATE', 'ho_so', result.lastInsertRowid, null, { ho_ten, loai_ho_so: 'pt' }, 'Thêm PT mới');
  return success(res, db.prepare('SELECT * FROM ho_so WHERE id = ?').get(result.lastInsertRowid), 'Thêm PT thành công', 201);
};

// ── PUT /api/trainers/:id ─────────────────────────────────
export const updateTrainer = (req, res) => {
  const { id } = req.params;
  const old = db.prepare(`SELECT * FROM ho_so WHERE id = ? AND loai_ho_so = 'pt' AND is_deleted = 0`).get(id);
  if (!old) return error(res, 'Không tìm thấy PT.', 404);

  const { ho_ten, gioi_tinh, ngay_sinh, so_dien_thoai, email, ghi_chu } = req.body;
  db.prepare(`
    UPDATE ho_so SET
      ho_ten = COALESCE(?, ho_ten), gioi_tinh = COALESCE(?, gioi_tinh),
      ngay_sinh = COALESCE(?, ngay_sinh), so_dien_thoai = COALESCE(?, so_dien_thoai),
      email = COALESCE(?, email), ghi_chu = COALESCE(?, ghi_chu),
      nguoi_cap_nhat_id = ?
    WHERE id = ?
  `).run(ho_ten || null, gioi_tinh || null, ngay_sinh || null, so_dien_thoai || null, email || null, ghi_chu || null, req.user.id, id);

  const updated = db.prepare('SELECT * FROM ho_so WHERE id = ?').get(id);
  ghi_audit_log(req, 'UPDATE', 'ho_so', parseInt(id), old, updated, 'Cập nhật thông tin PT');
  return success(res, updated, 'Cập nhật PT thành công');
};

// ── PUT /api/trainers/:id/avatar ──────────────────────────
export const updateTrainerAvatar = async (req, res) => {
  const { id } = req.params;
  const trainer = db.prepare(`SELECT * FROM ho_so WHERE id = ? AND loai_ho_so = 'pt' AND is_deleted = 0`).get(id);
  if (!trainer) return error(res, 'Không tìm thấy PT.', 404);
  if (!req.file) return error(res, 'Vui lòng chọn file ảnh.', 400);

  try {
    if (trainer.cloudinary_public_id) await deleteImage(trainer.cloudinary_public_id);
    const result = await uploadImage(req.file.buffer, 'paradise-gym/trainers', trainer.ma_ho_so);
    db.prepare(`UPDATE ho_so SET avatar_url = ?, cloudinary_public_id = ?, nguoi_cap_nhat_id = ? WHERE id = ?`)
      .run(result.url, result.publicId, req.user.id, id);
    ghi_audit_log(req, 'UPDATE', 'ho_so', parseInt(id), null, { avatar_url: result.url }, 'Cập nhật ảnh PT');
    return success(res, { avatar_url: result.url }, 'Cập nhật ảnh thành công');
  } catch (err) {
    return error(res, `Lỗi upload ảnh: ${err.message}`, 500);
  }
};

// ── GET /api/trainers/:id/schedules ───────────────────────
export const getTrainerSchedules = (req, res) => {
  const { id } = req.params;
  const { date } = req.query; // filter theo ngày nếu có

  let where = `WHERE lt.pt_id = ?`;
  const params = [id];
  if (date) { where += ` AND lt.ngay_tap = ?`; params.push(date); }

  const rows = db.prepare(`
    SELECT lt.id, lt.ngay_tap, lt.gio_bat_dau, lt.gio_ket_thuc,
           lt.loai_buoi, lt.trang_thai, lt.ghi_chu,
           hv.id AS hoi_vien_id, hv.ho_ten AS ten_hoi_vien, hv.avatar_url AS avatar_hoi_vien,
           (dk.so_buoi_dang_ky - dk.so_buoi_da_tap) AS buoi_con_lai
    FROM lich_tap lt
    JOIN ho_so hv ON hv.id = lt.hoi_vien_id
    JOIN dang_ky_pt dk ON dk.id = lt.dang_ky_pt_id
    ${where}
    ORDER BY lt.ngay_tap ASC, lt.gio_bat_dau ASC
  `).all(...params);

  return success(res, rows);
};
