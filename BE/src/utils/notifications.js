/**
 * Helper tạo thông báo — dùng chung cho cron và realtime
 */

import db from '../config/db.js';

const insertNotification = db.prepare(`
  INSERT INTO thong_bao (loai, tieu_de, noi_dung, doi_tuong_id, doi_tuong, danh_cho)
  VALUES (?, ?, ?, ?, ?, ?)
`);

/**
 * Tạo 1 thông báo mới
 * @param {string} loai       - Loại thông báo (sap_het_han_goi_tap, check_in, ...)
 * @param {string} tieu_de    - Tiêu đề ngắn gọn
 * @param {string} noi_dung   - Nội dung chi tiết
 * @param {number|null} doi_tuong_id - ID đối tượng liên quan (ho_so_id, lich_tap_id, ...)
 * @param {string|null} doi_tuong   - Loại đối tượng ('ho_so', 'lich_tap', 'dang_ky_pt')
 * @param {string} danh_cho   - 'admin' | 'le_tan' | 'ca_hai'
 */
export function createNotification(loai, tieu_de, noi_dung, doi_tuong_id = null, doi_tuong = null, danh_cho = 'ca_hai') {
  try {
    insertNotification.run(loai, tieu_de, noi_dung, doi_tuong_id, doi_tuong, danh_cho);
  } catch (err) {
    console.error(`[NOTIFICATION] Lỗi tạo thông báo loại "${loai}":`, err.message);
  }
}
