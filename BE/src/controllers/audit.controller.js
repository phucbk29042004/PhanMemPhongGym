/**
 * Audit Log Controller — Xem lịch sử thao tác hệ thống
 */

import db from '../config/db.js';
import { success, error } from '../utils/response.js';

// GET /api/audit — Lấy audit log (admin)
export const getAuditLogs = (req, res) => {
  const {
    page = 1, limit = 50,
    tai_khoan_id, vai_tro, hanh_dong, doi_tuong,
    tu_ngay, den_ngay,
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  let where = 'WHERE 1=1';

  if (tai_khoan_id) { where += ' AND a.tai_khoan_id = ?'; params.push(tai_khoan_id); }
  if (vai_tro)      { where += ' AND a.vai_tro = ?';      params.push(vai_tro); }
  if (hanh_dong)    { where += ' AND a.hanh_dong = ?';    params.push(hanh_dong); }
  if (doi_tuong)    { where += ' AND a.doi_tuong = ?';    params.push(doi_tuong); }
  if (tu_ngay)      { where += ' AND date(a.thoi_diem) >= ?'; params.push(tu_ngay); }
  if (den_ngay)     { where += ' AND date(a.thoi_diem) <= ?'; params.push(den_ngay); }

  const total = db.prepare(`SELECT COUNT(*) as cnt FROM audit_log a ${where}`).get(...params)?.cnt ?? 0;

  const rows = db.prepare(`
    SELECT
      a.id, a.ten_dang_nhap, a.vai_tro, a.hanh_dong,
      a.doi_tuong, a.doi_tuong_id, a.gia_tri_cu, a.gia_tri_moi,
      a.ip_address, a.ghi_chu, a.thoi_diem,
      (SELECT ho_ten FROM ho_so h WHERE h.tai_khoan_id = a.tai_khoan_id LIMIT 1) as ho_ten
    FROM audit_log a
    ${where}
    ORDER BY a.thoi_diem DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  return success(res, {
    logs: rows,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
  });
};

// GET /api/audit/actions — Lấy danh sách action types đã có
export const getAuditActions = (req, res) => {
  const rows = db.prepare(`SELECT DISTINCT hanh_dong FROM audit_log ORDER BY hanh_dong`).all();
  return success(res, rows.map(r => r.hanh_dong));
};
