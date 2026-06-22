/**
 * Trainers Controller — Quản lý PT/Huấn luyện viên
 * Tích hợp upload ảnh Cloudinary
 */

import db from '../config/db.js';
import { success, error } from '../utils/response.js';
import { uploadImage, deleteImage } from '../utils/cloudinary.js';
import { ghi_audit_log } from '../utils/audit.js';
import { createUserNotification } from '../utils/notifications.js';

// ── GET /api/trainers ─────────────────────────────────────
export const getTrainers = (req, res) => {
  const { search, chi_nhanh } = req.query;

  let filterBranch = chi_nhanh;
  if (req.user.vai_tro !== 'admin' && req.user.vai_tro !== 'chu_phong_gym') {
    const actor = db.prepare('SELECT chi_nhanh FROM ho_so WHERE tai_khoan_id = ? AND is_deleted = 0').get(req.user.id);
    filterBranch = actor?.chi_nhanh || 'KHONG_CO_CHI_NHANH';
  }

  let where = `WHERE h.loai_ho_so = 'pt' AND h.is_deleted = 0`;
  const params = [];

  if (filterBranch) {
    where += ` AND h.chi_nhanh = ?`;
    params.push(filterBranch);
  }

  if (search) {
    where += ` AND (h.ho_ten LIKE ? OR h.so_dien_thoai LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  const rows = db.prepare(`
    SELECT
      h.id, h.ma_ho_so, h.ho_ten, h.gioi_tinh, h.ngay_sinh,
      h.so_dien_thoai, h.email, h.avatar_url, h.ghi_chu, h.ngay_tao,
      h.chi_nhanh, h.phong_tap, h.chuyen_mon, h.kinh_nghiem, h.tinh_thanh, h.quan_huyen,
      h.tai_khoan_id,
      COALESCE(h.trang_thai_lam_viec, 'hoat_dong') AS trang_thai_lam_viec,
      COALESCE(tk.trang_thai, 'hoat_dong') AS trang_thai,
      -- Số học viên đang tập
      (SELECT COUNT(DISTINCT dp.hoi_vien_id) FROM dang_ky_pt dp WHERE dp.pt_id = h.id AND dp.trang_thai = 'dang_hoat_dong') AS so_hoc_vien,
      -- Tổng buổi đã dạy
      (SELECT COUNT(*) FROM lich_tap lt WHERE lt.pt_id = h.id AND lt.trang_thai = 'da_tap') AS tong_buoi_da_day,
      -- Gói PT đang nhận
      (SELECT COUNT(*) FROM dang_ky_pt dp WHERE dp.pt_id = h.id AND dp.trang_thai = 'dang_hoat_dong') AS so_goi_dang_day,
      ROUND((SELECT AVG(so_sao) FROM danh_gia_pt dg WHERE dg.pt_id = h.id), 1) AS rating,
      ROUND((SELECT AVG(so_sao) FROM danh_gia_pt dg WHERE dg.pt_id = h.id), 1) AS danh_gia,
      (SELECT COUNT(*) FROM danh_gia_pt dg WHERE dg.pt_id = h.id) AS so_luot_danh_gia
    FROM ho_so h
    LEFT JOIN tai_khoan tk ON tk.id = h.tai_khoan_id
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
           COALESCE(h.trang_thai_lam_viec, 'hoat_dong') AS trang_thai_lam_viec,
           COALESCE(tk.trang_thai, 'hoat_dong') AS trang_thai,
           ROUND((SELECT AVG(so_sao) FROM danh_gia_pt dg WHERE dg.pt_id = h.id), 1) AS rating,
           ROUND((SELECT AVG(so_sao) FROM danh_gia_pt dg WHERE dg.pt_id = h.id), 1) AS danh_gia,
           (SELECT COUNT(*) FROM danh_gia_pt dg WHERE dg.pt_id = h.id) AS so_luot_danh_gia,
           -- Số học viên đang tập
           (SELECT COUNT(DISTINCT dp.hoi_vien_id) FROM dang_ky_pt dp WHERE dp.pt_id = h.id AND dp.trang_thai = 'dang_hoat_dong') AS so_hoc_vien,
           -- Tổng buổi đã dạy
           (SELECT COUNT(*) FROM lich_tap lt WHERE lt.pt_id = h.id AND lt.trang_thai = 'da_tap') AS tong_buoi_da_day,
           -- Gói PT đang nhận
           (SELECT COUNT(*) FROM dang_ky_pt dp WHERE dp.pt_id = h.id AND dp.trang_thai = 'dang_hoat_dong') AS so_goi_dang_day,
           (SELECT json_group_array(json_object(
             'hoi_vien_id', dp.hoi_vien_id, 'ten_hoi_vien', hv.ho_ten,
             'avatar_hoi_vien', hv.avatar_url, 'buoi_con_lai', dp.so_buoi_dang_ky - dp.so_buoi_da_tap,
             'trang_thai', dp.trang_thai
           )) FROM dang_ky_pt dp JOIN ho_so hv ON hv.id = dp.hoi_vien_id
            WHERE dp.pt_id = h.id AND dp.trang_thai = 'dang_hoat_dong') AS hoc_vien_hien_tai
    FROM ho_so h
    LEFT JOIN tai_khoan tk ON tk.id = h.tai_khoan_id
    WHERE h.id = ? AND h.loai_ho_so = 'pt' AND h.is_deleted = 0
  `).get(id);

  if (!trainer) return error(res, 'Không tìm thấy PT.', 404);
  trainer.hoc_vien_hien_tai = JSON.parse(trainer.hoc_vien_hien_tai || '[]');

  // Lấy danh sách đánh giá của PT
  const reviews = db.prepare(`
    SELECT dg.id, dg.so_sao, dg.noi_dung, dg.ngay_tao, dg.tieu_chi_json, dg.tag_json,
           hv.ho_ten AS ten_hoi_vien, hv.avatar_url AS avatar_hoi_vien
    FROM danh_gia_pt dg
    LEFT JOIN ho_so hv ON hv.id = dg.hoi_vien_id
    WHERE dg.pt_id = ?
    ORDER BY dg.ngay_tao DESC
  `).all(id);

  trainer.danh_sach_danh_gia = reviews.map(r => ({
    ...r,
    tieu_chi: JSON.parse(r.tieu_chi_json || '[]'),
    tags: JSON.parse(r.tag_json || '[]')
  }));

  return success(res, trainer);
};

export const createTrainer = async (req, res) => {
  const { ho_ten, gioi_tinh, ngay_sinh, so_dien_thoai, email, chuyen_mon, kinh_nghiem, chi_nhanh, ghi_chu } = req.body;
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
    INSERT INTO ho_so (ma_ho_so, loai_ho_so, ho_ten, gioi_tinh, ngay_sinh, so_dien_thoai, email, chuyen_mon, kinh_nghiem, chi_nhanh, avatar_url, cloudinary_public_id, ghi_chu, nguoi_tao_id)
    VALUES (?, 'pt', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(ma_ho_so, ho_ten, gioi_tinh || null, ngay_sinh || null, so_dien_thoai || null, email || null, chuyen_mon || null, parseInt(kinh_nghiem) || 0, chi_nhanh || null, avatar_url, cloudinary_public_id, ghi_chu || null, req.user.id);

  ghi_audit_log(req, 'CREATE', 'ho_so', result.lastInsertRowid, null, { ho_ten, loai_ho_so: 'pt' }, 'Thêm PT mới');
  return success(res, db.prepare('SELECT * FROM ho_so WHERE id = ?').get(result.lastInsertRowid), 'Thêm PT thành công', 201);
};

// ── PUT /api/trainers/:id ─────────────────────────────────
export const updateTrainer = (req, res) => {
  const { id } = req.params;
  const old = db.prepare(`SELECT * FROM ho_so WHERE id = ? AND loai_ho_so = 'pt' AND is_deleted = 0`).get(id);
  if (!old) return error(res, 'Không tìm thấy PT.', 404);

  const { ho_ten, gioi_tinh, ngay_sinh, so_dien_thoai, email, chuyen_mon, kinh_nghiem, chi_nhanh, trang_thai, ghi_chu } = req.body;
  
  const tx = db.transaction(() => {
    const lam_viec = trang_thai ? ((trang_thai === 'hoat_dong' || trang_thai === 'active' || trang_thai === 'kich_hoat') ? 'hoat_dong' : 'tam_nghi') : null;
    db.prepare(`
      UPDATE ho_so SET
        ho_ten = COALESCE(?, ho_ten), gioi_tinh = COALESCE(?, gioi_tinh),
        ngay_sinh = COALESCE(?, ngay_sinh), so_dien_thoai = COALESCE(?, so_dien_thoai),
        email = COALESCE(?, email), chuyen_mon = COALESCE(?, chuyen_mon),
        kinh_nghiem = COALESCE(?, kinh_nghiem), chi_nhanh = COALESCE(?, chi_nhanh),
        ghi_chu = COALESCE(?, ghi_chu), nguoi_cap_nhat_id = ?,
        trang_thai_lam_viec = COALESCE(?, trang_thai_lam_viec)
      WHERE id = ?
    `).run(
      ho_ten || null, gioi_tinh || null, ngay_sinh || null, so_dien_thoai || null, email || null,
      chuyen_mon || null, kinh_nghiem !== undefined ? parseInt(kinh_nghiem) || 0 : undefined,
      chi_nhanh || null, ghi_chu || null, req.user.id, lam_viec, id
    );

    // Đồng bộ tài khoản: tạm nghỉ không khóa tài khoản, chỉ cập nhật trạng thái làm việc
    // (tai_khoan.trang_thai vẫn giữ nguyên 'hoat_dong' để PT vẫn đăng nhập được)
  });

  tx();

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

// ── GET /api/trainers/:id/members ────────────────────────
// Danh sách hội viên có hợp đồng dang_hoat_dong với PT này và gói Gym chính còn hạn
export const getTrainerMembers = (req, res) => {
  const { id } = req.params;
  const rows = db.prepare(`
    SELECT
      h.id, h.ma_ho_so, h.ho_ten, h.avatar_url, h.so_dien_thoai,
      dp.id AS dang_ky_pt_id,
      dp.so_buoi_dang_ky, dp.so_buoi_da_tap,
      (dp.so_buoi_dang_ky - dp.so_buoi_da_tap) AS buoi_con_lai,
      gp.ten_goi AS ten_goi_tap
    FROM dang_ky_pt dp
    JOIN ho_so h ON h.id = dp.hoi_vien_id
    LEFT JOIN goi_pt gp ON gp.id = dp.goi_pt_id
    WHERE dp.pt_id = ? AND dp.trang_thai = 'dang_hoat_dong' AND h.is_deleted = 0
      AND EXISTS (
        SELECT 1 FROM dang_ky_goi_tap dkgt
        WHERE dkgt.ho_so_id = h.id 
          AND dkgt.trang_thai = 'dang_hoat_dong' 
          AND dkgt.tu_ngay <= date('now', 'localtime')
          AND dkgt.den_ngay >= date('now', 'localtime')
      )
    ORDER BY h.ho_ten ASC
  `).all(id);
  return success(res, rows);
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

// ── DELETE /api/trainers/:id ──────────────────────────────
export const deleteTrainer = (req, res) => {
  const { id } = req.params;
  const { ly_do } = req.body;

  const trainer = db.prepare("SELECT * FROM ho_so WHERE id = ? AND loai_ho_so = 'pt' AND is_deleted = 0").get(id);
  if (!trainer) return error(res, 'Không tìm thấy PT.', 404);

  // Lấy danh sách lịch tập sắp tới (chưa xảy ra) để hủy và thông báo
  const upcomingSchedules = db.prepare(`
    SELECT lt.id, lt.hoi_vien_id, lt.ngay_tap, lt.gio_bat_dau,
           hv.ho_ten AS ten_hv
    FROM lich_tap lt
    JOIN ho_so hv ON hv.id = lt.hoi_vien_id
    WHERE lt.pt_id = ? AND lt.trang_thai = 'cho_tap'
  `).all(id);

  const tx = db.transaction(() => {
    // Hủy tất cả lịch tập sắp tới của PT bị xóa
    if (upcomingSchedules.length > 0) {
      db.prepare(`
        UPDATE lich_tap SET trang_thai = 'da_huy', ly_do_huy = ?, nguoi_huy_id = ?
        WHERE pt_id = ? AND trang_thai = 'cho_tap'
      `).run(`PT bị xóa khỏi hệ thống. ${ly_do || ''}`.trim(), req.user.id, id);
    }

    db.prepare(`
      UPDATE ho_so SET
        is_deleted = 1,
        ngay_xoa = datetime('now','localtime'),
        nguoi_xoa_id = ?,
        ly_do_xoa = ?
      WHERE id = ?
    `).run(req.user.id, ly_do || 'Xóa PT', id);

    if (trainer.tai_khoan_id) {
      db.prepare("UPDATE tai_khoan SET trang_thai = 'khoa' WHERE id = ?").run(trainer.tai_khoan_id);
    }
  });

  tx();

  // Thông báo cho từng học viên bị ảnh hưởng
  upcomingSchedules.forEach((s) => {
    createUserNotification(
      s.hoi_vien_id,
      'Buổi tập bị hủy do HLV nghỉ ❌',
      `Buổi tập lúc ${s.gio_bat_dau} ngày ${s.ngay_tap} đã bị hủy vì HLV ${trainer.ho_ten} đã rời hệ thống. Vui lòng liên hệ phòng gym để sắp xếp HLV thay thế.`,
      'nhac_nho_gia_han'
    );
  });

  ghi_audit_log(req, 'DELETE', 'ho_so', parseInt(id), trainer, null, ly_do || 'Xóa hồ sơ PT');
  return success(res, {
    cancelledSchedules: upcomingSchedules.length,
    affectedMembers: [...new Set(upcomingSchedules.map(s => s.hoi_vien_id))].length,
  }, `Đã xoá hồ sơ PT thành công. ${upcomingSchedules.length > 0 ? `Đã tự động hủy ${upcomingSchedules.length} buổi tập sắp tới.` : ''}`);
};

