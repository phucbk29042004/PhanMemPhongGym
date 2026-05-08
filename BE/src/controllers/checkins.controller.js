/**
 * Check-ins Controller — Quản lý lượt vào/ra phòng tập
 */

import db from '../config/db.js';
import { success, error } from '../utils/response.js';

// ── GET /api/checkins ─────────────────────────────────────
// Lịch sử vào/ra (mặc định hôm nay)
export const getCheckins = (req, res) => {
  const { date, ho_so_id, loai, limit = 50 } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  let where = `WHERE date(lv.thoi_diem) = ?`;
  const params = [targetDate];

  if (ho_so_id) { where += ` AND lv.ho_so_id = ?`; params.push(ho_so_id); }
  if (loai) { where += ` AND lv.loai = ?`; params.push(loai); }

  const rows = db.prepare(`
    SELECT
      lv.id, lv.thoi_diem, lv.loai, lv.phuong_thuc, lv.ghi_chu,
      h.id AS ho_so_id, h.ma_ho_so, h.ho_ten, h.avatar_url, h.loai_ho_so,
      strftime('%H:%M', lv.thoi_diem) AS gio_hien_thi
    FROM luot_vao_ra lv
    LEFT JOIN ho_so h ON h.id = lv.ho_so_id
    ${where}
    ORDER BY lv.thoi_diem DESC
    LIMIT ?
  `).all(...params, parseInt(limit));

  return success(res, rows);
};

// ── POST /api/checkins ────────────────────────────────────
// Thêm lượt check-in/check-out
export const createCheckin = (req, res) => {
  const { ho_so_id, loai = 'vao', phuong_thuc = 'thu_cong', ghi_chu } = req.body;
  if (!loai || !['vao', 'ra'].includes(loai)) {
    return error(res, 'loai phải là "vao" hoặc "ra".', 400);
  }

  // Kiểm tra hồ sơ nếu có
  if (ho_so_id) {
    const profile = db.prepare('SELECT id FROM ho_so WHERE id = ? AND is_deleted = 0').get(ho_so_id);
    if (!profile) return error(res, 'Hồ sơ không tồn tại.', 404);
  }

  const result = db.prepare(`
    INSERT INTO luot_vao_ra (ho_so_id, loai, phuong_thuc, ghi_chu)
    VALUES (?, ?, ?, ?)
  `).run(ho_so_id || null, loai, phuong_thuc, ghi_chu || null);

  const newRow = db.prepare(`
    SELECT lv.*, h.ho_ten, h.avatar_url FROM luot_vao_ra lv
    LEFT JOIN ho_so h ON h.id = lv.ho_so_id
    WHERE lv.id = ?
  `).get(result.lastInsertRowid);

  return success(res, newRow, `Check-${loai} thành công`, 201);
};

// ── GET /api/checkins/stats ───────────────────────────────
// Thống kê mật độ khách theo khung giờ hôm nay (dùng vẽ biểu đồ)
export const getCheckinStats = (req, res) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  // Mật độ theo từng giờ
  const byHour = db.prepare(`
    SELECT
      CAST(strftime('%H', thoi_diem) AS INTEGER) AS gio,
      COUNT(*) AS so_luot_vao
    FROM luot_vao_ra
    WHERE loai = 'vao' AND date(thoi_diem) = ?
    GROUP BY gio
    ORDER BY gio
  `).all(targetDate);

  // Tổng hôm nay
  const today = db.prepare(`
    SELECT
      COUNT(*) AS tong_luot,
      SUM(CASE WHEN loai = 'vao' THEN 1 ELSE 0 END) AS luot_vao,
      SUM(CASE WHEN loai = 'ra' THEN 1 ELSE 0 END) AS luot_ra
    FROM luot_vao_ra WHERE date(thoi_diem) = ?
  `).get(targetDate);

  // Đang trong phòng tập (vào mà chưa ra)
  const currentlyInside = db.prepare(`
    SELECT COUNT(DISTINCT ho_so_id) AS so_nguoi_trong_phong
    FROM luot_vao_ra lv
    WHERE date(thoi_diem) = ? AND loai = 'vao'
      AND NOT EXISTS (
        SELECT 1 FROM luot_vao_ra lv2
        WHERE lv2.ho_so_id = lv.ho_so_id AND lv2.loai = 'ra'
          AND lv2.thoi_diem > lv.thoi_diem AND date(lv2.thoi_diem) = ?
      )
  `).get(targetDate, targetDate);

  return success(res, {
    ngay: targetDate,
    tong_luot: today.tong_luot,
    luot_vao: today.luot_vao,
    luot_ra: today.luot_ra,
    dang_trong_phong: currentlyInside.so_nguoi_trong_phong,
    theo_gio: byHour,
  });
};

// ── GET /api/checkins/me ──────────────────────────────────
// Hội viên/PT xem lịch sử vào ra của chính mình
export const getMyCheckins = (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Lấy ho_so_id từ tài khoản đang đăng nhập
  const hoSo = db.prepare('SELECT id FROM ho_so WHERE tai_khoan_id = ? AND is_deleted = 0').get(req.user.id);
  if (!hoSo) return error(res, 'Không tìm thấy hồ sơ của bạn.', 404);

  const rows = db.prepare(`
    SELECT id, thoi_diem, loai, phuong_thuc, ghi_chu,
           strftime('%H:%M', thoi_diem) AS gio_hien_thi
    FROM luot_vao_ra WHERE ho_so_id = ?
    ORDER BY thoi_diem DESC LIMIT ? OFFSET ?
  `).all(hoSo.id, parseInt(limit), offset);

  const total = db.prepare('SELECT COUNT(*) as cnt FROM luot_vao_ra WHERE ho_so_id = ?').get(hoSo.id).cnt;
  return success(res, { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
};
