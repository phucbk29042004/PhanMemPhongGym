/**
 * Hàm ghi Audit Log vào bảng audit_log
 * Dùng để theo dõi các hành động nhạy cảm (CREATE, UPDATE, DELETE, LOGIN)
 */

import db from '../config/db.js';

const insertLog = db.prepare(`
  INSERT INTO audit_log
    (tai_khoan_id, ten_dang_nhap, vai_tro, hanh_dong, doi_tuong, doi_tuong_id, gia_tri_cu, gia_tri_moi, ip_address, user_agent, ghi_chu)
  VALUES
    (@tai_khoan_id, @ten_dang_nhap, @vai_tro, @hanh_dong, @doi_tuong, @doi_tuong_id, @gia_tri_cu, @gia_tri_moi, @ip_address, @user_agent, @ghi_chu)
`);

/**
 * @param {object} req        - Express request object (để lấy IP, user agent)
 * @param {string} hanh_dong  - 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'CONFIG'
 * @param {string} doi_tuong  - Tên bảng: 'ho_so', 'goi_tap', 'lich_tap', v.v.
 * @param {number} doi_tuong_id - ID bản ghi bị tác động
 * @param {object} gia_tri_cu  - Dữ liệu trước khi thay đổi (null nếu CREATE)
 * @param {object} gia_tri_moi - Dữ liệu sau khi thay đổi (null nếu DELETE)
 * @param {string} ghi_chu    - Ghi chú thêm (tuỳ chọn)
 */
export const ghi_audit_log = (req, hanh_dong, doi_tuong, doi_tuong_id, gia_tri_cu = null, gia_tri_moi = null, ghi_chu = null) => {
  try {
    const user = req.user || {};
    insertLog.run({
      tai_khoan_id: user.id || null,
      ten_dang_nhap: user.ten_dang_nhap || 'system',
      vai_tro: user.vai_tro || 'system',
      hanh_dong,
      doi_tuong,
      doi_tuong_id: doi_tuong_id || null,
      gia_tri_cu:  gia_tri_cu  ? JSON.stringify(gia_tri_cu)  : null,
      gia_tri_moi: gia_tri_moi ? JSON.stringify(gia_tri_moi) : null,
      ip_address: req.ip || req.connection?.remoteAddress || null,
      user_agent: req.headers?.['user-agent'] || null,
      ghi_chu,
    });
  } catch (err) {
    // Audit log lỗi không được phép crash hệ thống chính
    console.error('Audit log error:', err.message);
  }
};
