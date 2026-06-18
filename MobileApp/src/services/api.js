import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Cấu hình URL kết nối tới Backend (BE) đang chạy trên cổng 3000
// Tự động sử dụng IP local ở chế độ DEV (Expo Go) và link HTTPS ngrok cố định khi đóng gói APK (Release).
const API_URL = __DEV__
  ? 'http://192.168.11.126:3000/api'
  : 'https://job-observing-corporal.ngrok-free.dev/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // Timeout 10s
  headers: {
    'ngrok-skip-browser-warning': 'true', // Bỏ qua trang cảnh báo của ngrok
    'Bypass-Tunnel-Reminder': 'true'      // Bỏ qua trang cảnh báo của localtunnel (nếu dùng lại sau này)
  }
});

// Tự động đính kèm token vào header cho mọi request cần xác thực
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (__DEV__) {
      console.warn('[API Error Debug]', {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        status: error.response?.status,
        data: error.response?.data,
        code: error.code,
        message: error.message,
      });
    }

    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.displayMessage = 'Kết nối quá chậm (timeout). Vui lòng thử lại.';
      } else {
        error.displayMessage = 'Không thể kết nối máy chủ. Kiểm tra lại WiFi/mạng.';
      }
    } else {
      const data = error.response.data;
      const status = error.response.status;
      
      if (data && typeof data === 'object') {
        error.displayMessage = data.message || data.error || `Lỗi máy chủ (${status})`;
      } else if (typeof data === 'string') {
        if (data.trim().startsWith('<') || data.includes('<html>') || data.includes('<!DOCTYPE')) {
          error.displayMessage = `Đã xảy ra sự cố máy chủ (${status}). Vui lòng thử lại sau.`;
        } else {
          error.displayMessage = data;
        }
      } else if (status === 401) {
        error.displayMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      } else if (status === 403) {
        error.displayMessage = 'Bạn không có quyền thực hiện hành động này.';
      } else {
        error.displayMessage = `Lỗi máy chủ (${status}). Vui lòng thử lại sau.`;
      }
    }

    // Đảm bảo displayMessage là chuỗi đơn giản
    if (typeof error.displayMessage !== 'string') {
      error.displayMessage = 'Đã xảy ra lỗi không xác định.';
    }

    return Promise.reject(error);
  }
);

