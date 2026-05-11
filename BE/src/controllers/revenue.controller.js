/**
 * Revenue Controller — Thống kê doanh thu & tổng quan Dashboard
 */

import db from '../config/db.js';
import { success } from '../utils/response.js';

// ── GET /api/revenue ──────────────────────────────────────
// Doanh thu 30 ngày + tổng hợp
export const getRevenue = (req, res) => {
  const { days = 30 } = req.query;

  // Dữ liệu theo ngày
  const daily = db.prepare(`
    SELECT d.ngay, d.tong_tien, d.tong_don, d.tien_goi_tap, d.tien_goi_pt,
           (SELECT tong_tien FROM doanh_thu d2 WHERE d2.ngay = date(d.ngay, '-1 month')) AS tong_tien_thang_truoc
    FROM doanh_thu d
    WHERE d.ngay >= date('now','localtime','-' || ? || ' days')
    ORDER BY d.ngay ASC
  `).all(parseInt(days));

  // Tổng cộng kỳ này
  const summary = db.prepare(`
    SELECT
      SUM(tong_tien)    AS tong_doanh_thu,
      SUM(tong_don)     AS tong_don,
      SUM(tien_goi_tap) AS tong_goi_tap,
      SUM(tien_goi_pt)  AS tong_goi_pt,
      AVG(tong_tien)    AS trung_binh_ngay
    FROM doanh_thu
    WHERE ngay >= date('now','localtime','-' || ? || ' days')
  `).get(parseInt(days));

  // Thống kê theo gói tập
  const packageStats = db.prepare(`
    SELECT gt.ten_goi, COUNT(dk.id) AS so_dang_ky, SUM(dk.gia_thuc_te) AS tong_tien
    FROM dang_ky_goi_tap dk
    JOIN goi_tap gt ON gt.id = dk.goi_tap_id
    WHERE dk.ngay_tao >= date('now','localtime','-' || ? || ' days')
    GROUP BY gt.id, gt.ten_goi
    ORDER BY so_dang_ky DESC
  `).all(parseInt(days));

  return success(res, { daily, summary, packageStats });
};

// ── GET /api/revenue/today ────────────────────────────────
// Doanh thu hôm nay chi tiết
export const getRevenueToday = (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const todayRevenue = db.prepare('SELECT * FROM doanh_thu WHERE ngay = ?').get(today);
  const yesterdayRevenue = db.prepare(`SELECT tong_tien FROM doanh_thu WHERE ngay = date('now','localtime','-1 days')`).get();
  const lastMonthSameDay = db.prepare(`SELECT tong_tien FROM doanh_thu WHERE ngay = date('now','localtime','-1 month')`).get();

  // Giao dịch hôm nay — gói tập
  const goiTapToday = db.prepare(`
    SELECT dk.id, dk.ngay_tao AS thoi_gian, 'goi_tap' AS loai,
           gt.ten_goi AS san_pham, h.ho_ten AS khach_hang, dk.gia_thuc_te, dk.phuong_thuc_tt
    FROM dang_ky_goi_tap dk
    JOIN goi_tap gt ON gt.id = dk.goi_tap_id
    JOIN ho_so h ON h.id = dk.ho_so_id
    WHERE date(dk.ngay_tao) = ?
    ORDER BY dk.ngay_tao DESC
  `).all(today);

  // Giao dịch hôm nay — gói PT
  const goiPTToday = db.prepare(`
    SELECT dp.id, dp.ngay_tao AS thoi_gian, 'goi_pt' AS loai,
           gp.ten_goi AS san_pham, h.ho_ten AS khach_hang, dp.gia_thuc_te, dp.phuong_thuc_tt
    FROM dang_ky_pt dp
    JOIN goi_pt gp ON gp.id = dp.goi_pt_id
    JOIN ho_so h ON h.id = dp.hoi_vien_id
    WHERE date(dp.ngay_tao) = ?
    ORDER BY dp.ngay_tao DESC
  `).all(today);

  const giaoDichHomNay = [...goiTapToday, ...goiPTToday].sort((a, b) => b.thoi_gian.localeCompare(a.thoi_gian));

  return success(res, {
    ngay: today,
    tong_tien:       todayRevenue?.tong_tien || 0,
    tong_don:        todayRevenue?.tong_don || 0,
    tien_goi_tap:    todayRevenue?.tien_goi_tap || 0,
    tien_goi_pt:     todayRevenue?.tien_goi_pt || 0,
    hom_qua:         yesterdayRevenue?.tong_tien || 0,
    thang_truoc_cung_ngay: lastMonthSameDay?.tong_tien || 0,
    giao_dich:       giaoDichHomNay,
  });
};

// ── GET /api/revenue/dashboard ────────────────────────────
// Tổng quan dashboard (số liệu tổng hợp nhanh)
export const getDashboard = (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const stats = {
    // Tổng số hội viên (theo trạng thái)
    hoi_vien: db.prepare(`
      SELECT
        COUNT(*) AS tong,
        SUM(CASE WHEN trang_thai_mau = 'con_han' THEN 1 ELSE 0 END) AS con_han,
        SUM(CASE WHEN trang_thai_mau = 'sap_het_han' THEN 1 ELSE 0 END) AS sap_het_han,
        SUM(CASE WHEN trang_thai_mau = 'het_han' THEN 1 ELSE 0 END) AS het_han,
        SUM(CASE WHEN trang_thai_mau = 'chua_dang_ky' THEN 1 ELSE 0 END) AS chua_dang_ky
      FROM v_trang_thai_hoi_vien
    `).get(),

    // Tổng số PT
    tong_pt: db.prepare(`SELECT COUNT(*) AS tong FROM ho_so WHERE loai_ho_so = 'pt' AND is_deleted = 0`).get().tong,

    // Doanh thu hôm nay
    doanh_thu_hom_nay: db.prepare('SELECT tong_tien, tong_don FROM doanh_thu WHERE ngay = ?').get(today),

    // Lượt vào ra hôm nay
    luot_vao_ra_hom_nay: db.prepare(`
      SELECT COUNT(*) AS tong_luot,
             SUM(CASE WHEN loai = 'vao' THEN 1 ELSE 0 END) AS luot_vao
      FROM luot_vao_ra WHERE date(thoi_diem) = ?
    `).get(today),

    // Lịch tập hôm nay
    lich_tap_hom_nay: db.prepare(`
      SELECT COUNT(*) AS tong,
             SUM(CASE WHEN trang_thai = 'cho_tap' THEN 1 ELSE 0 END) AS cho_tap,
             SUM(CASE WHEN trang_thai = 'da_tap' THEN 1 ELSE 0 END) AS da_tap
      FROM lich_tap WHERE ngay_tap = ?
    `).get(today),
  };

  // Check-in gần nhất hôm nay (tối đa 8 lượt)
  stats.recent_checkins = db.prepare(`
    SELECT lv.id, lv.thoi_diem, lv.loai,
           h.ma_ho_so, h.ho_ten, h.avatar_url,
           strftime('%H:%M', lv.thoi_diem) AS gio_hien_thi
    FROM luot_vao_ra lv
    LEFT JOIN ho_so h ON h.id = lv.ho_so_id
    WHERE date(lv.thoi_diem) = ? AND lv.loai = 'vao'
    ORDER BY lv.thoi_diem DESC
    LIMIT 8
  `).all(today);

  return success(res, stats);
};
