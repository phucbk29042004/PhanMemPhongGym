/**
 * useSocket.js — Hook để lắng nghe socket events trong React components.
 *
 * Cách dùng:
 *   useSocket('notification:personal', (payload) => {
 *     // Xử lý thông báo realtime
 *   });
 */

import { useEffect } from 'react';
import { getSocket } from '../services/socket';

/**
 * Đăng ký lắng nghe một socket event. Tự cleanup khi component unmount.
 * @param {string} eventName - Tên event (vd: 'notification:personal', 'notification:new')
 * @param {Function} handler - Callback nhận payload từ server
 */
export function useSocket(eventName, handler) {
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !eventName || !handler) return;

    socket.on(eventName, handler);

    return () => {
      socket.off(eventName, handler);
    };
  }, [eventName, handler]);
}
