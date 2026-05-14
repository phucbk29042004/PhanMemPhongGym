import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// For Android emulator pointing to localhost backend
const API_URL = 'http://10.0.2.2:5000/api'; 

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
