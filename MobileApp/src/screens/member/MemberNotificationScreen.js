import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator, Alert, RefreshControl, ScrollView,
  StatusBar, StyleSheet, Text, TouchableOpacity, View,
  Animated,
} from 'react-native';
import {
  AlertCircle, AlertTriangle, Bell, BellOff,
  CheckCircle, Info, RefreshCw, Trash2,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useTheme } from '../../context/ThemeContext';

// ── Màu sắc ────────────────────────────────────────────────
const G = {
  primary: '#1D9336',
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
  dangerBorder: '#fca5a5',
  warning: '#d97706',
  warningLight: '#fffbeb',
  warningBorder: '#fcd34d',
  info: '#2563eb',
  infoLight: '#eff6ff',
  infoBorder: '#93c5fd',
  success: '#16a34a',
  successLight: '#f0fdf4',
  successBorder: '#86efac',
};

// ── Config theo mức độ ─────────────────────────────────────
const LEVEL_CONFIG = {
  danger: {
    bg: G.dangerLight,
    border: G.danger,
    iconBg: '#fee2e2',
    textColor: '#7f1d1d',
    Icon: AlertCircle,
    iconColor: G.danger,
    badge: 'QUAN TRỌNG',
    badgeBg: G.danger,
  },
  warning: {
    bg: G.warningLight,
    border: G.warning,
    iconBg: '#fef3c7',
    textColor: '#78350f',
    Icon: AlertTriangle,
    iconColor: G.warning,
    badge: 'CHÚ Ý',
    badgeBg: G.warning,
  },
  info: {
    bg: G.infoLight,
    border: G.info,
    iconBg: '#dbeafe',
    textColor: '#1e3a5f',
    Icon: Info,
    iconColor: G.info,
    badge: null,
    badgeBg: G.info,
  },
  success: {
    bg: G.successLight,
    border: G.success,
    iconBg: '#dcfce7',
    textColor: '#14532d',
    Icon: CheckCircle,
    iconColor: G.success,
    badge: null,
    badgeBg: G.success,
  },
};

