/**
 * Promotions Controller — Quản lý khuyến mãi
 */

import db from '../config/db.js';
import { success, error } from '../utils/response.js';
import { ghi_audit_log } from '../utils/audit.js';

// GET /api/promotions — Danh sách khuyến mãi (có lọc: chỉ active/còn hạn)
export const listPromotions = (req, res) => {
  const { active_only, include_expired } = req.query;
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });

  let where = 'WHERE 1=1';
  const params = [];

  if (active_only === '1') {
    where += ' AND is_active = 1';
  }
  if (include_expired !== '1') {
    where += ' AND (ngay_het_han IS NULL OR ngay_het_han >= ?)';
    params.push(today);
  }

  const rows = db.prepare(`
    SELECT id, ten, loai, gia_tri, ngay_het_han, mo_ta, is_active, ngay_tao, ngay_cap_nhat
    FROM khuyen_mai
    ${where}
    ORDER BY ngay_tao DESC
  `).all(...params);

  return success(res, rows, 'Lấy danh sách khuyến mãi thành công');
};

// GET /api/promotions/:id — Chi tiết khuyến mãi
export const getPromotion = (req, res) => {
  const row = db.prepare(`SELECT * FROM khuyen_mai WHERE id = ?`).get(req.params.id);
  if (!row) return error(res, 'Không tìm thấy khuyến mãi', 404);
  return success(res, row);
};

// POST /api/promotions — Tạo khuyến mãi mới (admin)
export const createPromotion = (req, res) => {
  const { ten, loai, gia_tri, ngay_het_han, mo_ta, is_active = 1 } = req.body;

  if (!ten?.trim()) return error(res, 'Thiếu tên khuyến mãi', 400);
  if (!['phan_tram', 'so_tien'].includes(loai)) return error(res, 'loai phải là phan_tram hoặc so_tien', 400);
  if (!gia_tri || Number(gia_tri) <= 0) return error(res, 'Giá trị khuyến mãi phải lớn hơn 0', 400);
  if (loai === 'phan_tram' && Number(gia_tri) > 100) return error(res, 'Giảm % không được vượt quá 100%', 400);

  const result = db.prepare(`
    INSERT INTO khuyen_mai (ten, loai, gia_tri, ngay_het_han, mo_ta, is_active, nguoi_tao_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    ten.trim(), loai, Number(gia_tri),
    ngay_het_han || null, mo_ta?.trim() || null,
    is_active ? 1 : 0, req.user.id
  );

  ghi_audit_log(req, 'tao_khuyen_mai', 'khuyen_mai', result.lastInsertRowid, null, req.body, null);
  return success(res, { id: result.lastInsertRowid }, 'Tạo khuyến mãi thành công', 201);
};

// PUT /api/promotions/:id — Sửa khuyến mãi (admin)
export const updatePromotion = (req, res) => {
  const old = db.prepare(`SELECT * FROM khuyen_mai WHERE id = ?`).get(req.params.id);
  if (!old) return error(res, 'Không tìm thấy khuyến mãi', 404);

  const { ten, loai, gia_tri, ngay_het_han, mo_ta, is_active } = req.body;

  if (loai && !['phan_tram', 'so_tien'].includes(loai)) return error(res, 'loai không hợp lệ', 400);
  if (loai === 'phan_tram' && gia_tri && Number(gia_tri) > 100) return error(res, 'Giảm % không được vượt quá 100%', 400);

  db.prepare(`
    UPDATE khuyen_mai SET
      ten           = COALESCE(?, ten),
      loai          = COALESCE(?, loai),
      gia_tri       = COALESCE(?, gia_tri),
      ngay_het_han  = ?,
      mo_ta         = COALESCE(?, mo_ta),
      is_active     = COALESCE(?, is_active),
      ngay_cap_nhat = datetime('now','localtime')
    WHERE id = ?
  `).run(
    ten?.trim() || null,
    loai || null,
    gia_tri != null ? Number(gia_tri) : null,
    ngay_het_han !== undefined ? (ngay_het_han || null) : old.ngay_het_han,
    mo_ta?.trim() ?? null,
    is_active != null ? (is_active ? 1 : 0) : null,
    req.params.id
  );

  ghi_audit_log(req, 'sua_khuyen_mai', 'khuyen_mai', req.params.id, old, req.body, null);
  return success(res, null, 'Đã cập nhật khuyến mãi');
};

// DELETE /api/promotions/:id — Xóa khuyến mãi (admin)
export const deletePromotion = (req, res) => {
  const old = db.prepare(`SELECT id FROM khuyen_mai WHERE id = ?`).get(req.params.id);
  if (!old) return error(res, 'Không tìm thấy khuyến mãi', 404);
  db.prepare(`DELETE FROM khuyen_mai WHERE id = ?`).run(req.params.id);
  ghi_audit_log(req, 'xoa_khuyen_mai', 'khuyen_mai', req.params.id, null, null, null);
  return success(res, null, 'Đã xóa khuyến mãi');
};

// GET /api/promotions/active — Danh sách khuyến mãi đang áp dụng (mobile/web khi đăng ký gói)
export const getActivePromotions = (req, res) => {
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
  const rows = db.prepare(`
    SELECT id, ten, loai, gia_tri, ngay_het_han, mo_ta
    FROM khuyen_mai
    WHERE is_active = 1 AND (ngay_het_han IS NULL OR ngay_het_han >= ?)
    ORDER BY loai ASC, gia_tri DESC
  `).all(today);
  return success(res, rows, 'Lấy danh sách khuyến mãi đang áp dụng');
};
