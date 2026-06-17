import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'gym_dark_mode';

const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
  colors: {},
});

export const lightColors = {
  isDark: false,
  background: '#f8faf8',
  surface: '#ffffff',
  surfaceVariant: '#f0f4f0',
  border: '#e4ebe4',
  borderLight: '#f0f4f0',
  text: '#141c14',
  textSecondary: '#6b7c6b',
  textMuted: '#9cad9c',
  primary: '#1D9336',
  primaryDark: '#155f27',
  primaryLight: '#e6f4ea',
  primaryMid: '#4db870',
  danger: '#dc2626',
  dangerLight: '#fef2f2',
  warning: '#d97706',
  warningLight: '#fffbeb',
  statusBar: 'dark-content',
  statusBarBg: '#ffffff',
};

export const darkColors = {
  isDark: true,
  background: '#0f1410',
  surface: '#1a2318',
  surfaceVariant: '#212d22',
  border: '#2a3a2b',
  borderLight: '#1e2b1f',
  text: '#e8f0e8',
  textSecondary: '#8aab8a',
  textMuted: '#556655',
  primary: '#4db870',
  primaryDark: '#1D9336',
  primaryLight: '#1a3020',
  primaryMid: '#1D9336',
  danger: '#f87171',
  dangerLight: '#2d1515',
  warning: '#fbbf24',
  warningLight: '#2c1e10',
  statusBar: 'light-content',
  statusBarBg: '#1a2318',
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val === 'true') setIsDark(true);
    }).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    // Trì hoãn đổi state theme 100ms để hiệu ứng nút bấm (opacity, scale) phản hồi ngay trước khi re-render
    setTimeout(() => {
      setIsDark(prev => {
        const next = !prev;
        // Chạy AsyncStorage ở ngoài quá trình render, không chặn luồng chính
        setTimeout(() => {
          AsyncStorage.setItem(STORAGE_KEY, String(next)).catch(() => {});
        }, 0);
        return next;
      });
    }, 100);
  }, []);

  const colors = isDark ? darkColors : lightColors;

  const value = useMemo(() => ({ isDark, toggleTheme, colors }), [isDark, toggleTheme, colors]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
