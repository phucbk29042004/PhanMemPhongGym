import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, StyleSheet, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập tài khoản và mật khẩu');
      return;
    }
    setLoading(true);
    try {
      // Giả lập login: username bắt đầu bằng 'pt' => vào app PT, còn lại => Hội Viên
      if (username.toLowerCase().startsWith('pt')) {
        await login({ id: 1, name: 'PT Demo', role: 'pt' }, 'fake-token-pt');
      } else {
        await login({ id: 2, name: 'Hội Viên Demo', role: 'hoivien' }, 'fake-token-hv');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoBg}>
            <Text style={styles.logoText}>💪</Text>
          </View>
          <Text style={styles.appName}>Paradise GYM</Text>
          <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Tên đăng nhập</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập tài khoản"
            placeholderTextColor="#9CA3AF"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>{loading ? 'Đang xử lý...' : 'Đăng Nhập'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          💡 Tip: Username bắt đầu bằng <Text style={styles.hintBold}>"pt"</Text> để vào app PT
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoBg: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2563EB', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  logoText: { fontSize: 36 },
  appName: { fontSize: 28, fontWeight: '700', color: '#1E3A8A', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#6B7280' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
    marginBottom: 16,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, color: '#111827', marginBottom: 16,
  },
  btn: {
    backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 8,
    shadowColor: '#2563EB', shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.65 },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  hint: { textAlign: 'center', color: '#9CA3AF', fontSize: 13 },
  hintBold: { fontWeight: '700', color: '#2563EB' },
});
