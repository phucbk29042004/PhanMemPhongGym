import { create } from 'zustand';
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
        
        // Chỉ badge số lượng cho các thông báo cá nhân chưa đọc (is_custom)
        // Các thông báo hệ thống (system) vẫn hiện trong list nhưng không giữ badge tab
        const unreadCustom = notifs.filter(n => n.is_custom && n.da_doc === 0).length;

        set({ 
          notifications: notifs, 
          unreadCount: unreadCustom,
          loading: false 
        });
      }
    } catch (err) {
      console.error('[NotificationStore] fetch error:', err?.message);
      set({ loading: false });
    }
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
  
  clearNotifications: async () => {
    try {
      await api.delete('/members/me/notifications');
      // Sau khi xoá trên server, xoá sạch custom notifs ở local
      set((state) => ({
        notifications: state.notifications.filter(n => !n.is_custom),
        unreadCount: 0
      }));
    } catch (e) {
      console.error('[NotificationStore] clearNotifications error:', e?.message);
      throw e;
    }
  }
}));
