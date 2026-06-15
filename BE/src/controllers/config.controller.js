/**
 * Config Controller — Cấu hình hệ thống + Nội quy phòng tập
 */

import db from '../config/db.js';
import { success, error } from '../utils/response.js';
import { ghi_audit_log } from '../utils/audit.js';

// ── Cau Hinh ──────────────────────────────────────────────

// GET /api/config — Lấy tất cả cấu hình (admin)
export const getConfig = (req, res) => {
  const rows = db.prepare(`SELECT khoa, gia_tri, mo_ta, ngay_cap_nhat FROM cau_hinh ORDER BY khoa`).all();
  const result = {};
  rows.forEach(r => { result[r.khoa] = { gia_tri: r.gia_tri, mo_ta: r.mo_ta, ngay_cap_nhat: r.ngay_cap_nhat }; });
  return success(res, result, 'Lấy cấu hình thành công');
};

// PUT /api/config — Cập nhật một hoặc nhiều cấu hình (admin)
export const updateConfig = (req, res) => {
  const updates = req.body; // { khoa: gia_tri, ... }
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return error(res, 'Body phải là object { khoa: gia_tri }', 400);
  }

  const entries = Object.entries(updates);
  if (entries.length === 0) return error(res, 'Không có dữ liệu cập nhật', 400);

  const stmt = db.prepare(`
    INSERT INTO cau_hinh (khoa, gia_tri, ngay_cap_nhat)
    VALUES (?, ?, datetime('now','localtime'))
    ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, ngay_cap_nhat = excluded.ngay_cap_nhat
  `);

  const updateMany = db.transaction(() => {
    for (const [khoa, gia_tri] of entries) {
      stmt.run(khoa, String(gia_tri));
    }
  });
  updateMany();

  ghi_audit_log(req, 'cap_nhat_cau_hinh', 'cau_hinh', null, null, updates, null);
  return success(res, null, 'Đã cập nhật cấu hình');
};

// GET /api/config/:khoa — Lấy 1 cấu hình cụ thể (public — dùng cho mobile)
export const getConfigByKey = (req, res) => {
  const row = db.prepare(`SELECT khoa, gia_tri, mo_ta FROM cau_hinh WHERE khoa = ?`).get(req.params.khoa);
  if (!row) return error(res, 'Không tìm thấy cấu hình', 404);
  return success(res, row);
};

// ── Nội Quy ───────────────────────────────────────────────

// GET /api/config/rules — Lấy danh sách nội quy (tất cả đăng nhập)
export const getRules = (req, res) => {
  const rows = db.prepare(`
    SELECT id, tieu_de, noi_dung, thu_tu, ap_dung_cho, is_active, ngay_cap_nhat
    FROM noi_quy
    WHERE is_active = 1
    ORDER BY thu_tu ASC, id ASC
  `).all();
  return success(res, rows, 'Lấy nội quy thành công');
};

// GET /api/config/rules/all — Admin xem tất cả kể cả inactive
export const getAllRules = (req, res) => {
  const rows = db.prepare(`
    SELECT id, tieu_de, noi_dung, thu_tu, ap_dung_cho, is_active, ngay_cap_nhat
    FROM noi_quy
    ORDER BY thu_tu ASC, id ASC
  `).all();
  return success(res, rows);
};

// POST /api/config/rules — Tạo nội quy mới (admin)
export const createRule = (req, res) => {
  const { tieu_de, noi_dung, thu_tu = 0, ap_dung_cho = 'tat_ca' } = req.body;
  if (!tieu_de || !noi_dung) return error(res, 'Thiếu tiêu đề hoặc nội dung', 400);

  const valid = ['tat_ca', 'hoi_vien', 'pt', 'nhan_vien'];
  if (!valid.includes(ap_dung_cho)) return error(res, `ap_dung_cho phải là: ${valid.join(', ')}`, 400);

  const result = db.prepare(`
    INSERT INTO noi_quy (tieu_de, noi_dung, thu_tu, ap_dung_cho, is_active, nguoi_tao_id, ngay_cap_nhat)
    VALUES (?, ?, ?, ?, 1, ?, datetime('now','localtime'))
  `).run(tieu_de, noi_dung, parseInt(thu_tu), ap_dung_cho, req.user.id);

  ghi_audit_log(req, 'tao_noi_quy', 'noi_quy', result.lastInsertRowid, null, { tieu_de }, null);
  return success(res, { id: result.lastInsertRowid }, 'Đã tạo nội quy', 201);
};

