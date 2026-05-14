import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Cấu hình URL kết nối tới Backend (BE) đang chạy trên cổng 3000
// Đã tự động lấy IP Wifi của máy tính: 192.168.11.104 để thiết bị iOS (iPhone/Expo Go) có thể truy cập được BE local.
const API_URL = 'http://192.168.11.104:3000/api';

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
