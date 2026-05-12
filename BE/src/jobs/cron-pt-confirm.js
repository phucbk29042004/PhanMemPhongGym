/**
 * Cron Job: Tự động xác nhận buổi tập PT đã có check-in
 * Chạy lúc 22:00 mỗi ngày (hoặc theo cấu hình gio_dong_cua trong bảng cau_hinh)
 *
 * Logic:
 * - Tìm tất cả lich_tap có ngay_tap = hôm nay, trang_thai = 'cho_tap', da_checkin = 1
 * - Đặt trang_thai = 'da_tap', confirmed_by_id = NULL, ghi_chu = 'auto_cron'
 * - Trigger trg_xac_nhan_buoi_tap sẽ tự tăng so_buoi_da_tap
 */

import cron from 'node-cron';
import db from '../config/db.js';
import { createNotification } from '../utils/notifications.js';

let scheduledTask = null;

function runConfirmJob() {
  const today = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' }).split(' ')[0];
  console.log(`[CRON] ${new Date().toLocaleTimeString('vi-VN')} — Đang xử lý xác nhận buổi tập ngày ${today}...`);

  const pending = db.prepare(`
    SELECT id, dang_ky_pt_id FROM lich_tap
    WHERE ngay_tap = ? AND trang_thai = 'cho_tap' AND da_checkin = 1
  `).all(today);

  if (pending.length === 0) {
    console.log('[CRON] Không có buổi nào cần xác nhận.');
    return;
  }

  const confirmOne = db.prepare(`
    UPDATE lich_tap
    SET trang_thai = 'da_tap', confirmed_by_id = NULL,
        ghi_chu = 'auto_cron', ngay_xac_nhan = datetime('now','localtime')
    WHERE id = ?
  `);

  const confirmAll = db.transaction((rows) => {
    for (const row of rows) {
      confirmOne.run(row.id);
    }
  });

  try {
    confirmAll(pending);
    console.log(`[CRON] Đã xác nhận ${pending.length} buổi tập thành công.`);

    createNotification(
      'cron_tu_xac_nhan',
      'Hệ thống tự xác nhận buổi tập',
      `Hệ thống vừa tự xác nhận ${pending.length} buổi tập PT hôm nay (${today})`,
      null,
      null,
      'ca_hai'
    );
  } catch (err) {
    console.error('[CRON] Lỗi khi xác nhận buổi tập:', err.message);
  }
}

function parseCronTime(gio_dong_cua) {
  // Format: "HH:MM"
  const parts = gio_dong_cua.split(':');
  if (parts.length !== 2) return null;
  const [h, m] = parts.map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return `${m} ${h} * * *`; // cron format: phút giờ * * *
}

export function startCronJob() {
  // Đọc giờ chạy từ cấu hình
  const cfg = db.prepare(`SELECT gia_tri FROM cau_hinh WHERE khoa = 'gio_dong_cua'`).get();
  const gioDongCua = cfg?.gia_tri || '22:00';
  const cronExpr = parseCronTime(gioDongCua) || '0 22 * * *';

  if (scheduledTask) {
    scheduledTask.stop();
  }

  scheduledTask = cron.schedule(cronExpr, runConfirmJob, {
    timezone: 'Asia/Ho_Chi_Minh',
  });

  console.log(`[CRON] Job xác nhận buổi tập PT đã đăng ký — chạy lúc ${gioDongCua} mỗi ngày.`);
}
