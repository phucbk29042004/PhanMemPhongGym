/**
 * socket.js — Singleton Socket.IO client cho React Native / Expo
 * Kết nối tới BE server, join room theo userId và vai_tro.
 */

import { io } from 'socket.io-client';

// Phải trùng với IP trong api.js
const SOCKET_URL = 'http://192.168.11.126:3000';

let _socket = null;

/**
 * Khởi tạo kết nối socket và join room.
 * Gọi sau khi đăng nhập thành công.
 * @param {{ id: number, vai_tro: string }} user
 */
export function connectSocket(user) {
  if (_socket?.connected) return _socket;

  _socket = io(SOCKET_URL, {
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  _socket.on('connect', () => {
    console.log('[Socket] Connected:', _socket.id);
    if (user) {
      const roomUserId = user.ho_so_id || user.id;
      _socket.emit('join', { userId: roomUserId, role: user.vai_tro });
      console.log(`[Socket] Joined room user:${roomUserId} | role:${user.vai_tro}`);
    }
  });

  _socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  _socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  return _socket;
}

/**
 * Ngắt kết nối socket (gọi khi đăng xuất).
 */
export function disconnectSocket() {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
    console.log('[Socket] Manually disconnected');
  }
}

/**
 * Lấy socket instance hiện tại (có thể null nếu chưa connect).
 * @returns {import('socket.io-client').Socket | null}
 */
export function getSocket() {
  return _socket;
}
