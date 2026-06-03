/**
 * Check-ins Controller — Quản lý lượt vào/ra phòng tập
 */

import db from '../config/db.js';
import { success, error } from '../utils/response.js';
import { createNotification } from '../utils/notifications.js';
import { ghi_audit_log } from '../utils/audit.js';

// ── GET /api/checkins ─────────────────────────────────────
// Lịch sử vào/ra (mặc định hôm nay hoặc tất cả nếu date === 'all')
export const getCheckins = (req, res) => {
  const { date, ho_so_id, loai, chi_nhanh, limit = 50 } = req.query;
  const today = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' }).split(' ')[0];

  let where = `WHERE 1=1`;
  const params = [];

  if (date !== 'all') {
    const targetDate = date || today;
    where += ` AND date(lv.thoi_diem) = ?`;
    params.push(targetDate);
  }

  if (ho_so_id) { where += ` AND lv.ho_so_id = ?`; params.push(ho_so_id); }
  if (loai) { where += ` AND lv.loai = ?`; params.push(loai); }
  if (chi_nhanh) { where += ` AND lv.chi_nhanh_thuc_hien = ?`; params.push(chi_nhanh); }

  const rows = db.prepare(`
    SELECT
      lv.id, lv.thoi_diem, lv.loai, lv.phuong_thuc, lv.ghi_chu, lv.chi_nhanh_thuc_hien,
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
  const { ho_so_id, loai = 'vao', phuong_thuc = 'thu_cong', ghi_chu, chi_nhanh_thuc_hien } = req.body;
  if (!loai || !['vao', 'ra'].includes(loai)) {
    return error(res, 'loai phải là "vao" hoặc "ra".', 400);
  }

  // Kiểm tra hồ sơ nếu có
  if (ho_so_id) {
    const profile = db.prepare('SELECT id, ho_ten, loai_ho_so FROM ho_so WHERE id = ? AND is_deleted = 0').get(ho_so_id);
    if (!profile) return error(res, 'Hồ sơ không tồn tại.', 404);

    // Chỉ check hạn đối với hội viên (bỏ qua PT và Nhân viên/Lễ tân)
    if (profile.loai_ho_so === 'hoi_vien') {
      const today = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' }).split(' ')[0];
      const activeCheck = db.prepare(`
        SELECT (
          SELECT MAX(d_ngay) FROM (
            SELECT den_ngay as d_ngay FROM dang_ky_goi_tap WHERE ho_so_id = ? AND trang_thai = 'dang_hoat_dong' AND tu_ngay <= ?
            UNION ALL
            SELECT den_ngay as d_ngay FROM dang_ky_pt WHERE hoi_vien_id = ? AND trang_thai = 'dang_hoat_dong' AND tu_ngay <= ?
          )
        ) AS ngay_ket_thuc
      `).get(ho_so_id, today, ho_so_id, today);

      if (!activeCheck || !activeCheck.ngay_ket_thuc) {
        return error(res, `Hội viên ${profile.ho_ten} không có gói tập hoặc gói PT đang hoạt động.`, 403);
      }
      if (activeCheck.ngay_ket_thuc < today) {
        return error(res, `Gói dịch vụ của ${profile.ho_ten} đã hết hạn (${activeCheck.ngay_ket_thuc}).`, 403);
      }
    }
  }

  // Xác định chi nhánh thực hiện check-in
  let branch = chi_nhanh_thuc_hien;
  if (!branch) {
    const actor = db.prepare('SELECT chi_nhanh FROM ho_so WHERE tai_khoan_id = ?').get(req.user.id);
    if (actor && actor.chi_nhanh) {
      branch = actor.chi_nhanh;
    } else if (ho_so_id) {
      const member = db.prepare('SELECT chi_nhanh FROM ho_so WHERE id = ?').get(ho_so_id);
      branch = member ? member.chi_nhanh : null;
    }
  }

  const result = db.prepare(`
    INSERT INTO luot_vao_ra (ho_so_id, loai, phuong_thuc, ghi_chu, chi_nhanh_thuc_hien)
    VALUES (?, ?, ?, ?, ?)
  `).run(ho_so_id || null, loai, phuong_thuc, ghi_chu || null, branch || null);

  // Cập nhật da_checkin = 1 cho các buổi tập PT của hội viên này hôm nay nếu vào
  if (loai === 'vao' && ho_so_id) {
    const today = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' }).split(' ')[0];
    db.prepare(`
      UPDATE lich_tap SET da_checkin = 1
      WHERE hoi_vien_id = ? AND ngay_tap = ? AND trang_thai = 'cho_tap'
    `).run(ho_so_id, today);
  }

  const newRow = db.prepare(`
    SELECT lv.*, h.ho_ten, h.ma_ho_so, h.avatar_url FROM luot_vao_ra lv
    LEFT JOIN ho_so h ON h.id = lv.ho_so_id
    WHERE lv.id = ?
  `).get(result.lastInsertRowid);

  if (loai === 'vao' && newRow.ho_ten) {
    const thoiGian = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    createNotification(
      'check_in',
      `Check-in — ${newRow.ma_ho_so || ''} ${newRow.ho_ten}`,
      `${newRow.ma_ho_so || ''} ${newRow.ho_ten} vừa check-in lúc ${thoiGian}`,
      ho_so_id,
      'ho_so',
      'ca_hai'
    );
  }

  const labelAction = loai === 'vao' ? 'Check-in tập luyện' : 'Check-out ra về';
  const targetMemberName = newRow?.ho_ten || 'Hội viên';
  ghi_audit_log(req, 'CREATE', 'luot_vao_ra', result.lastInsertRowid, null,
    { ho_so_id, loai, phuong_thuc }, `Thủ công: ${labelAction} cho ${targetMemberName}${ghi_chu ? ` (${ghi_chu})` : ''}`);

  return success(res, newRow, `Check-${loai} thành công`, 201);
};

// ── GET /api/checkins/stats ───────────────────────────────
// Thống kê mật độ khách theo khung giờ hôm nay (dùng vẽ biểu đồ)
export const getCheckinStats = (req, res) => {
  const { date, chi_nhanh } = req.query;
  const today = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' }).split(' ')[0];
  const targetDate = date || today;

  let branchFilter = '';
  const paramsByHour = [targetDate];
  const paramsSummary = [targetDate];
  const paramsInside = [targetDate, targetDate];

  if (chi_nhanh) {
    branchFilter = ' AND chi_nhanh_thuc_hien = ?';
    paramsByHour.push(chi_nhanh);
    paramsSummary.push(chi_nhanh);
    paramsInside.push(chi_nhanh, chi_nhanh);
  }

  // Mật độ theo từng giờ
  const byHour = db.prepare(`
    SELECT
      CAST(strftime('%H', thoi_diem) AS INTEGER) AS gio,
      COUNT(*) AS so_luot_vao
    FROM luot_vao_ra
    WHERE loai = 'vao' AND date(thoi_diem) = ?${branchFilter}
    GROUP BY gio
    ORDER BY gio
  `).all(...paramsByHour);

  // Tổng hôm nay
  const summary = db.prepare(`
    SELECT
      COUNT(*) AS tong_luot,
      SUM(CASE WHEN loai = 'vao' THEN 1 ELSE 0 END) AS luot_vao,
      SUM(CASE WHEN loai = 'ra' THEN 1 ELSE 0 END) AS luot_ra
    FROM luot_vao_ra WHERE date(thoi_diem) = ?${branchFilter}
  `).get(...paramsSummary);

  // Đang trong phòng tập (vào mà chưa ra)
  const currentlyInside = db.prepare(`
    SELECT COUNT(DISTINCT ho_so_id) AS so_nguoi_trong_phong
    FROM luot_vao_ra lv
    WHERE date(thoi_diem) = ? AND loai = 'vao'${branchFilter}
      AND NOT EXISTS (
        SELECT 1 FROM luot_vao_ra lv2
        WHERE lv2.ho_so_id = lv.ho_so_id AND lv2.loai = 'ra'${branchFilter.replace('chi_nhanh_thuc_hien', 'lv2.chi_nhanh_thuc_hien')}
          AND lv2.thoi_diem > lv.thoi_diem AND date(lv2.thoi_diem) = ?
      )
  `).get(...paramsInside);

  return success(res, {
    ngay: targetDate,
    tong_luot: summary.tong_luot,
    luot_vao: summary.luot_vao,
    luot_ra: summary.luot_ra,
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
  let hoSo = db.prepare('SELECT id FROM ho_so WHERE tai_khoan_id = ? AND is_deleted = 0').get(req.user.id);
  if (!hoSo) {
    hoSo = db.prepare('SELECT id FROM ho_so WHERE tai_khoan_id = ?').get(req.user.id);
  }

  if (!hoSo) {
    return success(res, { data: [], pagination: { page: parseInt(page), limit: parseInt(limit), total: 0 } });
  }

  const rows = db.prepare(`
    SELECT id, thoi_diem, loai, phuong_thuc, ghi_chu,
           strftime('%H:%M', thoi_diem) AS gio_hien_thi
    FROM luot_vao_ra WHERE ho_so_id = ?
    ORDER BY thoi_diem DESC LIMIT ? OFFSET ?
  `).all(hoSo.id, parseInt(limit), offset);

  const total = db.prepare('SELECT COUNT(*) as cnt FROM luot_vao_ra WHERE ho_so_id = ?').get(hoSo.id).cnt;
  return success(res, { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
};
