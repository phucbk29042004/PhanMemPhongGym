import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  role: null,
  isLoading: true,
  selectedBranch: '',
  setSelectedBranch: (branch) => set({ selectedBranch: branch }),
  login: async (userData, token) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    set({ user: userData, token, role: userData.role, selectedBranch: userData.chi_nhanh || '' });
  },
  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    set({ user: null, token: null, role: null, selectedBranch: '' });
  },
  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ user, token, role: user.role, isLoading: false, selectedBranch: user.chi_nhanh || '' });
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      set({ isLoading: false });
    }
  }
}));
