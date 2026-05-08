/**
 * Middleware xử lý upload ảnh bằng multer (memory storage)
 * File sẽ được giữ trong RAM (buffer), sau đó đẩy lên Cloudinary
 */

import multer from 'multer';
import { error } from '../utils/response.js';

// Sử dụng memory storage — không lưu file xuống ổ đĩa
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh định dạng: JPEG, JPG, PNG, WebP'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Tối đa 5MB
  },
});

/**
 * Middleware upload 1 ảnh, field name = 'avatar'
 * Bắt lỗi multer và trả về response JSON thay vì crash server
 */
export const uploadAvatar = (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return error(res, 'File ảnh quá lớn. Tối đa 5MB.', 400);
      }
      return error(res, `Lỗi upload: ${err.message}`, 400);
    }
    if (err) return error(res, err.message, 400);
    next();
  });
};
