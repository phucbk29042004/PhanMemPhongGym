/**
 * Cron Job hàng ngày:
 * - 08:00: Sinh thông báo sắp hết hạn / hết hạn gói tập, sắp hết buổi PT, xóa thông báo cũ 30 ngày
 * - Mỗi 5 phút: Kiểm tra buổi PT sắp đến trong 30 phút chưa check-in
 */

import cron from 'node-cron';
import db from '../config/db.js';
import { createNotification } from '../utils/notifications.js';

// ── Cron 08:00 sáng mỗi ngày ─────────────────────────────
function runDailyJob() {
  const today = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD
  console.log(`[CRON-DAILY] ${new Date().toLocaleTimeString('vi-VN')} — Đang chạy job thông báo hàng ngày...`);

  // 1. Sắp hết hạn gói tập (còn 1–7 ngày)
  const sapHetHan = db.prepare(`
    SELECT dk.id, dk.ho_so_id, dk.den_ngay, h.ho_ten,
           g.ten_goi AS ten_goi_tap,
           CAST(julianday(dk.den_ngay) - julianday(date('now','localtime')) AS INTEGER) AS so_ngay_con
    FROM dang_ky_goi_tap dk
    JOIN ho_so h ON h.id = dk.ho_so_id
    JOIN goi_tap g ON g.id = dk.goi_tap_id
    WHERE dk.trang_thai = 'dang_hoat_dong'
      AND dk.den_ngay BETWEEN date('now','localtime','+1 day') AND date('now','localtime','+7 days')
  `).all();

  for (const row of sapHetHan) {
    createNotification(
      'sap_het_han_goi_tap',
      `Sắp hết hạn — ${row.ho_ten}`,
      `${row.ho_ten} — gói ${row.ten_goi_tap} còn ${row.so_ngay_con} ngày (hết hạn ${row.den_ngay})`,
      row.ho_so_id,
      'ho_so',
      'ca_hai'
    );
  }
  if (sapHetHan.length > 0) console.log(`[CRON-DAILY] Đã tạo ${sapHetHan.length} thông báo sắp hết hạn gói tập.`);

  // 2. Hết hạn gói tập hôm nay
  const hetHan = db.prepare(`
    SELECT dk.id, dk.ho_so_id, h.ho_ten, g.ten_goi AS ten_goi_tap
    FROM dang_ky_goi_tap dk
    JOIN ho_so h ON h.id = dk.ho_so_id
    JOIN goi_tap g ON g.id = dk.goi_tap_id
    WHERE dk.trang_thai = 'dang_hoat_dong'
      AND dk.den_ngay = date('now','localtime')
  `).all();

  for (const row of hetHan) {
    createNotification(
      'het_han_goi_tap',
      `Hết hạn hôm nay — ${row.ho_ten}`,
      `${row.ho_ten} — gói ${row.ten_goi_tap} đã hết hạn hôm nay`,
      row.ho_so_id,
      'ho_so',
      'ca_hai'
    );
  }
  if (hetHan.length > 0) console.log(`[CRON-DAILY] Đã tạo ${hetHan.length} thông báo hết hạn gói tập.`);

  // 3. Sắp hết buổi PT (còn <= 2 buổi)
  const sapHetBuoi = db.prepare(`
    SELECT dk.id, dk.hoi_vien_id AS ho_so_id, h.ho_ten,
           (dk.so_buoi_dang_ky - dk.so_buoi_da_tap) AS so_buoi_con
    FROM dang_ky_pt dk
    JOIN ho_so h ON h.id = dk.hoi_vien_id
    WHERE dk.trang_thai = 'dang_hoat_dong'
      AND (dk.so_buoi_dang_ky - dk.so_buoi_da_tap) <= 2
      AND (dk.so_buoi_dang_ky - dk.so_buoi_da_tap) > 0
  `).all();

  for (const row of sapHetBuoi) {
    createNotification(
      'sap_het_buoi_pt',
      `Sắp hết buổi PT — ${row.ho_ten}`,
      `${row.ho_ten} — gói PT còn ${row.so_buoi_con} buổi`,
      row.ho_so_id,
      'ho_so',
      'ca_hai'
    );
  }
  if (sapHetBuoi.length > 0) console.log(`[CRON-DAILY] Đã tạo ${sapHetBuoi.length} thông báo sắp hết buổi PT.`);

  // 4. Gói PT theo tháng hết hạn hôm nay
  const hetHanGoiPtThang = db.prepare(`
    SELECT dp.id, dp.hoi_vien_id AS ho_so_id,
           h.ho_ten, pt.ho_ten AS ten_pt
    FROM dang_ky_pt dp
    JOIN ho_so h  ON h.id  = dp.hoi_vien_id
    JOIN ho_so pt ON pt.id = dp.pt_id
    WHERE dp.loai_goi = 'theo_thang'
      AND dp.den_ngay  = date('now','localtime')
      AND dp.trang_thai = 'dang_hoat_dong'
  `).all();

  for (const row of hetHanGoiPtThang) {
    createNotification(
      'het_han_goi_pt_thang',
      'Gói PT theo tháng hết hạn',
      `${row.ho_ten} — gói PT theo tháng với ${row.ten_pt} đã hết hạn hôm nay`,
      row.id,
      'dang_ky_pt',
      'ca_hai'
    );
  }
  if (hetHanGoiPtThang.length > 0) console.log(`[CRON-DAILY] Đã tạo ${hetHanGoiPtThang.length} thông báo gói PT theo tháng hết hạn.`);

  // 5. Tổng hợp buổi sáng — sinh 1 thông báo duy nhất
  const ngayHienTai = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  createNotification(
    'tom_tat_buoi_sang',
    `Tổng hợp buổi sáng ${ngayHienTai}`,
    `Sắp hết hạn gói tập: ${sapHetHan.length} hội viên | Hết hạn hôm nay: ${hetHan.length} | Sắp hết buổi PT: ${sapHetBuoi.length}`,
    null,
    null,
    'ca_hai'
  );
  console.log(`[CRON-DAILY] Đã tạo 1 thông báo tổng hợp buổi sáng.`);

  // 6. Xóa thông báo cũ hơn 30 ngày
  const deleted = db.prepare(`
    DELETE FROM thong_bao
    WHERE ngay_tao < datetime('now','localtime','-30 days')
  `).run();
  if (deleted.changes > 0) console.log(`[CRON-DAILY] Đã xóa ${deleted.changes} thông báo cũ hơn 30 ngày.`);

  console.log('[CRON-DAILY] Hoàn thành job thông báo hàng ngày.');
}

