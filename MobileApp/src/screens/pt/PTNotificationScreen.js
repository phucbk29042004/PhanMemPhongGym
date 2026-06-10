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
  warning: '#d97706',
  warningLight: '#fffbeb',
  info: '#2563eb',
  infoLight: '#eff6ff',
  success: '#16a34a',
  successLight: '#f0fdf4',
};

// ── Config theo mức độ ─────────────────────────────────────
const LEVEL_CONFIG = {
  danger: {
    bg: G.dangerLight, border: G.danger, iconBg: '#fee2e2',
    textColor: '#7f1d1d', Icon: AlertCircle, iconColor: G.danger,
    badge: 'QUAN TRỌNG', badgeBg: G.danger,
  },
  warning: {
    bg: G.warningLight, border: G.warning, iconBg: '#fef3c7',
    textColor: '#78350f', Icon: AlertTriangle, iconColor: G.warning,
    badge: 'CHÚ Ý', badgeBg: G.warning,
  },
  info: {
    bg: G.infoLight, border: G.info, iconBg: '#dbeafe',
    textColor: '#1e3a5f', Icon: Info, iconColor: G.info,
    badge: null, badgeBg: G.info,
  },
  success: {
    bg: G.successLight, border: G.success, iconBg: '#dcfce7',
    textColor: '#14532d', Icon: CheckCircle, iconColor: G.success,
    badge: null, badgeBg: G.success,
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

const getNotifStyle = (loai, tieuDe, noiDung, isDark) => {
  const l = (loai || '').toLowerCase();
  const t = (tieuDe || '').toLowerCase();
  const n = (noiDung || '').toLowerCase();
  
  if (
    l.includes('danger') || l.includes('error') || l.includes('het_han') || l.includes('huy') ||
    t.includes('hết hạn') || t.includes('hủy') || t.includes('bị khóa') ||
    n.includes('hết hạn') || n.includes('hủy bỏ') || n.includes('bị khóa')
  ) {
    return { bg: isDark ? '#2d1818' : '#fff0f0', border: isDark ? '#4c1c1c' : '#fca5a5', text: isDark ? '#fecaca' : '#7f1d1d' };
  }
  if (
    l.includes('warning') || l.includes('sap_het') ||
    t.includes('sắp hết') || t.includes('cảnh báo') || t.includes('tạm dừng') ||
    n.includes('sắp hết') || n.includes('cảnh báo') || n.includes('tạm dừng')
  ) {
    return { bg: isDark ? '#2d2218' : '#fffbeb', border: isDark ? '#4c321c' : '#fcd34d', text: isDark ? '#fef3c7' : '#78350f' };
  }
  if (
    l.includes('success') || l.includes('check_in') || l.includes('hoan_thanh') ||
    t.includes('thành công') || t.includes('đăng ký') || t.includes('nhận') || t.includes('hoàn thành') ||
    n.includes('thành công') || n.includes('đăng ký') || n.includes('đã nhận') || n.includes('hoàn thành')
  ) {
    return { bg: isDark ? '#182d1f' : '#f0fdf4', border: isDark ? '#1c4c2d' : '#86efac', text: isDark ? '#d1fae5' : '#14532d' };
  }
  return { bg: isDark ? '#182235' : '#eff6ff', border: isDark ? '#1c355e' : '#93c5fd', text: isDark ? '#dbeafe' : '#1e3a5f' };
};

// ── Component: Card thông báo ──────────────────────────────
function NotificationCard({ item }) {
  const { colors } = useTheme();
  const s = getNotifStyle(item.muc_do || item.loai, item.tieu_de, item.noi_dung, colors.isDark);

  return (
    <View style={[
      notifStyles.card,
      {
        backgroundColor: s.bg,
        borderColor: s.border,
        borderWidth: 1,
      }
    ]}>
      <View style={notifStyles.content}>
        <View style={notifStyles.titleRow}>
          <View style={notifStyles.titleContainer}>
            {item.is_custom && item.da_doc === 0 && <PulsingDot />}
            <Text style={[notifStyles.title, { color: s.text }]} numberOfLines={2}>
              {item.tieu_de}
            </Text>
          </View>
        </View>
        <Text style={[notifStyles.body, { color: s.text, opacity: 0.85, marginBottom: item.ngay_tao ? 6 : 0 }]} numberOfLines={4}>
          {item.noi_dung}
        </Text>
        {item.ngay_tao && (
          <Text style={[notifStyles.timeText, { color: s.text, opacity: 0.6 }]}>
            {formatTimeAgo(item.ngay_tao)}
          </Text>
        )}
      </View>
    </View>
  );
}

const notifStyles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  content: { flex: 1 },
  titleRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: 8, marginBottom: 4,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  title: { fontSize: 13, fontWeight: '700', flex: 1, lineHeight: 18 },
  body: { fontSize: 12, lineHeight: 18 },
  timeText: { fontSize: 10, fontWeight: '600' },
});

// ── Màn hình chính ─────────────────────────────────────────
export default function PTNotificationScreen() {
  const { notifications, loading, fetchNotifications, markAsRead, clearNotifications } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

  const syncNotifications = useCallback(async () => {
    try {
      await fetchNotifications();
    } catch (err) {
      console.error('[PTNotificationScreen] sync error:', err?.message);
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
        // Đánh dấu đã đọc khi rời màn hình (blur)
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
            try { await clearNotifications(); } catch { Alert.alert('Lỗi', 'Không thể xoá thông báo.'); }
          }
        }
      ]
    );
  };

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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20,
    backgroundColor: G.white, borderBottomWidth: 1, borderBottomColor: G.gray200,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconBox: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: G.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: G.gray900 },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: G.gray100, alignItems: 'center', justifyContent: 'center',
  },
  scrollContent: { padding: 16, paddingBottom: 24 },
  loadingCenter: { paddingTop: 80, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: G.gray400, fontWeight: '500' },
  emptyBox: { paddingTop: 60, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: G.gray500 },
  emptySubText: { fontSize: 13, color: G.gray400, textAlign: 'center', lineHeight: 20 },
  listContainer: { flexDirection: 'column' },
});
