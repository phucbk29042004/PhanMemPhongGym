/**
 * Middleware kiểm tra vai trò (RBAC)
 * Dùng sau verifyToken
 */

import { error } from '../utils/response.js';

/**
 * Chỉ cho phép các vai trò nhất định truy cập
 * @param {...string} roles - Danh sách vai trò được phép: 'admin', 'le_tan', 'pt', 'hoi_vien'
 * @example router.get('/doanh-thu', verifyToken, requireRole('admin'), controller)
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return error(res, 'Chưa xác thực.', 401);
    if (!roles.includes(req.user.vai_tro)) {
      return error(res, `Bạn không có quyền thực hiện hành động này. Yêu cầu: [${roles.join(', ')}]`, 403);
    }
    next();
  };
};

/**
 * Kiểm tra quyền chi tiết từ quyen_json
 * @param {string} resource - Tên tài nguyên: 'ho_so', 'goi_tap', 'lich_tap', v.v.
 * @param {string} action   - Hành động: 'read', 'create', 'update', 'delete'
 */
export const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) return error(res, 'Chưa xác thực.', 401);
    const permissions = req.user.quyen?.[resource] || [];
    if (!permissions.includes(action) && !permissions.includes(`${action}_own`)) {
      return error(res, `Không đủ quyền: ${resource}:${action}`, 403);
    }
    next();
  };
};
