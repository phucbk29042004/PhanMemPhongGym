/**
 * Helper tạo thông báo — dùng chung cho cron và realtime
 * Tự động emit Socket.IO event khi tạo thông báo mới.
 */

import db from '../config/db.js';
import { getIO } from '../socket.js';

/**
 * Chuyển đổi yyyy-mm-dd hoặc yyyy/mm/dd → dd/mm/yyyy trong chuỗi văn bản
 * @param {string} str
 * @returns {string}
 */
function formatDateVN(str) {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/(\d{4})[\-\/](\d{2})[\-\/](\d{2})/g, '$3/$2/$1');
}

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
    const noi_dung_vn = formatDateVN(noi_dung);
    insertNotification.run(loai, tieu_de, noi_dung_vn, doi_tuong_id, doi_tuong, final_danh_cho);

    // Emit realtime qua Socket.IO (không throw nếu socket chưa sẵn sàng)
    try {
      const io = getIO();
      const payload = {
        loai,
        tieu_de,
        noi_dung: noi_dung_vn,
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
    const extraValue = extra ? (typeof extra === 'string' ? extra : JSON.stringify(extra)) : null;
    const noi_dung_vn = formatDateVN(noi_dung);
    db.prepare(`
      INSERT INTO thong_bao_user (ho_so_id, loai, tieu_de, noi_dung, extra)
      VALUES (?, ?, ?, ?, ?)
    `).run(hoSoId, loai, tieu_de, noi_dung_vn, extraValue);

    // Emit realtime đến đúng user qua Socket.IO
    try {
      const io = getIO();
      io.to(`user:${hoSoId}`).emit('notification:personal', {
        loai,
        tieu_de,
        noi_dung: noi_dung_vn,
        extra: extra ? (typeof extra === 'string' ? JSON.parse(extra) : extra) : null,
        ngay_tao: new Date().toISOString(),
      });
    } catch (_) {}

    // Bắn thông báo đẩy Push Notification bằng Expo Push API qua HTTP request
    try {
      const userAccount = db.prepare(`
        SELECT t.push_token 
        FROM tai_khoan t
        JOIN ho_so h ON h.tai_khoan_id = t.id
        WHERE h.id = ? AND t.push_token IS NOT NULL AND t.push_token != ''
      `).get(hoSoId);

      if (userAccount && userAccount.push_token) {
        const expoPushToken = userAccount.push_token;
        // Chỉ gửi nếu là token Expo hợp lệ
        if (expoPushToken.startsWith('ExponentPushToken') || expoPushToken.startsWith('ExpoPushToken')) {
          const payload = {
            to: expoPushToken,
            sound: 'default',
            title: tieu_de,
            body: noi_dung_vn,
            data: {
              loai,
              extra: extra ? (typeof extra === 'string' ? JSON.parse(extra) : extra) : null,
            },
          };

          // Dùng fetch qua dynamic import / global fetch để bắn thông báo mà không cần cài thêm library
          fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Accept-encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          })
          .then(res => res.json())
          .then(data => {
            if (process.env.NODE_ENV === 'development') {
              console.log('[PushNotification] Kết quả bắn thông báo đẩy Expo:', data);
            }
          })
          .catch(err => {
            console.error('[PushNotification] Lỗi khi gửi request đến Expo Push API:', err.message);
          });
        }
      }
    } catch (pushErr) {
      console.error('[PushNotification] Lỗi truy vấn/gửi thông báo đẩy:', pushErr.message);
    }
  } catch (err) {
    console.error(`[USER_NOTIFICATION] Lỗi tạo thông báo cho hồ sơ ${hoSoId}:`, err.message);
  }
}