// ── Cron mỗi 5 phút: kiểm tra buổi PT sắp tới chưa check-in ──
function checkPtCheckinWarning() {
  const today = new Date().toLocaleDateString('sv-SE');
  const now = new Date();
  // Tìm buổi tập bắt đầu trong 25–35 phút tới (khoảng ±5 phút quanh mốc 30 phút)
  const fromTime = new Date(now.getTime() + 25 * 60 * 1000).toTimeString().slice(0, 5); // HH:MM
  const toTime = new Date(now.getTime() + 35 * 60 * 1000).toTimeString().slice(0, 5);

  const upcoming = db.prepare(`
    SELECT lt.id, lt.dang_ky_pt_id, lt.gio_bat_dau, h.ho_ten, h.id AS ho_so_id
    FROM lich_tap lt
    JOIN ho_so h ON h.id = lt.hoi_vien_id
    WHERE lt.ngay_tap = ?
      AND lt.trang_thai = 'cho_tap'
      AND lt.da_checkin = 0
      AND lt.gio_bat_dau BETWEEN ? AND ?
  `).all(today, fromTime, toTime);

  for (const row of upcoming) {
    // Tránh tạo thông báo trùng: kiểm tra trong 10 phút gần đây
    const exists = db.prepare(`
      SELECT id FROM thong_bao
      WHERE loai = 'chua_check_in_truoc_buoi_pt'
        AND doi_tuong_id = ?
        AND ngay_tao > datetime('now','localtime','-10 minutes')
    `).get(row.id);

    if (!exists) {
      createNotification(
        'chua_check_in_truoc_buoi_pt',
        `Chưa check-in — ${row.ho_ten}`,
        `Buổi PT ${row.gio_bat_dau} — ${row.ho_ten} chưa check-in vào phòng`,
        row.id,
        'lich_tap',
        'ca_hai'
      );
    }
  }
}

export function startDailyCronJobs() {
  // 08:00 sáng mỗi ngày
  cron.schedule('0 8 * * *', runDailyJob, { timezone: 'Asia/Ho_Chi_Minh' });
  console.log('[CRON-DAILY] Job thông báo hàng ngày đã đăng ký — chạy lúc 08:00 mỗi ngày.');

  // Mỗi 5 phút kiểm tra buổi PT sắp tới
  cron.schedule('*/5 * * * *', checkPtCheckinWarning, { timezone: 'Asia/Ho_Chi_Minh' });
  console.log('[CRON-DAILY] Job kiểm tra check-in PT đã đăng ký — chạy mỗi 5 phút.');
}