// PUT /api/config/rules/:id — Cập nhật nội quy (admin)
export const updateRule = (req, res) => {
  const { tieu_de, noi_dung, thu_tu, ap_dung_cho, is_active } = req.body;
  const rule = db.prepare(`SELECT * FROM noi_quy WHERE id = ?`).get(req.params.id);
  if (!rule) return error(res, 'Không tìm thấy nội quy', 404);

  db.prepare(`
    UPDATE noi_quy SET
      tieu_de = COALESCE(?, tieu_de),
      noi_dung = COALESCE(?, noi_dung),
      thu_tu = COALESCE(?, thu_tu),
      ap_dung_cho = COALESCE(?, ap_dung_cho),
      is_active = COALESCE(?, is_active),
      ngay_cap_nhat = datetime('now','localtime')
    WHERE id = ?
  `).run(
    tieu_de ?? null, noi_dung ?? null,
    thu_tu != null ? parseInt(thu_tu) : null,
    ap_dung_cho ?? null,
    is_active != null ? (is_active ? 1 : 0) : null,
    req.params.id
  );

  ghi_audit_log(req, 'cap_nhat_noi_quy', 'noi_quy', req.params.id, rule, req.body, null);
  return success(res, null, 'Đã cập nhật nội quy');
};

// DELETE /api/config/rules/:id — Xóa nội quy (admin)
export const deleteRule = (req, res) => {
  const rule = db.prepare(`SELECT id FROM noi_quy WHERE id = ?`).get(req.params.id);
  if (!rule) return error(res, 'Không tìm thấy nội quy', 404);
  db.prepare(`DELETE FROM noi_quy WHERE id = ?`).run(req.params.id);
  ghi_audit_log(req, 'xoa_noi_quy', 'noi_quy', req.params.id, null, null, null);
  return success(res, null, 'Đã xóa nội quy');
};

// ── Cài đặt thông báo tự động ─────────────────────────────

const NOTIF_KEYS = [
  { khoa: 'notif_sap_het_han',      nhan: 'Sắp hết hạn gói tập',           mo_ta: 'Thông báo khi gói tập còn 1-7 ngày' },
  { khoa: 'notif_het_han',          nhan: 'Hết hạn gói tập',                mo_ta: 'Thông báo khi gói tập hết hạn hôm nay' },
  { khoa: 'notif_sinh_nhat',        nhan: 'Sinh nhật hội viên',              mo_ta: 'Chúc mừng sinh nhật hội viên' },
  { khoa: 'notif_sap_het_buoi_pt',  nhan: 'Sắp hết buổi PT',                mo_ta: 'Thông báo khi còn ≤2 buổi PT' },
  { khoa: 'notif_tom_tat_buoi_sang',nhan: 'Tóm tắt buổi sáng (Admin)',      mo_ta: 'Tóm tắt hàng ngày lúc 08:00 sáng' },
  { khoa: 'notif_pt_chua_checkin',  nhan: 'PT chưa check-in trước buổi tập',mo_ta: 'Cảnh báo mỗi 5 phút khi PT chưa check-in' },
];

// GET /api/config/notification-settings — Lấy cài đặt toggle thông báo
export const getNotifSettings = (req, res) => {
  const result = NOTIF_KEYS.map(item => {
    const row = db.prepare(`SELECT gia_tri, ngay_cap_nhat FROM cau_hinh WHERE khoa = ?`).get(item.khoa);
    return {
      khoa: item.khoa,
      nhan: item.nhan,
      mo_ta: item.mo_ta,
      bat: row ? row.gia_tri === '1' : true,
      ngay_cap_nhat: row?.ngay_cap_nhat || null,
    };
  });
  return success(res, result, 'Lấy cài đặt thông báo thành công');
};

// PUT /api/config/notification-settings — Cập nhật toggle thông báo
export const updateNotifSettings = (req, res) => {
  const updates = req.body; // { notif_sap_het_han: true/false, ... }
  if (!updates || typeof updates !== 'object') return error(res, 'Body không hợp lệ', 400);

  const validKeys = NOTIF_KEYS.map(k => k.khoa);
  const stmt = db.prepare(`
    INSERT INTO cau_hinh (khoa, gia_tri, ngay_cap_nhat)
    VALUES (?, ?, datetime('now','localtime'))
    ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, ngay_cap_nhat = excluded.ngay_cap_nhat
  `);

  const updateTx = db.transaction(() => {
    for (const [khoa, val] of Object.entries(updates)) {
      if (!validKeys.includes(khoa)) continue;
      stmt.run(khoa, val ? '1' : '0');
    }
  });
  updateTx();

  ghi_audit_log(req, 'cap_nhat_cai_dat_thong_bao', 'cau_hinh', null, null, updates, null);
  return success(res, null, 'Đã cập nhật cài đặt thông báo');
};
