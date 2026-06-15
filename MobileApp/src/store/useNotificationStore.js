import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    try {
      // Chỉ set loading nếu chưa có dữ liệu để tránh flicker khi poll ngầm
      if (get().notifications.length === 0) set({ loading: true });
      
      const res = await api.get('/members/me/notifications');
      if (res.data?.success) {
        const notifs = res.data.data?.notifications || [];
        
        // Load danh sách thông báo hệ thống đã bị ẩn từ AsyncStorage
        const dismissedStr = await AsyncStorage.getItem('dismissed_notifications');
        const dismissed = dismissedStr ? JSON.parse(dismissedStr) : [];

        // Lọc bỏ những thông báo hệ thống đã bị ẩn
        const activeNotifs = notifs.filter(n => {
          if (n.is_custom) return true;
          const key = `${n.tieu_de}_${n.ngay_tao}`;
          return !dismissed.includes(key);
        });

        // Chỉ badge số lượng cho các thông báo cá nhân chưa đọc (is_custom)
        const unreadCustom = activeNotifs.filter(n => n.is_custom && n.da_doc === 0).length;

        set({ 
          notifications: activeNotifs, 
          unreadCount: unreadCustom,
          loading: false 
        });
      }
    } catch (err) {
      console.error('[NotificationStore] fetch error:', err?.message);
      set({ loading: false });
    }
  },

  /**
   * Thêm 1 thông báo realtime vào đầu danh sách (nhận từ Socket.IO).
   * @param {{ loai: string, tieu_de: string, noi_dung: string, ngay_tao: string }} payload
   */
  addNotification: (payload) => {
    const newNotif = {
      id: `socket_${Date.now()}`,
      is_custom: true,
      da_doc: 0,
      loai: payload.loai || 'thong_bao_chung',
      tieu_de: payload.tieu_de,
      noi_dung: payload.noi_dung,
      ngay_tao: payload.ngay_tao || new Date().toISOString(),
    };
    set((state) => ({
      notifications: [newNotif, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: async () => {
    try {
      await api.post('/members/me/notifications/read');
      // Sau khi đánh dấu trên server, cập nhật lại local state
      set((state) => ({
        unreadCount: 0,
        notifications: state.notifications.map(n => n.is_custom ? { ...n, da_doc: 1 } : n)
      }));
    } catch (e) {
      console.error('[NotificationStore] markAsRead error:', e?.message);
    }
  },
  
  deleteNotification: async (item) => {
    try {
      if (item.is_custom) {
        // Xóa thông báo cá nhân ở server (bỏ qua nếu là thông báo socket tạm thời)
        if (!String(item.id).startsWith('socket_')) {
          await api.delete(`/members/me/notifications/${item.id}`);
        }
        set((state) => {
          const filtered = state.notifications.filter(n => n.id !== item.id);
          return {
            notifications: filtered,
            unreadCount: filtered.filter(n => n.is_custom && n.da_doc === 0).length
          };
        });
      } else {
        // Ẩn thông báo hệ thống tự động qua AsyncStorage
        const key = `${item.tieu_de}_${item.ngay_tao}`;
        const dismissedStr = await AsyncStorage.getItem('dismissed_notifications');
        const dismissed = dismissedStr ? JSON.parse(dismissedStr) : [];
        if (!dismissed.includes(key)) {
          dismissed.push(key);
          await AsyncStorage.setItem('dismissed_notifications', JSON.stringify(dismissed));
        }
        set((state) => ({
          notifications: state.notifications.filter(n => `${n.tieu_de}_${n.ngay_tao}` !== key)
        }));
      }
    } catch (e) {
      console.error('[NotificationStore] deleteNotification error:', e?.message);
      throw e;
    }
  },

  clearNotifications: async () => {
    try {
      // 1. Xoá sạch thông báo cá nhân ở server
      await api.delete('/members/me/notifications');
      
      // 2. Ẩn toàn bộ thông báo hệ thống đang có
      const currentSystemNotifs = get().notifications.filter(n => !n.is_custom);
      const dismissedStr = await AsyncStorage.getItem('dismissed_notifications');
      const dismissed = dismissedStr ? JSON.parse(dismissedStr) : [];
      
      currentSystemNotifs.forEach(n => {
        const key = `${n.tieu_de}_${n.ngay_tao}`;
        if (!dismissed.includes(key)) dismissed.push(key);
      });
      await AsyncStorage.setItem('dismissed_notifications', JSON.stringify(dismissed));

      // 3. Xóa local state
      set({
        notifications: [],
        unreadCount: 0
      });
    } catch (e) {
      console.error('[NotificationStore] clearNotifications error:', e?.message);
      throw e;
    }
  }
}));
