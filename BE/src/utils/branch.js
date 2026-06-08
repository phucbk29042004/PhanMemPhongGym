import db from '../config/db.js';

/**
 * Lấy chi nhánh của tài khoản đang đăng nhập
 * Trả về chi nhánh (chuỗi) hoặc null nếu là admin/chu_phong_gym hoặc không có chi nhánh
 */
export const getActorBranch = (user) => {
  if (!user || user.vai_tro === 'admin' || user.vai_tro === 'chu_phong_gym') {
    return null;
  }
  const actor = db.prepare('SELECT chi_nhanh FROM ho_so WHERE tai_khoan_id = ? AND is_deleted = 0').get(user.id);
  return actor?.chi_nhanh || 'KHONG_CO_CHI_NHANH';
};
