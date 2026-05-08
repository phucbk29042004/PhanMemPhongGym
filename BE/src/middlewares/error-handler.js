/**
 * Middleware xử lý lỗi toàn cục (Global Error Handler)
 * Phải đặt CUỐI CÙNG trong app.js sau tất cả routes
 */

export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint không tồn tại: ${req.method} ${req.originalUrl}`,
  });
};

export const globalError = (err, req, res, next) => {
  console.error('💥 Server Error:', err.message);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Đã có lỗi server xảy ra.' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
