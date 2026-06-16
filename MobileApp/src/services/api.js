import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Cấu hình URL kết nối tới Backend (BE) đang chạy trên cổng 3000
// Đã tự động lấy IP Wifi của máy tính: 192.168.11.126 để thiết bị iOS (iPhone/Expo Go) có thể truy cập được BE local.
const API_URL = 'http://192.168.11.126:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // Timeout 10s
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

// Xử lý lỗi tập trung — phân biệt Network Error / Timeout / HTTP Error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (__DEV__) {
      console.error('[API Error]', {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        status: error.response?.status,
        data: error.response?.data,
        code: error.code,
        message: error.message,
      });
    }

    if (!error.response) {
      // Không nhận được response từ server
      if (error.code === 'ECONNABORTED') {
        error.displayMessage = 'Kết nối quá chậm (timeout). Vui lòng thử lại.';
      } else {
        error.displayMessage = 'Không thể kết nối máy chủ. Kiểm tra lại WiFi/mạng.';
      }
    } else if (error.response.status === 401) {
      error.displayMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
    } else {
      // HTTP 4xx / 5xx — ưu tiên message từ server
      error.displayMessage =
        error.response.data?.message || `Lỗi máy chủ (${error.response.status}).`;
    }

    return Promise.reject(error);
  }
);

