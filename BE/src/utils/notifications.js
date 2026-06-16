/**
 * Helper tạo thông báo — dùng chung cho cron và realtime
 * Tự động emit Socket.IO event khi tạo thông báo mới.
 */

import db from '../config/db.js';
import { getIO } from '../socket.js';

const insertNotification = db.prepare(`
  INSERT INTO thong_bao (loai, tieu_de, noi_dung, doi_tuong_id, doi_tuong, danh_cho)
  VALUES (?, ?, ?, ?, ?, ?)
`);

/**
 * Tạo 1 thông báo mới + emit socket realtime
 * @param {string} loai       - Loại thông báo (sap_het_han_goi_tap, check_in, ...)
 * @param {string} tieu_de    - Tiêu đề ngắn gọn
 * @param {string} noi_dung   - Nội dung chi tiết
 * @param {number|null} doi_tuong_id - ID đối tượng liên quan (ho_so_id, lich_tap_id, ...)
 * @param {string|null} doi_tuong   - Loại đối tượng ('ho_so', 'lich_tap', 'dang_ky_pt')
 * @param {string} danh_cho   - 'admin' | 'nhan_vien' | 'ca_hai'
 */
export function createNotification(loai, tieu_de, noi_dung, doi_tuong_id = null, doi_tuong = null, danh_cho = 'ca_hai') {
  try {
    let final_danh_cho = danh_cho;
    if (final_danh_cho === 'le_tan') final_danh_cho = 'nhan_vien';
    insertNotification.run(loai, tieu_de, noi_dung, doi_tuong_id, doi_tuong, final_danh_cho);

    // Emit realtime qua Socket.IO (không throw nếu socket chưa sẵn sàng)
    try {
      const io = getIO();
      const payload = {
        loai,
        tieu_de,
        noi_dung,
        danh_cho: final_danh_cho,
        doi_tuong_id,
        doi_tuong,
        ngay_tao: new Date().toISOString(),
      };
      if (final_danh_cho === 'admin' || final_danh_cho === 'ca_hai') {
        io.to('role:admin').emit('notification:new', payload);
      }
      if (final_danh_cho === 'nhan_vien' || final_danh_cho === 'ca_hai') {
        io.to('role:nhan_vien').emit('notification:new', payload);
      }
    } catch (_) {
      // Socket chưa init (vd: lúc cron chạy sớm) — bỏ qua, không crash
    }
  } catch (err) {
    console.error(`[NOTIFICATION] Lỗi tạo thông báo loại "${loai}":`, err.message);
  }
}

/**
 * Tạo thông báo riêng cho 1 người dùng (Hội viên/PT) — Hiển thị trên Mobile App
 * @param {number} hoSoId    - ID hồ sơ nhận thông báo
 * @param {string} tieu_de   - Tiêu đề
 * @param {string} noi_dung  - Nội dung
 * @param {string} loai      - Loại ('thong_bao_chung', 'nhac_nho_gia_han', ...)
 */
export function createUserNotification(hoSoId, tieu_de, noi_dung, loai = 'thong_bao_chung', extra = null) {
  try {
    db.prepare(`
      INSERT INTO thong_bao_user (ho_so_id, loai, tieu_de, noi_dung)
      VALUES (?, ?, ?, ?)
    `).run(hoSoId, loai, tieu_de, noi_dung);

    // Emit realtime đến đúng user (mobile/web user cụ thể)
    try {
      const io = getIO();
      io.to(`user:${hoSoId}`).emit('notification:personal', {
        loai,
        tieu_de,
        noi_dung,
        extra,
        ngay_tao: new Date().toISOString(),
      });
    } catch (_) {
      // Bỏ qua nếu socket chưa sẵn sàng
    }
  } catch (err) {
    console.error(`[USER_NOTIFICATION] Lỗi tạo thông báo cho hồ sơ ${hoSoId}:`, err.message);
  }
}
