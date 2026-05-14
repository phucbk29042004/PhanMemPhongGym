import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView,
  StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import {
  AlertCircle, AlertTriangle, Bell, BellOff,
  CheckCircle, Info, RefreshCw,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';

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

// ── Component: Card thông báo ──────────────────────────────
function NotificationCard({ item }) {
  const cfg = LEVEL_CONFIG[item.muc_do] || LEVEL_CONFIG.info;
  const { Icon } = cfg;

  return (
    <View style={[notifStyles.card, { backgroundColor: cfg.bg, borderLeftColor: cfg.border }]}>
      {/* Icon + Badge */}
      <View style={[notifStyles.iconBox, { backgroundColor: cfg.iconBg }]}>
        <Icon color={cfg.iconColor} size={20} strokeWidth={2.5} />
      </View>

      {/* Nội dung */}
      <View style={notifStyles.content}>
        <View style={notifStyles.titleRow}>
          <Text style={[notifStyles.title, { color: cfg.textColor }]} numberOfLines={2}>
            {item.tieu_de}
          </Text>
          {cfg.badge && (
            <View style={[notifStyles.badge, { backgroundColor: cfg.badgeBg }]}>
              <Text style={notifStyles.badgeText}>{cfg.badge}</Text>
            </View>
          )}
        </View>
        <Text style={[notifStyles.body, { color: cfg.textColor }]} numberOfLines={4}>
          {item.noi_dung}
        </Text>
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
  title: { fontSize: 13, fontWeight: '700', flex: 1, lineHeight: 18 },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    flexShrink: 0,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  body: { fontSize: 12, lineHeight: 18, opacity: 0.85 },
});

// ── Màn hình chính ─────────────────────────────────────────
export default function MemberNotificationScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/members/me/notifications');
      if (res.data?.success) {
        setNotifications(res.data.data?.notifications || []);
        setCheckedIn(res.data.data?.da_check_in_hom_nay || false);
      }
    } catch (err) {
      console.error('[NotificationScreen] fetch error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
      const intervalId = setInterval(fetchNotifications, 15000);
      return () => clearInterval(intervalId);
    }, [fetchNotifications])
  );

  const onRefresh = () => { setRefreshing(true); fetchNotifications(); };

  // Phân nhóm theo mức độ
  const dangerItems = notifications.filter(n => n.muc_do === 'danger');
  const warningItems = notifications.filter(n => n.muc_do === 'warning');
  const infoItems = notifications.filter(n => n.muc_do === 'info');
  const successItems = notifications.filter(n => n.muc_do === 'success');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={G.white} />

      {/* ── Header ─────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconBox}>
            <Bell color={G.primary} size={18} strokeWidth={2} />
          </View>
          <Text style={styles.headerTitle}>Thông báo</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          <RefreshCw color={G.primary} size={16} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* ── Check-in banner ────────────────────── */}
      <View style={[styles.checkinBanner, checkedIn ? styles.checkinBannerActive : styles.checkinBannerIdle]}>
        {checkedIn ? (
          <CheckCircle color={G.primary} size={16} strokeWidth={2.5} />
        ) : (
          <Info color={G.warning} size={16} strokeWidth={2.5} />
        )}
        <Text style={[styles.checkinText, { color: checkedIn ? G.primary : G.warning }]}>
          {checkedIn ? 'Bạn đã check-in hôm nay ✓' : 'Bạn chưa check-in hôm nay'}
        </Text>
      </View>

      {/* ── Danh sách thông báo ─────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[G.primary]} tintColor={G.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color={G.primary} />
            <Text style={styles.loadingText}>Đang tải thông báo...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyBox}>
            <BellOff color={G.gray300} size={48} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Không có thông báo</Text>
            <Text style={styles.emptySubText}>
              Mọi thứ đang ổn định. Kéo xuống để làm mới.
            </Text>
          </View>
        ) : (
          <>
            {/* Nhóm QUAN TRỌNG */}
            {dangerItems.length > 0 && (
              <View style={styles.group}>
                <View style={styles.groupHeader}>
                  <AlertCircle color={G.danger} size={14} strokeWidth={2.5} />
                  <Text style={[styles.groupTitle, { color: G.danger }]}>Cần xử lý ngay</Text>
                </View>
                {dangerItems.map((n, i) => <NotificationCard key={i} item={n} />)}
              </View>
            )}

            {/* Nhóm CHÚ Ý */}
            {warningItems.length > 0 && (
              <View style={styles.group}>
                <View style={styles.groupHeader}>
                  <AlertTriangle color={G.warning} size={14} strokeWidth={2.5} />
                  <Text style={[styles.groupTitle, { color: G.warning }]}>Cần chú ý</Text>
                </View>
                {warningItems.map((n, i) => <NotificationCard key={i} item={n} />)}
              </View>
            )}

            {/* Nhóm THÔNG TIN */}
            {infoItems.length > 0 && (
              <View style={styles.group}>
                <View style={styles.groupHeader}>
                  <Info color={G.info} size={14} strokeWidth={2.5} />
                  <Text style={[styles.groupTitle, { color: G.info }]}>Thông tin</Text>
                </View>
                {infoItems.map((n, i) => <NotificationCard key={i} item={n} />)}
              </View>
            )}

            {/* Nhóm THÀNH CÔNG */}
            {successItems.length > 0 && (
              <View style={styles.group}>
                <View style={styles.groupHeader}>
                  <CheckCircle color={G.success} size={14} strokeWidth={2.5} />
                  <Text style={[styles.groupTitle, { color: G.success }]}>Tích cực</Text>
                </View>
                {successItems.map((n, i) => <NotificationCard key={i} item={n} />)}
              </View>
            )}
          </>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: G.gray50 },

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

  // Nhóm
  group: { marginBottom: 16 },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  groupTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
});
