/**
 * Revenue Controller — Thống kê doanh thu & tổng quan Dashboard
 * FIX:
 *   1. getRevenueToday / getRevenueYesterday: lọc theo COALESCE(ngay_thanh_toan, ngay_tao)
 *      thay vì chỉ date(ngay_tao) để khớp đúng với bảng doanh_thu
 *   2. getDashboard: không thay đổi
 */

import db from '../config/db.js';
import { success } from '../utils/response.js';

// ── GET /api/revenue ──────────────────────────────────────
// Doanh thu 30 ngày + tổng hợp
export const getRevenue = (req, res) => {
  const { days = 30 } = req.query;
  const daysInt = parseInt(days);
  const currentMonthStart = db.prepare(`SELECT date('now','localtime','start of month') AS d`).get().d;
  const nextMonthStart = db.prepare(`SELECT date('now','localtime','start of month','+1 month') AS d`).get().d;
  const previousMonthStart = db.prepare(`SELECT date('now','localtime','start of month','-1 month') AS d`).get().d;
  const todayDay = db.prepare(`SELECT CAST(strftime('%d', date('now','localtime')) AS INTEGER) AS d`).get().d;
  const previousMonthDays = db.prepare(`SELECT CAST(strftime('%d', date('now','localtime','start of month','-1 day')) AS INTEGER) AS d`).get().d;

  // Lấy dữ liệu DB trong khoảng ngày
  const dbRows = db.prepare(`
    SELECT d.ngay, d.tong_tien, d.tong_don, d.tien_goi_tap, d.tien_goi_pt,
           (SELECT tong_tien FROM doanh_thu d2 WHERE d2.ngay = date(d.ngay, '-1 month')) AS tong_tien_thang_truoc
    FROM doanh_thu d
    WHERE d.ngay >= date('now','localtime','-' || ? || ' days')
    ORDER BY d.ngay ASC
  `).all(daysInt);

  // Tạo map để tra nhanh
  const dbMap = new Map(dbRows.map(r => [r.ngay, r]));

  // Sinh danh sách đầy đủ các ngày (fill 0đ cho ngày không có dữ liệu)
  const today = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' }).split(' ')[0];
  const daily = [];
  for (let i = daysInt; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('sv').split(' ')[0];
    const row = dbMap.get(dateStr);
    daily.push({
      ngay: dateStr,
      tong_tien: row?.tong_tien || 0,
      tong_don: row?.tong_don || 0,
      tien_goi_tap: row?.tien_goi_tap || 0,
      tien_goi_pt: row?.tien_goi_pt || 0,
      tong_tien_thang_truoc: row?.tong_tien_thang_truoc || 0,
    });
  }

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
  `).get(daysInt);

  // Thống kê theo gói tập
  const packageStats = db.prepare(`
    SELECT gt.ten_goi, COUNT(dk.id) AS so_dang_ky, SUM(dk.gia_thuc_te) AS tong_tien
    FROM dang_ky_goi_tap dk
    JOIN goi_tap gt ON gt.id = dk.goi_tap_id
    WHERE dk.ngay_tao >= date('now','localtime','-' || ? || ' days')
    GROUP BY gt.id, gt.ten_goi
    ORDER BY so_dang_ky DESC
  `).all(daysInt);

  const currentMonthRows = db.prepare(`
    SELECT CAST(strftime('%d', ngay) AS INTEGER) AS ngay_trong_thang,
           tong_tien, tong_don, tien_goi_tap, tien_goi_pt
    FROM doanh_thu
    WHERE ngay >= ? AND ngay < ?
    ORDER BY ngay ASC
  `).all(currentMonthStart, nextMonthStart);

  const previousMonthRows = db.prepare(`
    SELECT CAST(strftime('%d', ngay) AS INTEGER) AS ngay_trong_thang,
           tong_tien, tong_don, tien_goi_tap, tien_goi_pt
    FROM doanh_thu
    WHERE ngay >= ? AND ngay < ?
    ORDER BY ngay ASC
  `).all(previousMonthStart, currentMonthStart);

  const currentByDay = new Map(currentMonthRows.map(row => [row.ngay_trong_thang, row]));
  const previousByDay = new Map(previousMonthRows.map(row => [row.ngay_trong_thang, row]));
  const maxDay = Math.max(todayDay, previousMonthDays);
  const labels = Array.from({ length: maxDay }, (_, index) => index + 1);

  const monthComparison = {
    current_month: currentMonthStart.slice(0, 7),
    previous_month: previousMonthStart.slice(0, 7),
    labels,
    current: labels.map(day => ({
      ngay_trong_thang: day,
      tong_tien: day <= todayDay ? (currentByDay.get(day)?.tong_tien || 0) : null,
      tong_don: day <= todayDay ? (currentByDay.get(day)?.tong_don || 0) : null,
      tien_goi_tap: day <= todayDay ? (currentByDay.get(day)?.tien_goi_tap || 0) : null,
      tien_goi_pt: day <= todayDay ? (currentByDay.get(day)?.tien_goi_pt || 0) : null,
    })),
    previous: labels.map(day => ({
      ngay_trong_thang: day,
      tong_tien: previousByDay.get(day)?.tong_tien || 0,
      tong_don: previousByDay.get(day)?.tong_don || 0,
      tien_goi_tap: previousByDay.get(day)?.tien_goi_tap || 0,
      tien_goi_pt: previousByDay.get(day)?.tien_goi_pt || 0,
    })),
  };

  monthComparison.summary = {
    current_total: currentMonthRows.reduce((sum, row) => sum + (row.tong_tien || 0), 0),
    previous_total: previousMonthRows.reduce((sum, row) => sum + (row.tong_tien || 0), 0),
    current_orders: currentMonthRows.reduce((sum, row) => sum + (row.tong_don || 0), 0),
    previous_orders: previousMonthRows.reduce((sum, row) => sum + (row.tong_don || 0), 0),
  };

  // Lấy các giao dịch chi tiết trong khoảng thời gian lọc
  const goiTapTransactions = db.prepare(`
    SELECT dk.id, dk.ngay_tao AS thoi_gian, 'goi_tap' AS loai,
           gt.ten_goi AS san_pham, h.ho_ten AS khach_hang, dk.gia_thuc_te, dk.phuong_thuc_tt, dk.trang_thai,
           dk.ly_do_huy, dk.so_tien_hoan, dk.ghi_chu_tt
    FROM dang_ky_goi_tap dk
    JOIN goi_tap gt ON gt.id = dk.goi_tap_id
    JOIN ho_so h ON h.id = dk.ho_so_id
    WHERE COALESCE(date(dk.ngay_thanh_toan), date(dk.ngay_tao)) >= date('now','localtime','-' || ? || ' days')
      AND dk.trang_thai IN ('dang_hoat_dong', 'het_han', 'huy', 'tam_dung')
    ORDER BY dk.ngay_tao DESC
  `).all(daysInt);

  const goiPTTransactions = db.prepare(`
    SELECT dp.id, dp.ngay_tao AS thoi_gian, 'goi_pt' AS loai,
           gp.ten_goi AS san_pham, h.ho_ten AS khach_hang, dp.gia_thuc_te, dp.phuong_thuc_tt, dp.trang_thai,
           NULL AS ly_do_huy, 0 AS so_tien_hoan, dp.ghi_chu_tt
    FROM dang_ky_pt dp
    JOIN goi_pt gp ON gp.id = dp.goi_pt_id
    JOIN ho_so h ON h.id = dp.hoi_vien_id
    WHERE COALESCE(date(dp.ngay_thanh_toan), date(dp.ngay_tao)) >= date('now','localtime','-' || ? || ' days')
      AND dp.trang_thai IN ('dang_hoat_dong', 'hoan_thanh')
    ORDER BY dp.ngay_tao DESC
  `).all(daysInt);

  const transactions = [...goiTapTransactions, ...goiPTTransactions].sort((a, b) => b.thoi_gian.localeCompare(a.thoi_gian));

  return success(res, { daily, summary, packageStats, monthComparison, transactions });
};

// ── GET /api/revenue/today ────────────────────────────────
// Doanh thu hôm nay chi tiết
// FIX: lấy giao dịch theo COALESCE(ngay_thanh_toan, ngay_tao) để khớp với bảng doanh_thu
export const getRevenueToday = (req, res) => {
  const today = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' }).split(' ')[0];

  // Lấy số liệu tổng hợp từ bảng doanh_thu (nguồn chân lý, được trigger cập nhật)
  const todayRevenue = db.prepare('SELECT * FROM doanh_thu WHERE ngay = ?').get(today);
  const yesterdayRevenue = db.prepare(`SELECT tong_tien FROM doanh_thu WHERE ngay = date('now','localtime','-1 days')`).get();
  const lastMonthSameDay = db.prepare(`SELECT tong_tien FROM doanh_thu WHERE ngay = date('now','localtime','-1 month')`).get();

  // FIX: lọc giao dịch theo COALESCE(ngay_thanh_toan, ngay_tao) để khớp trigger
  const goiTapToday = db.prepare(`
    SELECT dk.id, dk.ngay_tao AS thoi_gian, 'goi_tap' AS loai,
           gt.ten_goi AS san_pham, h.ho_ten AS khach_hang, dk.gia_thuc_te, dk.phuong_thuc_tt, dk.trang_thai,
           dk.ly_do_huy, dk.so_tien_hoan, dk.ghi_chu_tt
    FROM dang_ky_goi_tap dk
    JOIN goi_tap gt ON gt.id = dk.goi_tap_id
    JOIN ho_so h ON h.id = dk.ho_so_id
    WHERE COALESCE(date(dk.ngay_thanh_toan), date(dk.ngay_tao)) = ?
      AND dk.trang_thai IN ('dang_hoat_dong', 'het_han', 'huy', 'tam_dung')
    ORDER BY dk.ngay_tao DESC
  `).all(today);

  // FIX: lọc giao dịch theo COALESCE(ngay_thanh_toan, ngay_tao)
  const goiPTToday = db.prepare(`
    SELECT dp.id, dp.ngay_tao AS thoi_gian, 'goi_pt' AS loai,
           gp.ten_goi AS san_pham, h.ho_ten AS khach_hang, dp.gia_thuc_te, dp.phuong_thuc_tt, dp.trang_thai,
           NULL AS ly_do_huy, 0 AS so_tien_hoan, dp.ghi_chu_tt
    FROM dang_ky_pt dp
    JOIN goi_pt gp ON gp.id = dp.goi_pt_id
    JOIN ho_so h ON h.id = dp.hoi_vien_id
    WHERE COALESCE(date(dp.ngay_thanh_toan), date(dp.ngay_tao)) = ?
      AND dp.trang_thai IN ('dang_hoat_dong', 'hoan_thanh')
    ORDER BY dp.ngay_tao DESC
  `).all(today);

  const giaoDichHomNay = [...goiTapToday, ...goiPTToday].sort((a, b) => b.thoi_gian.localeCompare(a.thoi_gian));

  // Hội viên mới đăng ký hôm nay
  const soHvMoiHomNay = db.prepare(`
    SELECT COUNT(*) as c FROM ho_so 
    WHERE date(ngay_tao) = ? AND loai_ho_so = 'hoi_vien' AND is_deleted = 0
  `).get(today).c;

  return success(res, {
    ngay: today,
    // Lấy từ bảng doanh_thu (nguồn chân lý) thay vì tính lại từ giao dịch
    tong_tien: todayRevenue?.tong_tien || 0,
    tong_don: todayRevenue?.tong_don || 0,
    tien_goi_tap: todayRevenue?.tien_goi_tap || 0,
    tien_goi_pt: todayRevenue?.tien_goi_pt || 0,
    hom_qua: yesterdayRevenue?.tong_tien || 0,
    thang_truoc_cung_ngay: lastMonthSameDay?.tong_tien || 0,
    so_hv_moi: soHvMoiHomNay,
    giao_dich: giaoDichHomNay,
  });
};

// ── GET /api/revenue/yesterday ────────────────────────────
// Doanh thu hôm qua chi tiết
// FIX: lọc giao dịch theo COALESCE(ngay_thanh_toan, ngay_tao)
export const getRevenueYesterday = (req, res) => {
  const yesterday = db.prepare(`SELECT date('now','localtime','-1 days') as d`).get().d;
  const twoDaysAgo = db.prepare(`SELECT date('now','localtime','-2 days') as d`).get().d;
  const lastMonthSameDay = db.prepare(`SELECT date('now','localtime','-1 days','-1 month') as d`).get().d;

  const yesterdayRevenue = db.prepare('SELECT * FROM doanh_thu WHERE ngay = ?').get(yesterday);
  const twoDaysAgoRevenue = db.prepare('SELECT tong_tien FROM doanh_thu WHERE ngay = ?').get(twoDaysAgo);
  const lastMonthSameDayRevenue = db.prepare('SELECT tong_tien FROM doanh_thu WHERE ngay = ?').get(lastMonthSameDay);

  // FIX: lọc theo COALESCE(ngay_thanh_toan, ngay_tao)
  const goiTapYesterday = db.prepare(`
    SELECT dk.id, dk.ngay_tao AS thoi_gian, 'goi_tap' AS loai,
           gt.ten_goi AS san_pham, h.ho_ten AS khach_hang, dk.gia_thuc_te, dk.phuong_thuc_tt, dk.trang_thai,
           dk.ly_do_huy, dk.so_tien_hoan, dk.ghi_chu_tt
    FROM dang_ky_goi_tap dk
    JOIN goi_tap gt ON gt.id = dk.goi_tap_id
    JOIN ho_so h ON h.id = dk.ho_so_id
    WHERE COALESCE(date(dk.ngay_thanh_toan), date(dk.ngay_tao)) = ?
      AND dk.trang_thai IN ('dang_hoat_dong', 'het_han', 'huy', 'tam_dung')
    ORDER BY dk.ngay_tao DESC
  `).all(yesterday);

  // FIX: lọc theo COALESCE(ngay_thanh_toan, ngay_tao)
  const goiPTYesterday = db.prepare(`
    SELECT dp.id, dp.ngay_tao AS thoi_gian, 'goi_pt' AS loai,
           gp.ten_goi AS san_pham, h.ho_ten AS khach_hang, dp.gia_thuc_te, dp.phuong_thuc_tt, dp.trang_thai,
           NULL AS ly_do_huy, 0 AS so_tien_hoan, dp.ghi_chu_tt
    FROM dang_ky_pt dp
    JOIN goi_pt gp ON gp.id = dp.goi_pt_id
    JOIN ho_so h ON h.id = dp.hoi_vien_id
    WHERE COALESCE(date(dp.ngay_thanh_toan), date(dp.ngay_tao)) = ?
      AND dp.trang_thai IN ('dang_hoat_dong', 'hoan_thanh')
    ORDER BY dp.ngay_tao DESC
  `).all(yesterday);

  const giaoDichHomQua = [...goiTapYesterday, ...goiPTYesterday].sort((a, b) => b.thoi_gian.localeCompare(a.thoi_gian));

  // Hội viên mới đăng ký hôm qua
  const soHvMoiHomQua = db.prepare(`
    SELECT COUNT(*) as c FROM ho_so 
    WHERE date(ngay_tao) = ? AND loai_ho_so = 'hoi_vien' AND is_deleted = 0
  `).get(yesterday).c;

  return success(res, {
    ngay: yesterday,
    tong_tien: yesterdayRevenue?.tong_tien || 0,
    tong_don: yesterdayRevenue?.tong_don || 0,
    tien_goi_tap: yesterdayRevenue?.tien_goi_tap || 0,
    tien_goi_pt: yesterdayRevenue?.tien_goi_pt || 0,
    hom_qua: twoDaysAgoRevenue?.tong_tien || 0,
    thang_truoc_cung_ngay: lastMonthSameDayRevenue?.tong_tien || 0,
    so_hv_moi: soHvMoiHomQua,
    giao_dich: giaoDichHomQua,
  });
};


// ── GET /api/revenue/dashboard ────────────────────────────
// Tổng quan dashboard (số liệu tổng hợp nhanh)
export const getDashboard = (req, res) => {
  const today = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' }).split(' ')[0];

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
    doanh_thu_hom_nay: db.prepare('SELECT tong_tien, tong_don FROM doanh_thu WHERE ngay = ?').get(today) || { tong_tien: 0, tong_don: 0 },

    // Lượt vào ra hôm nay
    luot_vao_ra_hom_nay: db.prepare(`
      SELECT COUNT(*) AS tong_luot,
             COALESCE(SUM(CASE WHEN loai = 'vao' THEN 1 ELSE 0 END), 0) AS luot_vao
      FROM luot_vao_ra WHERE date(thoi_diem) = ?
    `).get(today),

    // Lịch tập hôm nay
    lich_tap_hom_nay: db.prepare(`
      SELECT COUNT(*) AS tong,
             COALESCE(SUM(CASE WHEN trang_thai = 'cho_tap' THEN 1 ELSE 0 END), 0) AS cho_tap,
             COALESCE(SUM(CASE WHEN trang_thai = 'da_tap' THEN 1 ELSE 0 END), 0) AS da_tap
      FROM lich_tap WHERE ngay_tap = ? AND trang_thai NOT IN ('da_huy', 'hoan_tac')
    `).get(today),
  };

  const yesterday = db.prepare(`SELECT date('now','localtime','-1 days') as d`).get().d;
  const startOfMonth = today.substring(0, 8) + '01';

  const yesterdayLuotVao = db.prepare(`SELECT COUNT(*) as c FROM luot_vao_ra WHERE date(thoi_diem) = ? AND loai = 'vao'`).get(yesterday).c;
  const yesterdayDoanhThu = db.prepare(`SELECT tong_tien FROM doanh_thu WHERE ngay = ?`).get(yesterday)?.tong_tien || 0;
  const newMembersThisMonth = db.prepare(`SELECT COUNT(*) as c FROM ho_so WHERE date(ngay_tao) >= ? AND loai_ho_so = 'hoi_vien' AND is_deleted = 0`).get(startOfMonth).c;

  const calcPercent = (curr, prev) => prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev * 100);

  stats.percent_changes = {
    hoi_vien: ((newMembersThisMonth / (stats.hoi_vien.tong || 1)) * 100).toFixed(2),
    luot_vao: calcPercent(stats.luot_vao_ra_hom_nay.luot_vao, yesterdayLuotVao).toFixed(2),
    doanh_thu: calcPercent(stats.doanh_thu_hom_nay.tong_tien, yesterdayDoanhThu).toFixed(2),
    sap_het_han: ((stats.hoi_vien.sap_het_han / (stats.hoi_vien.tong || 1)) * 100).toFixed(2)
  };

  stats.doanh_thu_thang = db.prepare(`
    SELECT SUM(tong_tien) AS sum FROM doanh_thu 
    WHERE ngay >= ? AND ngay <= ?
  `).get(startOfMonth, today).sum || 0;

  stats.so_goi_ban_thang = db.prepare(`
    SELECT COUNT(*) AS c FROM dang_ky_goi_tap 
    WHERE date(ngay_tao) >= ? AND trang_thai != 'huy'
  `).get(startOfMonth).c;

  stats.yeu_cau_cho_duyet = db.prepare(`
    SELECT COUNT(*) AS c FROM dang_ky_goi_tap 
    WHERE trang_thai = 'cho_duyet'
      AND (payos_status IS NULL OR payos_status = 'PENDING')
      AND ngay_thanh_toan IS NULL
  `).get().c;

  stats.check_in_tuan_nay = db.prepare(`
    SELECT COUNT(*) AS c FROM luot_vao_ra 
    WHERE date(thoi_diem) >= date('now', 'localtime', '-6 days') AND loai = 'vao'
  `).get().c;

  stats.tong_nhan_vien = db.prepare(`
    SELECT COUNT(*) AS c FROM ho_so 
    WHERE loai_ho_so = 'nhan_vien' AND is_deleted = 0
  `).get().c;

  stats.tong_goi_tap = db.prepare(`
    SELECT COUNT(*) AS c FROM dang_ky_goi_tap 
    WHERE trang_thai = 'dang_hoat_dong'
  `).get().c;

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

  const currentMonthStart = today.substring(0, 8) + '01';
  stats.top_hoi_vien = db.prepare(`
    SELECT h.id, h.ma_ho_so, h.ho_ten, h.avatar_url, COUNT(lv.id) as so_buoi_tap
    FROM luot_vao_ra lv
    JOIN ho_so h ON h.id = lv.ho_so_id
    WHERE lv.loai = 'vao' AND date(lv.thoi_diem) >= ?
    GROUP BY h.id
    ORDER BY so_buoi_tap DESC
    LIMIT 5
  `).all(currentMonthStart);

  return success(res, stats);
};