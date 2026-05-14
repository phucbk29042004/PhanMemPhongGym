import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Image, RefreshControl, ScrollView,
  StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import {
  Clock, QrCode, RefreshCw, ShieldCheck, UserCheck,
} from 'lucide-react-native';
import ProfileAvatar from '../../components/ProfileAvatar';
import { api } from '../../services/api';
import { unwrapData } from '../../utils/data';

// ── Màu sắc ────────────────────────────────────────────────
const G = {
  primary: '#1D9336',
  primaryDark: '#155f27',
  primaryLight: '#e6f4ea',
  white: '#ffffff',
  gray50: '#f8faf8',
  gray100: '#f0f4f0',
  gray200: '#e4ebe4',
  gray300: '#cdd8cd',
  gray400: '#9cad9c',
  gray500: '#6b7c6b',
  gray700: '#2d3c2d',
  gray900: '#141c14',
  danger: '#dc2626',
  dangerLight: '#fef2f2',
  warning: '#f59e0b',
};

export default function MemberQRCodeScreen() {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [countdown, setCountdown] = useState(null);
  const timerRef = useRef(null);

  // QR image URL (dùng Google Chart API — không cần thư viện native)
  const qrImageUrl = qrData?.token
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&bgcolor=ffffff&color=0a2e13&margin=8&data=${encodeURIComponent(qrData.token)}`
    : null;

  // Tính % còn lại để vẽ vòng đếm ngược
  const totalSeconds = qrData?.het_han_sau_phut ? qrData.het_han_sau_phut * 60 : 300;

  const startCountdown = useCallback((seconds) => {
    clearInterval(timerRef.current);
    setCountdown(seconds);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const fetchQr = useCallback(async () => {
    try {
      setErrorText('');
      const res = await api.get('/checkin/my-qr');
      const data = unwrapData(res, null);
      setQrData(data);
      if (data?.het_han_sau_phut) {
        startCountdown(data.het_han_sau_phut * 60);
      }
    } catch (error) {
      setErrorText(error.response?.data?.message || 'Không tải được mã QR. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [startCountdown]);

  useEffect(() => {
    fetchQr();
    return () => clearInterval(timerRef.current);
  }, [fetchQr]);

  // Format countdown MM:SS
  const formatCountdown = (secs) => {
    if (secs == null) return '—';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Màu cảnh báo countdown
  const isUrgent = countdown !== null && countdown <= 30;
  const isExpired = countdown === 0;

  const onRefresh = () => {
    setRefreshing(true);
    clearInterval(timerRef.current);
    fetchQr();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={G.primaryDark} />

      {/* ── Header ────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerIconBox}>
          <QrCode color={G.white} size={20} strokeWidth={2} />
        </View>
        <View>
          <Text style={styles.headerTitle}>QR Check-in</Text>
          <Text style={styles.headerSubtitle}>Quét để vào / ra phòng tập</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[G.primary]}
            tintColor={G.white}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Loading ────────────────────────── */}
        {loading && (
          <View style={styles.loadingCenter}>
            <ActivityIndicator color={G.white} size="large" />
            <Text style={styles.loadingText}>Đang tạo mã QR...</Text>
          </View>
        )}

        {/* ── Error ──────────────────────────── */}
        {!loading && errorText ? (
          <View style={styles.errorBox}>
            <QrCode color={G.danger} size={40} strokeWidth={1.5} />
            <Text style={styles.errorTitle}>Không tải được mã QR</Text>
            <Text style={styles.errorText}>{errorText}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchQr} activeOpacity={0.8}>
              <RefreshCw color={G.white} size={16} strokeWidth={2} />
              <Text style={styles.retryBtnText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ── QR Card ────────────────────────── */}
        {!loading && qrData && !errorText ? (
          <View style={styles.qrCard}>
            {/* Thông tin hội viên */}
            <View style={styles.memberInfo}>
              <ProfileAvatar
                uri={qrData.avatar_url}
                name={qrData.ho_ten}
                size={56}
              />
              <View style={styles.memberText}>
                <Text style={styles.memberName}>{qrData.ho_ten}</Text>
                <View style={styles.memberCodeRow}>
                  <ShieldCheck color={G.primary} size={13} strokeWidth={2} />
                  <Text style={styles.memberCode}>{qrData.ma_ho_so || 'Hội viên'}</Text>
                </View>
              </View>
              <View style={styles.activeBadge}>
                <UserCheck color={G.primary} size={12} strokeWidth={2.5} />
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            </View>

            {/* Đường kẻ phân cách với 2 vòng tròn hai bên */}
            <View style={styles.separator}>
              <View style={styles.separatorCircleLeft} />
              <View style={styles.separatorDash} />
              <View style={styles.separatorCircleRight} />
            </View>

            {/* QR Image */}
            <View style={styles.qrWrapper}>
              {isExpired ? (
                <View style={styles.expiredOverlay}>
                  <Clock color={G.danger} size={32} strokeWidth={1.5} />
                  <Text style={styles.expiredText}>Mã đã hết hạn</Text>
                  <Text style={styles.expiredSub}>Nhấn làm mới để tạo mã mới</Text>
                </View>
              ) : (
                <Image
                  source={{ uri: qrImageUrl }}
                  style={[styles.qrImage, isUrgent && styles.qrImageUrgent]}
                  resizeMode="contain"
                />
              )}
            </View>

            {/* Countdown */}
            <View style={[
              styles.countdownBox,
              isUrgent && !isExpired && styles.countdownBoxUrgent,
              isExpired && styles.countdownBoxExpired,
            ]}>
              <Clock
                color={isExpired ? G.danger : isUrgent ? G.warning : G.primary}
                size={16}
                strokeWidth={2}
              />
              <Text style={[
                styles.countdownText,
                isUrgent && !isExpired && styles.countdownTextUrgent,
                isExpired && styles.countdownTextExpired,
              ]}>
                {isExpired
                  ? 'Mã đã hết hạn'
                  : `Hết hạn sau ${formatCountdown(countdown)}`}
              </Text>
            </View>

            {/* Nút làm mới */}
            <TouchableOpacity
              style={[styles.refreshBtn, isExpired && styles.refreshBtnUrgent]}
              onPress={onRefresh}
              activeOpacity={0.8}
            >
              <RefreshCw color={G.white} size={18} strokeWidth={2} />
              <Text style={styles.refreshBtnText}>Làm mới mã QR</Text>
            </TouchableOpacity>

            {/* Ghi chú nhỏ */}
            <Text style={styles.hint}>
              Giữ màn hình sáng và đưa mã QR về phía máy đọc tại quầy lễ tân.
            </Text>
          </View>
        ) : null}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: G.primaryDark },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  headerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: G.white },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },

  // Scroll
  scrollContent: { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 32 },

  // Loading
  loadingCenter: { paddingTop: 80, alignItems: 'center', gap: 14 },
  loadingText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500' },

  // Error
  errorBox: {
    backgroundColor: G.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  errorTitle: { fontSize: 17, fontWeight: '800', color: G.gray900 },
  errorText: { fontSize: 13, color: G.gray500, textAlign: 'center', lineHeight: 19 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: G.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 6,
  },
  retryBtnText: { color: G.white, fontWeight: '700', fontSize: 14 },

  // QR Card
  qrCard: {
    backgroundColor: G.white,
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },

  // Member info
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  memberText: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: '800', color: G.gray900 },
  memberCodeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  memberCode: { fontSize: 12, color: G.primary, fontWeight: '700' },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: G.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  activeBadgeText: { fontSize: 10, fontWeight: '800', color: G.primary },

  // Separator
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -24,
    marginBottom: 20,
  },
  separatorCircleLeft: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: G.primaryDark,
  },
  separatorDash: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderColor: G.gray200,
    borderTopWidth: 1.5,
    marginHorizontal: 8,
  },
  separatorCircleRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: G.primaryDark,
  },

  // QR Image
  qrWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: G.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: G.gray200,
    padding: 12,
    minHeight: 280,
  },
  qrImage: {
    width: 260,
    height: 260,
    borderRadius: 8,
  },
  qrImageUrgent: {
    opacity: 0.6,
  },
  expiredOverlay: {
    alignItems: 'center',
    gap: 8,
  },
  expiredText: { fontSize: 16, fontWeight: '800', color: G.danger },
  expiredSub: { fontSize: 12, color: G.gray400 },

  // Countdown
  countdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: G.primaryLight,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 14,
  },
  countdownBoxUrgent: { backgroundColor: '#fffbeb' },
  countdownBoxExpired: { backgroundColor: G.dangerLight },
  countdownText: { fontSize: 14, fontWeight: '700', color: G.primary },
  countdownTextUrgent: { color: G.warning },
  countdownTextExpired: { color: G.danger },

  // Refresh button
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: G.primary,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 14,
  },
  refreshBtnUrgent: { backgroundColor: G.danger },
  refreshBtnText: { color: G.white, fontWeight: '800', fontSize: 15 },

  // Hint
  hint: {
    fontSize: 11,
    color: G.gray400,
    textAlign: 'center',
    lineHeight: 17,
  },
});
