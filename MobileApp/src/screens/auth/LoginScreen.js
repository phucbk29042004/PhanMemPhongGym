import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, StyleSheet, KeyboardAvoidingView, Platform,
  StatusBar, Animated, Dimensions,
} from 'react-native';
import Svg, { Polygon, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Eye, EyeOff } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const login = useAuthStore((state) => state.login);

  const logoScale = useRef(new Animated.Value(1)).current;

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }
    setLoading(true);

    Animated.sequence([
      Animated.timing(logoScale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true }),
    ]).start();

    try {
      const response = await api.post('/auth/login', {
        ten_dang_nhap: username.trim(),
        mat_khau: password
      });

      if (response.data?.success || response.data?.token || response.data?.data?.token) {
        const { token, user } = response.data.data || response.data;
        const normalizedUser = {
          ...user,
          name: user.ho_ten || user.ten_dang_nhap,
          role: user.vai_tro,
        };
        await login(normalizedUser, token);
      } else {
        Alert.alert('Đăng nhập thất bại', response.data?.message || 'Tên đăng nhập hoặc mật khẩu không đúng.');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Không thể kết nối máy chủ. Kiểm tra lại kết nối mạng.';
      Alert.alert('Xác thực thất bại', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Decorative glow orbs */}
      <View style={styles.glowTopRight} />
      <View style={styles.glowBottomLeft} />
      <View style={styles.glowCenter} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>

          {/* ── Logo ── */}
          <View style={styles.logoSection}>
            <Animated.View style={[styles.logoLockup, { transform: [{ scale: logoScale }] }]}>
              {/* Hexagon icon */}
              <View style={styles.hexWrap}>
                <Svg width={54} height={60} viewBox="0 0 54 60">
                  <Defs>
                    <LinearGradient id="hexGrad" x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0" stopColor="#22c55e" />
                      <Stop offset="1" stopColor="#15803d" />
                    </LinearGradient>
                  </Defs>
                  <Polygon
                    points="27,2 52,15 52,45 27,58 2,45 2,15"
                    fill="url(#hexGrad)"
                  />
                  <SvgText
                    x="27" y="40"
                    textAnchor="middle"
                    fontSize="26"
                    fontWeight="900"
                    fill="#ffffff"
                    fontFamily="System"
                  >P</SvgText>
                </Svg>
              </View>

              {/* Brand text */}
              <View style={styles.brandTextWrap}>
                <View style={styles.brandNameRow}>
                  <Text style={styles.brandLight}>aradi </Text>
                  <Text style={styles.brandBold}>seGym</Text>
                </View>
                <Text style={styles.brandSub}>QUẢN LÝ PHÒNG TẬP</Text>
              </View>
            </Animated.View>

            <View style={[styles.dividerRow, { marginTop: 28 }]}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ĐĂNG NHẬP</Text>
              <View style={styles.dividerLine} />
            </View>
          </View>

          {/* ── Form Card ── */}
          <View style={styles.card}>

            {/* Username */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>TÊN ĐĂNG NHẬP</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tài khoản của bạn"
                  placeholderTextColor="rgba(0,0,0,0.28)"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>MẬT KHẨU</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor="rgba(0,0,0,0.28)"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={handleLogin}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(v => !v)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showPassword
                    ? <EyeOff size={20} color="rgba(0,0,0,0.35)" />
                    : <Eye size={20} color="rgba(0,0,0,0.35)" />
                  }
                </TouchableOpacity>
              </View>
            </View>

            {/* Login button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
              style={[styles.btn, loading && styles.btnLoading]}
            >
              <Text style={styles.btnText}>
                {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>Paradise GYM Management System © 2025</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  // Decorative orbs — nhẹ hơn trên nền trắng
  glowTopRight: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#16a34a',
    opacity: 0.07,
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#15803d',
    opacity: 0.06,
  },
  glowCenter: {
    position: 'absolute',
    top: '35%',
    left: '25%',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#bbf7d0',
    opacity: 0.35,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 36,
  },

  // ── Logo section ──
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  hexWrap: {
    // drop shadow for the hex icon
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  brandTextWrap: {
    justifyContent: 'center',
    gap: 2,
  },
  brandNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandLight: {
    fontSize: 28,
    fontWeight: '400',
    color: '#16a34a',
    letterSpacing: 0.2,
  },
  brandBold: {
    fontSize: 28,
    fontWeight: '800',
    color: '#16a34a',
    letterSpacing: 0.2,
  },
  brandSub: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(22,163,74,0.65)',
    letterSpacing: 2.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '85%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.10)',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.30)',
    letterSpacing: 2.5,
  },

  // ── Card ──
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    padding: 24,
    gap: 18,
    marginBottom: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },

  // ── Field ──
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.40)',
    letterSpacing: 1.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    height: 54,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },

  // ── Button ──
  btn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    elevation: 8,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.40,
    shadowRadius: 14,
  },
  btnLoading: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // ── Footer ──
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(0,0,0,0.20)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});