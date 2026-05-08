/**
 * PT Schedules Controller — Quản lý lịch tập PT
 */

import db from '../config/db.js';
import { success, error } from '../utils/response.js';
import { ghi_audit_log } from '../utils/audit.js';

// ── GET /api/pt/schedules ─────────────────────────────────
// Xem lịch tập toàn phòng (admin) hoặc lịch cá nhân (PT/hội viên)
export const getSchedules = (req, res) => {
  const { date, pt_id, hoi_vien_id, trang_thai } = req.query;

  let where = 'WHERE 1=1';
  const params = [];

  // Nếu là PT: chỉ xem lịch của mình
  if (req.user.vai_tro === 'pt') {
    const hoSo = db.prepare('SELECT id FROM ho_so WHERE tai_khoan_id = ?').get(req.user.id);
    if (hoSo) { where += ' AND lt.pt_id = ?'; params.push(hoSo.id); }
  }
  // Nếu là hội viên: chỉ xem lịch của mình
  else if (req.user.vai_tro === 'hoi_vien') {
    const hoSo = db.prepare('SELECT id FROM ho_so WHERE tai_khoan_id = ?').get(req.user.id);
    if (hoSo) { where += ' AND lt.hoi_vien_id = ?'; params.push(hoSo.id); }
  }
  // Admin/lễ tân: xem được tất cả, có thể filter thêm
  else {
    if (pt_id) { where += ' AND lt.pt_id = ?'; params.push(pt_id); }
    if (hoi_vien_id) { where += ' AND lt.hoi_vien_id = ?'; params.push(hoi_vien_id); }
  }

  if (date) { where += ' AND lt.ngay_tap = ?'; params.push(date); }
  if (trang_thai) { where += ' AND lt.trang_thai = ?'; params.push(trang_thai); }

  const rows = db.prepare(`
    SELECT
      lt.id, lt.ngay_tap, lt.gio_bat_dau, lt.gio_ket_thuc,
      lt.loai_buoi, lt.trang_thai, lt.ghi_chu, lt.ly_do_huy,
      hv.id AS hoi_vien_id, hv.ho_ten AS ten_hoi_vien, hv.avatar_url AS avatar_hoi_vien,
      pt.id AS pt_id, pt.ho_ten AS ten_pt, pt.avatar_url AS avatar_pt,
      (dk.so_buoi_dang_ky - dk.so_buoi_da_tap) AS buoi_con_lai,
      lt.ngay_xac_nhan
    FROM lich_tap lt
    JOIN ho_so hv ON hv.id = lt.hoi_vien_id
    JOIN ho_so pt ON pt.id = lt.pt_id
    JOIN dang_ky_pt dk ON dk.id = lt.dang_ky_pt_id
    ${where}
    ORDER BY lt.ngay_tap ASC, lt.gio_bat_dau ASC
  `).all(...params);

  return success(res, rows);
};

