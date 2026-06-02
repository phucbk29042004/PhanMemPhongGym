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

const excelFilter = (req, file, cb) => {
  const allowedExtensions = ['.xlsx', '.xls', '.csv'];
  const ext = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file Excel định dạng .xlsx, .xls hoặc .csv'), false);
  }
};

const uploadExcelConfig = multer({
  storage: multer.memoryStorage(),
  fileFilter: excelFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export const uploadExcel = (req, res, next) => {
  uploadExcelConfig.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return error(res, 'File quá lớn. Tối đa 10MB.', 400);
      }
      return error(res, `Lỗi upload file Excel: ${err.message}`, 400);
    }
    if (err) return error(res, err.message, 400);
    next();
  });
};

