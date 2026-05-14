export const unwrapData = (response, fallback = null) => {
  if (!response?.data?.success) return fallback;
  return response.data.data ?? fallback;
};

export const formatDate = (value) => {
  if (!value) return 'Chưa có';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN');
};

export const formatDateTime = (value) => {
  if (!value) return 'Chưa có';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN');
};

export const scheduleStatusLabel = (status) => ({
  cho_tap: 'Chờ tập',
  da_tap: 'Đã hoàn thành',
  da_huy: 'Đã hủy',
}[status] || status || 'Chưa rõ');

export const checkinMethodLabel = (method) => ({
  the_tu: 'Thẻ từ',
  qr_code: 'QR Code',
  khuon_mat: 'Khuôn mặt',
  thu_cong: 'Thủ công',
}[method] || method || 'Chưa rõ');

export const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'PG';
  return parts.slice(-2).map((part) => part[0]).join('').toUpperCase();
};
