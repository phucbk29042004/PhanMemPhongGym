/**
 * emitNotification.js — Gửi thông báo vào DB + emit qua Socket.IO
 *
 * Sử dụng ở bất kỳ controller nào cần kích hoạt thông báo realtime cho Admin/Nhân viên.
 */

import db from '../config/db.js';
import { getIO } from '../socket.js';

/**
 * Lưu thông báo vào bảng thong_bao và push socket event tới đúng room.
 *
 * @param {object} payload
 * @param {string} payload.loai       - Loại thông báo (vd: 'dang_ky_goi_moi', 'yeu_cau_pt')
 * @param {string} payload.tieu_de   - Tiêu đề thông báo
 * @param {string} payload.noi_dung  - Nội dung chi tiết
 * @param {string} [payload.danh_cho='ca_hai'] - 'admin' | 'nhan_vien' | 'ca_hai'
 * @param {number|null} [payload.doi_tuong_id] - ID đối tượng liên quan (hội viên, PT...)
 * @param {string|null} [payload.doi_tuong]    - Tên đối tượng
 */
export function emitNotification({
  loai,
  tieu_de,
  noi_dung,
  danh_cho = 'ca_hai',
  doi_tuong_id = null,
  doi_tuong = null,
}) {
  // 1. Lưu vào DB
  try {
    db.prepare(`
      INSERT INTO thong_bao (loai, tieu_de, noi_dung, danh_cho, doi_tuong_id, doi_tuong)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(loai, tieu_de, noi_dung, danh_cho, doi_tuong_id, doi_tuong);
  } catch (err) {
    console.error('[emitNotification] DB insert error:', err.message);
  }

  // 2. Emit socket event cho đúng role
  try {
    const io = getIO();
    const payload = { loai, tieu_de, noi_dung, danh_cho, doi_tuong_id, doi_tuong, ngay_tao: new Date().toISOString() };

    if (danh_cho === 'admin' || danh_cho === 'ca_hai') {
      io.to('role:admin').emit('notification:new', payload);
    }
    if (danh_cho === 'nhan_vien' || danh_cho === 'ca_hai') {
      io.to('role:nhan_vien').emit('notification:new', payload);
    }
  } catch (err) {
    // Socket chưa init hoặc lỗi emit — không throw để không ảnh hưởng luồng chính
    console.warn('[emitNotification] Socket emit warning:', err.message);
  }
}
