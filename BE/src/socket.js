/**
 * socket.js — Singleton Socket.IO instance
 * Dùng để emit events từ bất kỳ controller nào mà không cần truyền `io` qua params.
 */

import { Server } from 'socket.io';

let _io = null;

/**
 * Khởi tạo Socket.IO với http server.
 * Gọi 1 lần duy nhất từ index.js.
 * @param {import('http').Server} httpServer
 * @param {object} corsOptions
 */
export function initSocket(httpServer, corsOptions = {}) {
  _io = new Server(httpServer, {
    cors: corsOptions,
    transports: ['websocket', 'polling'],
  });

  _io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    /**
     * Client gửi { userId, role } để đăng ký vào rooms phù hợp.
     * - role:admin   → nhận thông báo dành cho admin
     * - role:nhan_vien → nhận thông báo dành cho nhân viên
     * - user:<userId> → nhận thông báo cá nhân (dùng trong tương lai)
     */
    socket.on('join', ({ userId, role } = {}) => {
      if (userId) socket.join(`user:${userId}`);
      if (role)   socket.join(`role:${role}`);
      console.log(`📥 Socket ${socket.id} joined: user:${userId} | role:${role}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return _io;
}

/**
 * Lấy instance Socket.IO sau khi đã khởi tạo.
 * @returns {import('socket.io').Server}
 */
export function getIO() {
  if (!_io) throw new Error('Socket.IO chưa được khởi tạo. Gọi initSocket() trước.');
  return _io;
}
