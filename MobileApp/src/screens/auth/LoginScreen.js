import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, StatusBar
} from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }
    setLoading(true);
    try {
      // Gọi API thực tế tới Backend kết nối SQLite
      const response = await api.post('/auth/login', {
        ten_dang_nhap: username.trim(),
        mat_khau: password
      });

      if (response.data?.success || response.data?.token || response.data?.data?.token) {
        const { token, user } = response.data.data || response.data;

        // Chuẩn hóa cấu trúc user để lưu vào store (chuyển đổi vai_tro sang role để App phân luồng)
        const normalizedUser = {
          ...user,
          name: user.ho_ten || user.ten_dang_nhap,
          role: user.vai_tro, // 'pt' | 'hoi_vien' | 'admin' | 'le_tan'
        };

        await login(normalizedUser, token);
      } else {
        Alert.alert('Lỗi đăng nhập', response.data?.message || 'Tên đăng nhập hoặc mật khẩu không đúng.');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại đường truyền hoặc địa chỉ IP (cổng 3000).';
      Alert.alert('Xác thực thất bại', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Hàm điền nhanh dữ liệu mẫu có sẵn trong CSDL SQLite để test tiện lợi
  const fillQuickAccount = (accType) => {
    if (accType === 'hv') {
      setUsername('hoivien01');
      setPassword('123456');
    } else if (accType === 'pt') {
      setUsername('pt01');
      setPassword('123456');
    } else {
      setUsername('admin');
      setPassword('123456');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f7f9ff" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Tiêu đề & Logo đồng bộ màu xanh lá FE Web */}
        <View style={styles.header}>
          <View style={styles.logoOuter}>
            <View style={styles.logoBg}>
              <Text style={styles.logoText}>💪</Text>
            </View>
          </View>
          <Text style={styles.appName}>Paradise GYM</Text>
          <Text style={styles.subtitle}>Hệ thống Quản lý Thể hình Cao cấp</Text>
        </View>

        {/* Khung Form Đăng nhập */}
        <View style={styles.card}>

          <Text style={styles.label}>Tên đăng nhập</Text>
          <TextInput
            style={[
              styles.input,
              focusedInput === 'username' && styles.inputFocused
            ]}
            placeholder="Nhập tài khoản của bạn"
            placeholderTextColor="#9CA3AF"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            onFocus={() => setFocusedInput('username')}
            onBlur={() => setFocusedInput(null)}
          />

          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            style={[
              styles.input,
              focusedInput === 'password' && styles.inputFocused
            ]}
            placeholder="Nhập mật khẩu"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocusedInput('password')}
            onBlur={() => setFocusedInput(null)}
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>
              {loading ? 'Đang xác thực...' : 'Đăng Nhập Ngay'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hướng dẫn đăng nhập nhanh cho demo */}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9ff' // Sync với --bg-background FE Web
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24
  },
  header: {
    alignItems: 'center',
    marginBottom: 32
  },
  logoOuter: {
    padding: 8,
    borderRadius: 50,
    backgroundColor: '#e7f5e9', // Nền xanh nhạt chuẩn Paradise Gym
    marginBottom: 16,
  },
  logoBg: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#1D9336', // Màu xanh lá chính FE Web
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1D9336',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  logoText: {
    fontSize: 34
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#181c20', // Màu chữ chuẩn FE Web
    letterSpacing: -0.5,
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#3f4a3c', // Text variant FE Web
    fontWeight: '500'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#ebeef3',
    shadowColor: '#181c20',
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#181c20',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3f4a3c',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#f1f4f9', // --bg-surface-low FE Web
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#181c20',
    marginBottom: 18,
  },
  inputFocused: {
    borderColor: '#1D9336', // Viền xanh lá khi focus
    backgroundColor: '#ffffff',
  },
  btn: {
    backgroundColor: '#1D9336', // Primary brand green
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#1D9336',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.65
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2
  },
  quickAccountsBox: {
    backgroundColor: '#ebeef3',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dcdfe4'
  },
  quickTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#181c20',
    marginBottom: 12,
    textAlign: 'center'
  },
  quickButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10
  },
  quickBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cfd4dc'
  },
  quickBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D9336'
  },
  quickNote: {
    fontSize: 12,
    color: '#5c6758',
    textAlign: 'center'
  }
});
