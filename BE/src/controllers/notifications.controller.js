/**
 * Notifications Controller — Hệ thống thông báo bell icon
 */

import db from '../config/db.js';
import { success, error } from '../utils/response.js';

// Lấy điều kiện filter thông báo theo vai trò người dùng
function buildRoleFilter(vaiTro) {
  if (vaiTro === 'admin') return `(danh_cho = 'admin' OR danh_cho = 'ca_hai')`;
  if (vaiTro === 'le_tan') return `(danh_cho = 'le_tan' OR danh_cho = 'ca_hai')`;
  return `danh_cho = 'ca_hai'`; // fallback
}

// ── GET /api/notifications ────────────────────────────────
// Lấy 20 thông báo mới nhất của role hiện tại
export const getNotifications = (req, res) => {
  const filter = buildRoleFilter(req.user.vai_tro);
  const rows = db.prepare(`
    SELECT id, loai, tieu_de, noi_dung, doi_tuong_id, doi_tuong,
           danh_cho, da_doc, ngay_tao
    FROM thong_bao
    WHERE ${filter} AND da_doc = 0
    ORDER BY ngay_tao DESC
    LIMIT 20
  `).all();
  return success(res, rows);
};

// ── GET /api/notifications/unread-count ──────────────────
// Chỉ trả count — dùng cho polling mỗi 30 giây
export const getUnreadCount = (req, res) => {
  const filter = buildRoleFilter(req.user.vai_tro);
  const row = db.prepare(`
    SELECT COUNT(*) AS count FROM thong_bao
    WHERE ${filter} AND da_doc = 0
  `).get();
  return success(res, { count: row.count });
};

// ── GET /api/notifications/summary ───────────────────────
// Tổng hợp khi login: số lượng theo từng loại
export const getSummary = (req, res) => {
  const filter = buildRoleFilter(req.user.vai_tro);

  const sapHetHan = db.prepare(`
    SELECT COUNT(*) AS cnt FROM thong_bao
    WHERE ${filter} AND loai = 'sap_het_han_goi_tap' AND da_doc = 0
      AND date(ngay_tao) = date('now','localtime')
  `).get().cnt;

  const hetHan = db.prepare(`
    SELECT COUNT(*) AS cnt FROM thong_bao
    WHERE ${filter} AND loai = 'het_han_goi_tap' AND da_doc = 0
      AND date(ngay_tao) = date('now','localtime')
  `).get().cnt;

  const sapHetBuoiPt = db.prepare(`
    SELECT COUNT(*) AS cnt FROM thong_bao
    WHERE ${filter} AND loai = 'sap_het_buoi_pt' AND da_doc = 0
      AND date(ngay_tao) = date('now','localtime')
  `).get().cnt;

  const tongChuaDoc = db.prepare(`
    SELECT COUNT(*) AS cnt FROM thong_bao
    WHERE ${filter} AND da_doc = 0
  `).get().cnt;

  return success(res, {
    sap_het_han: sapHetHan,
    het_han: hetHan,
    sap_het_buoi_pt: sapHetBuoiPt,
    tong_chua_doc: tongChuaDoc,
  });
};

// ── PATCH /api/notifications/:id/read ────────────────────
// Đánh dấu 1 thông báo đã đọc
export const markAsRead = (req, res) => {
  const { id } = req.params;
  const filter = buildRoleFilter(req.user.vai_tro);

  const notif = db.prepare(`
    SELECT id, da_doc FROM thong_bao WHERE id = ? AND ${filter}
  `).get(id);

  if (!notif) return error(res, 'Thông báo không tồn tại.', 404);
  if (notif.da_doc === 1) return success(res, null, 'Thông báo đã được đọc trước đó.');

  db.prepare(`
    UPDATE thong_bao
    SET da_doc = 1, doc_boi_id = ?, ngay_doc = datetime('now','localtime')
    WHERE id = ?
  `).run(req.user.id, id);

  return success(res, null, 'Đã đánh dấu đã đọc.');
};

// ── PATCH /api/notifications/read-all ────────────────────
// Đánh dấu tất cả thông báo chưa đọc của role hiện tại là đã đọc
export const markAllAsRead = (req, res) => {
  const filter = buildRoleFilter(req.user.vai_tro);

  const result = db.prepare(`
    UPDATE thong_bao
    SET da_doc = 1, doc_boi_id = ?, ngay_doc = datetime('now','localtime')
    WHERE ${filter} AND da_doc = 0
  `).run(req.user.id);

  return success(res, { updated: result.changes }, `Đã đánh dấu ${result.changes} thông báo đã đọc.`);
};

// ── DELETE /api/notifications/:id ────────────────────────
// Xóa 1 thông báo khỏi cơ sở dữ liệu
export const deleteNotification = (req, res) => {
  const { id } = req.params;
  const filter = buildRoleFilter(req.user.vai_tro);

  const notif = db.prepare(`
    SELECT id FROM thong_bao WHERE id = ? AND ${filter}
  `).get(id);

  if (!notif) return error(res, 'Thông báo không tồn tại.', 404);

  db.prepare(`DELETE FROM thong_bao WHERE id = ?`).run(id);

  return success(res, null, 'Đã xóa thông báo thành công.');
};

// ── DELETE /api/notifications ────────────────────────────
// Xóa tất cả thông báo của role hiện tại
export const deleteAllNotifications = (req, res) => {
  const filter = buildRoleFilter(req.user.vai_tro);

  const result = db.prepare(`DELETE FROM thong_bao WHERE ${filter}`).run();

  return success(res, { deleted: result.changes }, `Đã xóa ${result.changes} thông báo.`);
};
