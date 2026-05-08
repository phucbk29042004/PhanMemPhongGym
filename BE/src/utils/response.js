/**
 * Hàm trả về response chuẩn cho toàn bộ API
 */

/**
 * Thành công
 * @param {object} res     - Express response object
 * @param {any}    data    - Dữ liệu trả về
 * @param {string} message - Thông báo
 * @param {number} status  - HTTP status code (mặc định 200)
 */
export const success = (res, data = null, message = 'Thành công', status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

/**
 * Lỗi
 * @param {object} res     - Express response object
 * @param {string} message - Thông báo lỗi
 * @param {number} status  - HTTP status code (mặc định 400)
 * @param {any}    errors  - Chi tiết lỗi (tuỳ chọn)
 */
export const error = (res, message = 'Đã có lỗi xảy ra', status = 400, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(status).json(body);
};
