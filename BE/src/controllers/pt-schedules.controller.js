/**
 * PT Schedules Controller — Quản lý lịch tập PT
 */

import db from '../config/db.js';
import { success, error } from '../utils/response.js';
import { ghi_audit_log } from '../utils/audit.js';
import { createNotification } from '../utils/notifications.js';

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
    ORDER BY lt.ngay_tap DESC, lt.gio_bat_dau DESC
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
// Xác nhận buổi đã tập (admin/lễ tân hoặc PT tự xác nhận lịch của mình)
export const confirmSchedule = (req, res) => {
  const { id } = req.params;
  const schedule = db.prepare('SELECT * FROM lich_tap WHERE id = ?').get(id);
  if (!schedule) return error(res, 'Không tìm thấy lịch tập.', 404);
  if (schedule.trang_thai !== 'cho_tap') return error(res, `Buổi tập đang ở trạng thái: ${schedule.trang_thai}. Chỉ xác nhận được buổi "cho_tap".`, 400);

  // Nếu là PT: chỉ được xác nhận lịch của chính mình
  if (req.user.vai_tro === 'pt') {
    const hoSoPt = db.prepare('SELECT id FROM ho_so WHERE tai_khoan_id = ?').get(req.user.id);
    if (!hoSoPt || schedule.pt_id !== hoSoPt.id) {
      return error(res, 'Bạn chỉ có thể xác nhận buổi tập do chính mình phụ trách.', 403);
    }
  }

  // Trigger trg_xac_nhan_buoi_tap sẽ tự động tăng so_buoi_da_tap
  db.prepare(`
    UPDATE lich_tap SET trang_thai = 'da_tap', confirmed_by_id = ?, ngay_xac_nhan = datetime('now','localtime') WHERE id = ?
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

  // Sinh thông báo hủy buổi tập cho ca hai
  const schedInfo = db.prepare(`
    SELECT lt.gio_bat_dau, lt.ngay_tap,
           hv.ho_ten AS ho_ten_hoi_vien,
           pt.ho_ten AS ho_ten_pt
    FROM lich_tap lt
    JOIN ho_so hv ON hv.id = lt.hoi_vien_id
    JOIN ho_so pt ON pt.id = lt.pt_id
    WHERE lt.id = ?
  `).get(id);
  if (schedInfo) {
    createNotification(
      'huy_buoi_tap',
      'Buổi tập bị hủy',
      `Buổi ${schedInfo.gio_bat_dau} ngày ${schedInfo.ngay_tap} của ${schedInfo.ho_ten_hoi_vien} với PT ${schedInfo.ho_ten_pt} đã bị hủy`,
      parseInt(id),
      'lich_tap',
      'ca_hai'
    );
  }

  ghi_audit_log(req, 'UPDATE', 'lich_tap', parseInt(id), { trang_thai: schedule.trang_thai }, { trang_thai: 'da_huy', ly_do }, 'Hủy buổi tập');
  return success(res, null, 'Đã hủy buổi tập');
};

// ── PATCH /api/pt/schedules/:id/hoan-tac ─────────────────
// Hoàn tác xác nhận buổi tập (chỉ áp dụng cho buổi do cron tự xác nhận)
export const revertSchedule = (req, res) => {
  const { id } = req.params;
  const { ly_do } = req.body;

  const schedule = db.prepare('SELECT * FROM lich_tap WHERE id = ?').get(id);
  if (!schedule) return error(res, 'Không tìm thấy lịch tập.', 404);
  if (schedule.trang_thai !== 'da_tap') return error(res, 'Chỉ hoàn tác được buổi ở trạng thái "da_tap".', 400);

  // Chỉ cho hoàn tác buổi do cron tự xác nhận (confirmed_by_id NULL + ghi_chu = 'auto_cron')
  if (schedule.confirmed_by_id !== null || schedule.ghi_chu !== 'auto_cron') {
    return error(res, 'Chỉ có thể hoàn tác buổi do hệ thống tự xác nhận (cron job). Buổi do lễ tân xác nhận không thể hoàn tác tại đây.', 403);
  }

  // Chỉ hoàn tác trong vòng 1 ngày (tránh sửa dữ liệu cũ)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const ngayTapDate = new Date(schedule.ngay_tap);
  if (ngayTapDate < yesterday) {
    return error(res, 'Chỉ có thể hoàn tác buổi tập trong vòng 1 ngày.', 400);
  }

  // Dùng transaction để đảm bảo tính nhất quán
  const revert = db.transaction(() => {
    // Lấy dang_ky_pt để trừ lại so_buoi_da_tap
    const dkpt = db.prepare('SELECT * FROM dang_ky_pt WHERE id = ?').get(schedule.dang_ky_pt_id);

    // Đặt lại trạng thái buổi tập
    db.prepare(`
      UPDATE lich_tap SET
        trang_thai = 'cho_tap', confirmed_by_id = NULL,
        ngay_xac_nhan = NULL, da_checkin = 0,
        ghi_chu = ?
      WHERE id = ?
    `).run(ly_do ? `Hoàn tác: ${ly_do}` : 'Hoàn tác bởi admin', id);

    // Giảm so_buoi_da_tap trong dang_ky_pt (trigger đã tăng lúc confirm)
    if (dkpt && dkpt.so_buoi_da_tap > 0) {
      db.prepare(`UPDATE dang_ky_pt SET so_buoi_da_tap = so_buoi_da_tap - 1 WHERE id = ?`).run(schedule.dang_ky_pt_id);
    }
  });

  revert();
  ghi_audit_log(req, 'UPDATE', 'lich_tap', parseInt(id),
    { trang_thai: 'da_tap' }, { trang_thai: 'cho_tap' }, `Hoàn tác xác nhận buổi tập: ${ly_do || ''}`);

  // Sinh thông báo hoàn tác buổi tập cho admin
  const tenDangNhap = db.prepare('SELECT ten_dang_nhap FROM tai_khoan WHERE id = ?').get(req.user.id)?.ten_dang_nhap || `ID ${req.user.id}`;
  const hoantacInfo = db.prepare(`
    SELECT lt.ngay_tap, hv.ho_ten AS ho_ten_hoi_vien
    FROM lich_tap lt JOIN ho_so hv ON hv.id = lt.hoi_vien_id WHERE lt.id = ?
  `).get(id);
  if (hoantacInfo) {
    createNotification(
      'hoan_tac_buoi_tap',
      'Hoàn tác buổi tập',
      `${tenDangNhap} vừa hoàn tác buổi tập ${hoantacInfo.ngay_tap} của ${hoantacInfo.ho_ten_hoi_vien} — Lý do: ${ly_do || 'Không rõ'}`,
      parseInt(id),
      'lich_tap',
      'admin'
    );
  }

  return success(res, null, 'Hoàn tác buổi tập thành công');
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

  // Sinh thông báo realtime cho hội viên và PT khi giờ/ngày tập bị thay đổi
  const updated = db.prepare(`
    SELECT lt.ngay_tap, lt.gio_bat_dau, lt.gio_ket_thuc,
           hv.ho_ten AS ho_ten_hoi_vien,
           pt.ho_ten AS ho_ten_pt
    FROM lich_tap lt
    JOIN ho_so hv ON hv.id = lt.hoi_vien_id
    JOIN ho_so pt ON pt.id = lt.pt_id
    WHERE lt.id = ?
  `).get(id);

  if (updated) {
    const noiDung = `Buổi tập của ${updated.ho_ten_hoi_vien} với PT ${updated.ho_ten_pt} đã được dời sang ${updated.ngay_tap} lúc ${updated.gio_bat_dau}–${updated.gio_ket_thuc}`;
    createNotification(
      'cap_nhat_buoi_tap',
      'Lịch tập đã thay đổi',
      noiDung,
      parseInt(id),
      'lich_tap',
      'ca_hai'
    );
  }

  return success(res, db.prepare('SELECT * FROM lich_tap WHERE id = ?').get(id), 'Cập nhật lịch thành công');
};