// ── Hàm helper định dạng thời gian tương đối ───────────────
function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split(/[- :]/);
  if (parts.length < 6) return dateStr;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const hour = parseInt(parts[3], 10);
  const minute = parseInt(parts[4], 10);
  const second = parseInt(parts[5], 10);
  
  const date = new Date(year, month, day, hour, minute, second);
  const now = new Date();
  const diffMs = now - date;
  
  if (diffMs < 0) return 'vừa xong';
  
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);
  
  if (diffSec < 60) return 'vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHr < 24) return `${diffHr} giờ trước`;
  if (diffDays === 1) return 'hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  
  return `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

// ── Component: Chấm xanh nhấp nháy cho thông báo chưa đọc ──
function PulsingDot() {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 2,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [scaleAnim, opacityAnim]);

  return (
    <View style={pulseStyles.container}>
      <Animated.View
        style={[
          pulseStyles.pulse,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      />
      <View style={pulseStyles.dot} />
    </View>
  );
}

const pulseStyles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 12,
    height: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
    position: 'absolute',
  },
  pulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
    position: 'absolute',
  },
});

// ── Component: Card thông báo ──────────────────────────────
function NotificationCard({ item }) {
  const { colors } = useTheme();
  const cfg = LEVEL_CONFIG[item.muc_do] || LEVEL_CONFIG.info;
  const { Icon } = cfg;

  return (
    <View style={[
      notifStyles.card, 
      { 
        backgroundColor: colors.isDark ? colors.surfaceVariant : cfg.bg, 
        borderLeftColor: cfg.border,
        borderColor: colors.border,
        borderWidth: colors.isDark ? 1 : 0,
        borderLeftWidth: 3
      }
    ]}>
      {/* Icon + Badge */}
      <View style={[notifStyles.iconBox, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.08)' : cfg.iconBg }]}>
        <Icon color={cfg.iconColor} size={20} strokeWidth={2.5} />
      </View>

      {/* Nội dung */}
      <View style={notifStyles.content}>
        <View style={notifStyles.titleRow}>
          <View style={notifStyles.titleContainer}>
            {item.is_custom && item.da_doc === 0 && <PulsingDot />}
            <Text style={[notifStyles.title, { color: colors.isDark ? colors.text : cfg.textColor }]} numberOfLines={2}>
              {item.tieu_de}
            </Text>
          </View>
          {cfg.badge && (
            <View style={[notifStyles.badge, { backgroundColor: cfg.badgeBg }]}>
              <Text style={notifStyles.badgeText}>{cfg.badge}</Text>
            </View>
          )}
        </View>
        <Text style={[notifStyles.body, { color: colors.isDark ? colors.textMuted : cfg.textColor, marginBottom: item.ngay_tao ? 6 : 0 }]} numberOfLines={4}>
          {item.noi_dung}
        </Text>
        {item.ngay_tao && (
          <Text style={[notifStyles.timeText, { color: colors.isDark ? colors.textMuted : cfg.textColor, opacity: 0.6 }]}>
            {formatTimeAgo(item.ngay_tao)}
          </Text>
        )}
      </View>
    </View>
  );
}

const notifStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderLeftWidth: 3,
    marginBottom: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 5,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  title: { fontSize: 13, fontWeight: '700', flex: 1, lineHeight: 18 },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    flexShrink: 0,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  body: { fontSize: 12, lineHeight: 18, opacity: 0.85 },
  timeText: { fontSize: 10, fontWeight: '600' },
});

// ── Màn hình chính ─────────────────────────────────────────
export default function MemberNotificationScreen() {
  const { notifications, loading, fetchNotifications, markAsRead, clearNotifications } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);

  const syncNotifications = useCallback(async () => {
    try {
      // Fetch thông báo mới
      await fetchNotifications();
      
      // Lấy trạng thái checkin riêng lẻ nếu cần
      const res = await api.get('/members/me/notifications');
      if (res.data?.success) {
        setCheckedIn(res.data.data?.da_check_in_hom_nay || false);
      }
    } catch (err) {
      console.error('[NotificationScreen] sync error:', err?.message);
    } finally {
      setRefreshing(false);
    }
  }, [fetchNotifications]);

  useFocusEffect(
    useCallback(() => {
      syncNotifications();
      const intervalId = setInterval(fetchNotifications, 15000);
      return () => {
        clearInterval(intervalId);
        // Đánh dấu đã đọc khi người dùng chuyển sang tab khác / thoát màn hình (blur)
        markAsRead();
      };
    }, [syncNotifications, fetchNotifications, markAsRead])
  );

  const onRefresh = () => { setRefreshing(true); syncNotifications(); };

  const handleClearAll = () => {
    if (notifications.filter(n => n.is_custom).length === 0) {
      Alert.alert('Thông báo', 'Bạn không có thông báo cá nhân nào để xoá.');
      return;
    }

    Alert.alert(
      'Xoá thông báo',
      'Bạn có chắc chắn muốn xoá tất cả thông báo cá nhân? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xoá sạch', 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearNotifications();
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể xoá thông báo. Vui lòng thử lại.');
            }
          }
        }
      ]
    );
  };

  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.isDark ? colors.statusBarBg : G.white} />

      {/* ── Header ─────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerIconBox, { backgroundColor: colors.primaryLight }]}>
            <Bell color={colors.primary} size={18} strokeWidth={2} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Thông báo</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.refreshBtn, { marginRight: 8, backgroundColor: colors.surfaceVariant }]}
            onPress={handleClearAll}
            activeOpacity={0.7}
          >
            <Trash2 color={G.danger} size={16} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.refreshBtn, { backgroundColor: colors.surfaceVariant }]}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <RefreshCw color={colors.primary} size={16} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Check-in banner ────────────────────── */}
      <View style={[
        styles.checkinBanner, 
        checkedIn 
          ? { backgroundColor: colors.primaryLight } 
          : { backgroundColor: colors.isDark ? 'rgba(217,119,6,0.15)' : G.warningLight }
      ]}>
        {checkedIn ? (
          <CheckCircle color={colors.primary} size={16} strokeWidth={2.5} />
        ) : (
          <Info color={colors.isDark ? '#fbbf24' : G.warning} size={16} strokeWidth={2.5} />
        )}
        <Text style={[styles.checkinText, { color: checkedIn ? colors.primary : colors.isDark ? '#fbbf24' : G.warning }]}>
          {checkedIn ? 'Bạn đã check-in hôm nay ✓' : 'Bạn chưa check-in hôm nay'}
        </Text>
      </View>

      {/* ── Danh sách thông báo ─────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Đang tải thông báo...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyBox}>
            <BellOff color={colors.textMuted} size={48} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Không có thông báo</Text>
            <Text style={[styles.emptySubText, { color: colors.textMuted }]}>
              Mọi thứ đang ổn định. Kéo xuống để làm mới.
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {notifications.map((n, i) => <NotificationCard key={i} item={n} />)}
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: G.gray50 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: G.white,
    borderBottomWidth: 1,
    borderBottomColor: G.gray200,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconBox: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: G.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: G.gray900 },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: G.gray100,
    alignItems: 'center', justifyContent: 'center',
  },

  // Check-in banner
  checkinBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
  },
  checkinBannerActive: { backgroundColor: G.primaryLight },
  checkinBannerIdle: { backgroundColor: G.warningLight },
  checkinText: { fontSize: 13, fontWeight: '700' },

  // Scroll
  scrollContent: { padding: 16, paddingBottom: 24 },
  loadingCenter: { paddingTop: 80, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: G.gray400, fontWeight: '500' },

  // Empty
  emptyBox: {
    paddingTop: 60,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: G.gray500 },
  emptySubText: { fontSize: 13, color: G.gray400, textAlign: 'center', lineHeight: 20 },

  // Danh sách phẳng
  listContainer: { flexDirection: 'column' },
});
