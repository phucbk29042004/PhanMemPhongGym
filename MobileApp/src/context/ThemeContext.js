import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'gym_dark_mode';

const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
  colors: {},
});

export const lightColors = {
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
  statusBar: 'dark-content',
  statusBarBg: '#ffffff',
};

export const darkColors = {
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
    setIsDark(prev => {
      const next = !prev;
      AsyncStorage.setItem(STORAGE_KEY, String(next)).catch(() => {});
      return next;
    });
  }, []);

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
