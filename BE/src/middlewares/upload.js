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
  const allowedExtensions = ['.xlsx', '.xls', '.csv', '.zip'];
  const ext = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls, .csv) hoặc file ZIP chứa ảnh (.zip)'), false);
  }
};

const uploadExcelConfig = multer({
  storage: multer.memoryStorage(),
  fileFilter: excelFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB (vì file zip ảnh có thể lớn hơn)
  },
});

export const uploadExcel = (req, res, next) => {
  uploadExcelConfig.fields([
    { name: 'file', maxCount: 1 },
    { name: 'zip', maxCount: 1 }
  ])(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return error(res, 'File tải lên quá lớn. Tối đa 50MB.', 400);
      }
      return error(res, `Lỗi upload file: ${err.message}`, 400);
    }
    if (err) return error(res, err.message, 400);
    next();
  });
};