// ── POST /api/pt/schedules ────────────────────────────────
// Đặt lịch tập mới
export const createSchedule = (req, res) => {
  const { dang_ky_pt_id, ngay_tap, gio_bat_dau, gio_ket_thuc, loai_buoi = 'ca_nhan', ghi_chu } = req.body;
  if (!dang_ky_pt_id || !ngay_tap || !gio_bat_dau || !gio_ket_thuc) {
    return error(res, 'Thiếu: dang_ky_pt_id, ngay_tap, gio_bat_dau, gio_ket_thuc', 400);
  }

  // Lấy thông tin đăng ký PT
  const dkpt = db.prepare(`
    SELECT dp.*, h_hv.id AS hv_id, h_pt.id AS pt_hoso_id
    FROM dang_ky_pt dp
    JOIN ho_so h_hv ON h_hv.id = dp.hoi_vien_id
    JOIN ho_so h_pt ON h_pt.id = dp.pt_id
    WHERE dp.id = ? AND dp.trang_thai = 'dang_hoat_dong'
  `).get(dang_ky_pt_id);

  if (!dkpt) return error(res, 'Đăng ký PT không tồn tại hoặc đã kết thúc.', 404);

  // Kiểm tra PT có lịch bị trùng không
  const conflict = db.prepare(`
    SELECT id FROM lich_tap
    WHERE pt_id = ? AND ngay_tap = ? AND trang_thai != 'da_huy'
      AND NOT (gio_ket_thuc <= ? OR gio_bat_dau >= ?)
  `).get(dkpt.pt_id, ngay_tap, gio_bat_dau, gio_ket_thuc);

  if (conflict) return error(res, 'PT đã có lịch tập trong khung giờ này.', 409);

  const result = db.prepare(`
    INSERT INTO lich_tap (dang_ky_pt_id, pt_id, hoi_vien_id, ngay_tap, gio_bat_dau, gio_ket_thuc, loai_buoi, ghi_chu, nguoi_tao_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(dang_ky_pt_id, dkpt.pt_id, dkpt.hoi_vien_id, ngay_tap, gio_bat_dau, gio_ket_thuc, loai_buoi, ghi_chu || null, req.user.id);

  ghi_audit_log(req, 'CREATE', 'lich_tap', result.lastInsertRowid, null, { ngay_tap, gio_bat_dau, gio_ket_thuc }, 'Đặt lịch tập PT');
  return success(res, db.prepare('SELECT * FROM lich_tap WHERE id = ?').get(result.lastInsertRowid), 'Đặt lịch thành công', 201);
};

// ── PUT /api/pt/schedules/:id/confirm ────────────────────
// Xác nhận buổi đã tập (chỉ admin/lễ tân)
export const confirmSchedule = (req, res) => {
  const { id } = req.params;
  const schedule = db.prepare('SELECT * FROM lich_tap WHERE id = ?').get(id);
  if (!schedule) return error(res, 'Không tìm thấy lịch tập.', 404);
  if (schedule.trang_thai !== 'cho_tap') return error(res, `Buổi tập đang ở trạng thái: ${schedule.trang_thai}. Chỉ xác nhận được buổi "cho_tap".`, 400);

  // Trigger trg_xac_nhan_buoi_tap sẽ tự động tăng so_buoi_da_tap
  db.prepare(`
    UPDATE lich_tap SET trang_thai = 'da_tap', confirmed_by_id = ? WHERE id = ?
  `).run(req.user.id, id);

  ghi_audit_log(req, 'UPDATE', 'lich_tap', parseInt(id), { trang_thai: 'cho_tap' }, { trang_thai: 'da_tap' }, 'Xác nhận buổi tập đã hoàn thành');
  return success(res, null, 'Xác nhận buổi tập thành công');
};

// ── PUT /api/pt/schedules/:id/cancel ─────────────────────
// Hủy buổi tập
export const cancelSchedule = (req, res) => {
  const { id } = req.params;
  const { ly_do } = req.body;
  const schedule = db.prepare('SELECT * FROM lich_tap WHERE id = ?').get(id);
  if (!schedule) return error(res, 'Không tìm thấy lịch tập.', 404);
  if (schedule.trang_thai === 'da_tap') return error(res, 'Không thể hủy buổi đã tập.', 400);
  if (schedule.trang_thai === 'da_huy') return error(res, 'Buổi tập đã bị hủy rồi.', 400);

  db.prepare(`
    UPDATE lich_tap SET trang_thai = 'da_huy', ly_do_huy = ?, nguoi_huy_id = ? WHERE id = ?
  `).run(ly_do || 'Không có lý do', req.user.id, id);

  ghi_audit_log(req, 'UPDATE', 'lich_tap', parseInt(id), { trang_thai: schedule.trang_thai }, { trang_thai: 'da_huy', ly_do }, 'Hủy buổi tập');
  return success(res, null, 'Đã hủy buổi tập');
};

// ── PUT /api/pt/schedules/:id ─────────────────────────────
// Cập nhật lịch (đổi ngày/giờ — chỉ cho buổi chưa tập)
export const updateSchedule = (req, res) => {
  const { id } = req.params;
  const { ngay_tap, gio_bat_dau, gio_ket_thuc, ghi_chu } = req.body;
  const schedule = db.prepare('SELECT * FROM lich_tap WHERE id = ?').get(id);
  if (!schedule) return error(res, 'Không tìm thấy lịch tập.', 404);
  if (schedule.trang_thai !== 'cho_tap') return error(res, 'Chỉ có thể sửa lịch đang ở trạng thái "cho_tap".', 400);

  db.prepare(`
    UPDATE lich_tap SET
      ngay_tap = COALESCE(?, ngay_tap),
      gio_bat_dau = COALESCE(?, gio_bat_dau),
      gio_ket_thuc = COALESCE(?, gio_ket_thuc),
      ghi_chu = COALESCE(?, ghi_chu)
    WHERE id = ?
  `).run(ngay_tap || null, gio_bat_dau || null, gio_ket_thuc || null, ghi_chu || null, id);

  ghi_audit_log(req, 'UPDATE', 'lich_tap', parseInt(id), schedule, req.body, 'Cập nhật lịch tập');
  return success(res, db.prepare('SELECT * FROM lich_tap WHERE id = ?').get(id), 'Cập nhật lịch thành công');
};
