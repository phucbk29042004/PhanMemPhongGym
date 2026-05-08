/**
 * Packages Controller — Quản lý gói tập & gói PT
 */

import db from '../config/db.js';
import { success, error } from '../utils/response.js';
import { ghi_audit_log } from '../utils/audit.js';

// ── GET /api/packages ─────────────────────────────────────
export const getPackages = (req, res) => {
  const rows = db.prepare(`
    SELECT gt.*,
           (SELECT COUNT(*) FROM dang_ky_goi_tap dk WHERE dk.goi_tap_id = gt.id AND dk.trang_thai = 'dang_hoat_dong') AS so_nguoi_dang_ky
    FROM goi_tap gt
    WHERE gt.is_deleted = 0
    ORDER BY gt.so_thang ASC, gt.gia ASC
  `).all();
  return success(res, rows);
};

// ── GET /api/packages/:id ─────────────────────────────────
export const getPackageById = (req, res) => {
  const pkg = db.prepare('SELECT * FROM goi_tap WHERE id = ? AND is_deleted = 0').get(req.params.id);
  if (!pkg) return error(res, 'Không tìm thấy gói tập.', 404);
  return success(res, pkg);
};

// ── POST /api/packages ────────────────────────────────────
export const createPackage = (req, res) => {
  const { ten_goi, so_thang, so_ngay_them = 0, gia, mo_ta } = req.body;
  if (!ten_goi || so_thang === undefined || gia === undefined) {
    return error(res, 'Thiếu thông tin bắt buộc: ten_goi, so_thang, gia', 400);
  }
  if (gia < 0) return error(res, 'Giá không được âm.', 400);

  const result = db.prepare(`
    INSERT INTO goi_tap (ten_goi, so_thang, so_ngay_them, gia, mo_ta, nguoi_tao_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(ten_goi, so_thang, so_ngay_them, gia, mo_ta || null, req.user.id);

  const newPkg = db.prepare('SELECT * FROM goi_tap WHERE id = ?').get(result.lastInsertRowid);
  ghi_audit_log(req, 'CREATE', 'goi_tap', result.lastInsertRowid, null, { ten_goi, gia }, 'Thêm gói tập mới');
  return success(res, newPkg, 'Tạo gói tập thành công', 201);
};

// ── PUT /api/packages/:id ─────────────────────────────────
export const updatePackage = (req, res) => {
  const { id } = req.params;
  const old = db.prepare('SELECT * FROM goi_tap WHERE id = ? AND is_deleted = 0').get(id);
  if (!old) return error(res, 'Không tìm thấy gói tập.', 404);

  const { ten_goi, so_thang, so_ngay_them, gia, mo_ta } = req.body;
  db.prepare(`
    UPDATE goi_tap SET
      ten_goi = COALESCE(?, ten_goi),
      so_thang = COALESCE(?, so_thang),
      so_ngay_them = COALESCE(?, so_ngay_them),
      gia = COALESCE(?, gia),
      mo_ta = COALESCE(?, mo_ta),
      nguoi_cap_nhat_id = ?
    WHERE id = ?
  `).run(ten_goi || null, so_thang !== undefined ? so_thang : null, so_ngay_them !== undefined ? so_ngay_them : null,
         gia !== undefined ? gia : null, mo_ta || null, req.user.id, id);

  const updated = db.prepare('SELECT * FROM goi_tap WHERE id = ?').get(id);
  ghi_audit_log(req, 'UPDATE', 'goi_tap', parseInt(id), old, updated, 'Cập nhật gói tập');
  return success(res, updated, 'Cập nhật gói tập thành công');
};

// ── DELETE /api/packages/:id ──────────────────────────────
// Soft Delete (trigger DB sẽ chặn nếu đã có người đăng ký)
export const deletePackage = (req, res) => {
  const { id } = req.params;
  const pkg = db.prepare('SELECT * FROM goi_tap WHERE id = ? AND is_deleted = 0').get(id);
  if (!pkg) return error(res, 'Không tìm thấy gói tập.', 404);

  const hasRegistrations = db.prepare('SELECT COUNT(*) as cnt FROM dang_ky_goi_tap WHERE goi_tap_id = ?').get(id).cnt;
  if (hasRegistrations > 0) {
    // Soft Delete thay vì báo lỗi
    db.prepare(`UPDATE goi_tap SET is_deleted = 1, ngay_xoa = datetime('now','localtime'), nguoi_xoa_id = ? WHERE id = ?`).run(req.user.id, id);
    ghi_audit_log(req, 'DELETE', 'goi_tap', parseInt(id), pkg, null, 'Soft delete gói tập (đã có người đăng ký)');
    return success(res, null, 'Đã ẩn gói tập (Soft Delete — gói đã có người đăng ký)');
  }

  // Không có ai đăng ký → xóa thật (hoặc vẫn soft delete cho an toàn)
  db.prepare(`UPDATE goi_tap SET is_deleted = 1, ngay_xoa = datetime('now','localtime'), nguoi_xoa_id = ? WHERE id = ?`).run(req.user.id, id);
  ghi_audit_log(req, 'DELETE', 'goi_tap', parseInt(id), pkg, null, 'Xóa gói tập');
  return success(res, null, 'Xóa gói tập thành công');
};

// ── GET /api/packages/pt ─────────────────────────────────
export const getPTPackages = (req, res) => {
  const rows = db.prepare(`
    SELECT gp.*,
           (SELECT COUNT(*) FROM dang_ky_pt dk WHERE dk.goi_pt_id = gp.id AND dk.trang_thai = 'dang_hoat_dong') AS so_nguoi_dang_ky
    FROM goi_pt gp WHERE gp.is_deleted = 0
    ORDER BY gp.loai_goi, gp.gia ASC
  `).all();
  return success(res, rows);
};
