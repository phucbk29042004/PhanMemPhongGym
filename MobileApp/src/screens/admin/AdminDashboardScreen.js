// Force Metro bundler re-read
import React, { useCallback, useState, useEffect } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView,
  StatusBar, StyleSheet, Text, TouchableOpacity, View,
  Modal, FlatList,
} from 'react-native';
import {
  AlertTriangle, BarChart3, CalendarCheck, CheckCircle2,
  Clock, CreditCard, DollarSign, TrendingUp, UserCheck, Users,
  Bell, Trash2, Check, X, Building2, ChevronDown,
} from 'lucide-react-native';

import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatPrice(val) {
  if (val == null) return '0đ';
  return Number(val).toLocaleString('vi-VN') + 'đ';
}

function formatDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function getTransactionStatusAndDiff(item) {
  let statusText = 'Đăng ký mới';
  let statusColor = '#10b981'; // Green
  let statusBg = 'rgba(16, 185, 129, 0.1)';
  let diffText = `+${formatPrice(item.gia_thuc_te)}`;
  let diffColor = '#10b981';

  if (item.trang_thai === 'huy') {
    const isSwitch = (item.ly_do_huy || '').includes('Đổi sang');
    if (isSwitch) {
      statusText = 'Đổi gói';
      statusColor = '#d97706'; // Orange
      statusBg = 'rgba(217, 119, 6, 0.1)';
      const refundAmount = item.so_tien_hoan || 0;
      diffText = `-${formatPrice(refundAmount)}`;
      diffColor = '#ef4444';
    } else {
      statusText = 'Hủy gói';
      statusColor = '#ef4444'; // Red
      statusBg = 'rgba(239, 68, 68, 0.1)';
      const refundAmount = item.so_tien_hoan || item.gia_thuc_te || 0;
      diffText = `-${formatPrice(refundAmount)}`;
      diffColor = '#ef4444';
    }
  } else {
    const isSwitch = (item.ghi_chu_tt || '').includes('Đổi từ');
    if (isSwitch) {
      statusText = 'Đổi gói';
      statusColor = '#d97706'; // Orange
      statusBg = 'rgba(217, 119, 6, 0.1)';
      const matchHoanTien = (item.ghi_chu_tt || '').match(/Hoàn tiền:\s*([0-9.]+)/);
      const hoanTien = matchHoanTien ? parseFloat(matchHoanTien[1]) : 0;
      const diff = item.gia_thuc_te - hoanTien;
      if (diff >= 0) {
        diffText = `+${formatPrice(diff)}`;
        diffColor = '#10b981';
      } else {
        diffText = `-${formatPrice(Math.abs(diff))}`;
        diffColor = '#ef4444';
      }
    } else if (item.trang_thai === 'tam_dung') {
      statusText = 'Tạm dừng';
      statusColor = '#6b7280'; // Gray
      statusBg = 'rgba(107, 114, 128, 0.1)';
      diffText = '—';
      diffColor = '#6b7280';
    } else if (item.trang_thai === 'het_han') {
      statusText = 'Hết hạn';
      statusColor = '#6b7280'; // Gray
      statusBg = 'rgba(107, 114, 128, 0.1)';
      diffText = '—';
      diffColor = '#6b7280';
    } else {
      statusText = 'Đăng ký mới';
      statusColor = '#10b981'; // Green
      statusBg = 'rgba(16, 185, 129, 0.1)';
      diffText = `+${formatPrice(item.gia_thuc_te)}`;
      diffColor = '#10b981';
    }
  }

  return { statusText, statusColor, statusBg, diffText, diffColor };
}

// ── KPI Card ──────────────────────────────────────────────
function KpiCard({ icon: Icon, iconBg, iconColor, label, value, sub, subColor, colors, onPress }) {
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container 
      style={[kpi.card, { backgroundColor: colors.surface }]} 
      onPress={onPress} 
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[kpi.iconBox, { backgroundColor: iconBg }]}>
        <Icon color={iconColor} size={20} strokeWidth={2} />
      </View>
      <Text style={[kpi.value, { color: colors.text }]}>{value}</Text>
      <Text style={[kpi.label, { color: colors.textMuted }]}>{label}</Text>
      {sub ? <Text style={[kpi.sub, subColor && { color: subColor }]}>{sub}</Text> : null}
    </Container>
  );
}

const kpi = StyleSheet.create({
  card: {
    flex: 1, minWidth: '45%',
    borderRadius: 16, padding: 16,
    alignItems: 'flex-start',
    shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8, elevation: 2,
    margin: 4,
  },
  iconBox: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  value: { fontSize: 22, fontWeight: '800' },
  label: { fontSize: 11, marginTop: 2, fontWeight: '600' },
  sub: { fontSize: 10, marginTop: 4, fontWeight: '700' },
});

// ── Alert Row ─────────────────────────────────────────────
function AlertRow({ icon: Icon, iconColor, iconBg, label, count, color, onPress, colors }) {
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container 
      style={[alertRow.row, { borderBottomColor: colors.borderLight }]} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={[alertRow.iconBox, { backgroundColor: iconBg }]}>
        <Icon color={iconColor} size={16} strokeWidth={2} />
      </View>
      <Text style={[alertRow.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[alertRow.badge, { backgroundColor: color + '22' }]}>
        <Text style={[alertRow.badgeText, { color }]}>{count}</Text>
      </View>
    </Container>
  );
}

const alertRow = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, gap: 12,
    borderBottomWidth: 1,
  },
  iconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontSize: 13, fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '800' },
});

// ── Revenue Row ───────────────────────────────────────────
function RevenueRow({ label, value, colors }) {
  return (
    <View style={[revRow.row, { borderBottomColor: colors.borderLight }]}>
      <View style={[revRow.dot, { backgroundColor: colors.primary }]} />
      <Text style={[revRow.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[revRow.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const revRow = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10, borderBottomWidth: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { flex: 1, fontSize: 13, fontWeight: '600' },
  value: { fontSize: 13, fontWeight: '800' },
});

// ── Màn hình chính ────────────────────────────────────────
// ── Màn hình chính ────────────────────────────────────────
export default function AdminDashboardScreen({ navigation }) {
  const { user, selectedBranch, setSelectedBranch } = useAuthStore();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [dash, setDash] = useState(null);
  const [todayRevenue, setTodayRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // States for notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifPage, setNotifPage] = useState(1);

  // States for today's transactions detail modal
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [txPage, setTxPage] = useState(1);

  // States for today's check-ins detail modal
  const [todayCheckins, setTodayCheckins] = useState([]);
  const [checkinsLoading, setCheckinsLoading] = useState(false);
  const [showCheckinsModal, setShowCheckinsModal] = useState(false);
  const [checkinPage, setCheckinPage] = useState(1);

  const PAGE_SIZE = 10;


  const [branches, setBranches] = useState([]);
  const [showBranchModal, setShowBranchModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const q = selectedBranch ? `?chi_nhanh=${encodeURIComponent(selectedBranch)}` : '';
      const revQ = selectedBranch ? `&chi_nhanh=${encodeURIComponent(selectedBranch)}` : '';
      const [dashRes, todayRes, notifsRes, unreadRes, branchesRes] = await Promise.all([
        api.get(`/revenue/dashboard${q}`),
        api.get(`/revenue/today${q}`),
        api.get('/notifications'),
        api.get('/notifications/unread-count'),
        api.get('/branches'),
      ]);
      if (dashRes.data?.success) setDash(dashRes.data.data);
      if (todayRes.data?.success) setTodayRevenue(todayRes.data.data);
      if (notifsRes.data?.success) setNotifications(notifsRes.data.data || []);
      if (unreadRes.data?.success) setUnreadCount(unreadRes.data.data?.count || 0);
      if (branchesRes.data?.success) setBranches(branchesRes.data.data || []);
    } catch (err) {
      console.error('[AdminDashboard] fetch error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedBranch]);

  const fetchCheckinsToday = async () => {
    setCheckinsLoading(true);
    try {
      const q = selectedBranch ? `&chi_nhanh=${encodeURIComponent(selectedBranch)}` : '';
      const res = await api.get(`/checkins?limit=100${q}`);
      if (res.data?.success) {
        setTodayCheckins(res.data.data || []);
      }
    } catch (err) {
      console.error('[AdminDashboard] checkins fetch error:', err?.message);
    } finally {
      setCheckinsLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleMarkAsRead = async (id) => {
    try {
      const res = await api.patch(`/notifications/${id}/read`);
      if (res.data?.success) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, da_doc: 1 } : n));
        const unreadRes = await api.get('/notifications/unread-count');
        if (unreadRes.data?.success) setUnreadCount(unreadRes.data.data?.count || 0);
      }
    } catch (err) {
      console.error('[AdminDashboard] mark read error:', err?.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.patch('/notifications/read-all');
      if (res.data?.success) {
        setNotifications(prev => prev.map(n => ({ ...n, da_doc: 1 })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('[AdminDashboard] mark all read error:', err?.message);
    }
  };

  const handleDeleteNotif = async (id) => {
    try {
      const res = await api.delete(`/notifications/${id}`);
      if (res.data?.success) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        const unreadRes = await api.get('/notifications/unread-count');
        if (unreadRes.data?.success) setUnreadCount(unreadRes.data.data?.count || 0);
      }
    } catch (err) {
      console.error('[AdminDashboard] delete notif error:', err?.message);
    }
  };

  const handleDeleteAllNotifs = async () => {
    try {
      const res = await api.delete('/notifications');
      if (res.data?.success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('[AdminDashboard] delete all notifs error:', err?.message);
    }
  };

  const getNotifStyle = (loai) => {
    const l = (loai || '').toLowerCase();
    if (l.includes('danger') || l.includes('error') || l.includes('het_han')) {
      return { bg: isDark ? '#2d1818' : '#fff0f0', border: isDark ? '#4c1c1c' : '#fca5a5', text: isDark ? '#fecaca' : '#7f1d1d' };
    }
    if (l.includes('warning') || l.includes('sap_het')) {
      return { bg: isDark ? '#2d2218' : '#fffbeb', border: isDark ? '#4c321c' : '#fcd34d', text: isDark ? '#fef3c7' : '#78350f' };
    }
    if (l.includes('success') || l.includes('check_in')) {
      return { bg: isDark ? '#182d1f' : '#f0fdf4', border: isDark ? '#1c4c2d' : '#86efac', text: isDark ? '#d1fae5' : '#14532d' };
    }
    return { bg: isDark ? '#182235' : '#eff6ff', border: isDark ? '#1c355e' : '#93c5fd', text: isDark ? '#dbeafe' : '#1e3a5f' };
  };

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Chào buổi sáng' : now.getHours() < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  // Pagination controls component
  const Pagination = ({ currentPage, totalItems, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
    if (totalPages <= 1) return null;
    return (
      <View style={pagination.container}>
        <Text style={[pagination.text, { color: colors.textSecondary }]}>
          Trang {currentPage}/{totalPages} ({totalItems} mục)
        </Text>
        <View style={pagination.buttons}>
          <TouchableOpacity
            disabled={currentPage === 1}
            style={[pagination.btn, { borderColor: colors.border }, currentPage === 1 && { opacity: 0.3 }]}
            onPress={() => onPageChange(currentPage - 1)}
          >
            <Text style={[pagination.btnText, { color: colors.textSecondary }]}>Trước</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={currentPage === totalPages}
            style={[pagination.btn, { borderColor: colors.border }, currentPage === totalPages && { opacity: 0.3 }]}
            onPress={() => onPageChange(currentPage + 1)}
          >
            <Text style={[pagination.btnText, { color: colors.textSecondary }]}>Sau</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.primaryDark, paddingTop: Math.max(insets.top, 16) + 8 }]}>
        <View>
          <Text style={styles.headerSub}>{greeting}, {user?.ho_ten || (user?.role === 'le_tan' ? 'Lễ tân' : 'Admin')}</Text>
          <Text style={styles.headerTitle}>Paradise GYM</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.bellBtn} 
            onPress={() => { setShowNotifModal(true); setNotifPage(1); }}
            activeOpacity={0.7}
          >
            <Bell color="#ffffff" size={22} strokeWidth={2} />
            {unreadCount > 0 && (
              <View style={[styles.bellBadge, { backgroundColor: colors.danger }]}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.headerDate}>
            <Text style={styles.headerDateText}>
              {now.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' })}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Bộ lọc chi nhánh — Nút mở Modal ── */}
      <TouchableOpacity
        style={[
          styles.branchTrigger,
          { backgroundColor: colors.surface, borderBottomColor: colors.border }
        ]}
        onPress={() => setShowBranchModal(true)}
        activeOpacity={0.8}
      >
        <Building2 color={colors.primary} size={15} strokeWidth={2} />
        <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: colors.text, marginLeft: 8 }}>
          {selectedBranch || 'Tất cả chi nhánh'}
        </Text>
        <ChevronDown color={colors.textSecondary} size={16} strokeWidth={2} />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        contentContainerStyle={styles.scroll}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Đang tải dữ liệu…</Text>
          </View>
        ) : (
          <>
            {/* ── Doanh thu hôm nay ── */}
            <TouchableOpacity 
              style={[styles.revenueBanner, { backgroundColor: colors.primary }]}
              onPress={() => { setShowTransactionsModal(true); setTxPage(1); }}
              activeOpacity={0.9}
            >
              <View style={styles.revenueBannerLeft}>
                <Text style={styles.revenueBannerLabel}>Doanh thu hôm nay (Click xem chi tiết)</Text>
                <Text style={styles.revenueBannerValue}>
                  {formatPrice(todayRevenue?.tong_tien || 0)}
                </Text>
                <Text style={styles.revenueBannerSub}>
                  {todayRevenue?.tong_don || 0} giao dịch • {todayRevenue?.so_hv_moi || 0} HV mới
                </Text>
              </View>
              <View style={styles.revenueBannerIcon}>
                <DollarSign color="#ffffff" size={32} strokeWidth={1.5} />
              </View>
            </TouchableOpacity>

            {/* ── KPI Grid ── */}
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Tổng quan (Click xem chi tiết)</Text>
            <View style={styles.kpiGrid}>
              <KpiCard
                icon={Users}
                iconBg={colors.primaryLight} iconColor={colors.primary}
                label="Hội viên đang HĐ"
                value={dash?.hoi_vien?.con_han ?? '—'}
                sub={`+${dash?.percent_changes?.hoi_vien || 0}% tháng này`}
                colors={colors}
                subColor={colors.primary}
                onPress={() => navigation.navigate('AdminMembers', { filter: 'active' })}
              />
              <KpiCard
                icon={CheckCircle2}
                iconBg={isDark ? '#1a3040' : '#e3f2fd'} iconColor={isDark ? '#60a5fa' : '#1565c0'}
                label="Check-in hôm nay"
                value={dash?.luot_vao_ra_hom_nay?.luot_vao ?? '—'}
                sub={`${dash?.check_in_tuan_nay ?? 0} lượt tuần này`}
                colors={colors}
                subColor={isDark ? '#60a5fa' : '#1565c0'}
                onPress={() => { fetchCheckinsToday(); setShowCheckinsModal(true); setCheckinPage(1); }}
              />
              <KpiCard
                icon={CalendarCheck}
                iconBg={isDark ? '#2e1c4a' : '#f3e8ff'} iconColor="#c084fc"
                label="Lịch PT hôm nay"
                value={dash?.lich_tap_hom_nay?.tong ?? '—'}
                sub={`${dash?.lich_tap_hom_nay?.da_tap || 0} đã tập`}
                colors={colors}
                subColor="#c084fc"
                onPress={() => navigation.navigate('AdminPT', { tab: 'schedule' })}
              />
              <KpiCard
                icon={TrendingUp}
                iconBg={isDark ? '#3d250c' : '#fffbeb'} iconColor="#fbbf24"
                label="Doanh thu tháng"
                value={formatPrice(dash?.doanh_thu_thang ?? 0)}
                sub={`${dash?.so_goi_ban_thang ?? 0} gói bán`}
                colors={colors}
                subColor="#fbbf24"
                onPress={() => navigation.navigate('AdminRevenue')}
              />
            </View>

            {/* ── Cảnh báo ── */}
            {((dash?.hoi_vien?.sap_het_han ?? 0) > 0 || (dash?.hoi_vien?.het_han ?? 0) > 0 || (dash?.yeu_cau_cho_duyet ?? 0) > 0) && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Cần xử lý</Text>
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {(dash?.hoi_vien?.sap_het_han ?? 0) > 0 && (
                    <AlertRow
                      icon={Clock} iconBg={isDark ? '#3d250c' : '#fffbeb'} iconColor="#fbbf24"
                      label="Hội viên sắp hết hạn (7 ngày)" count={dash.hoi_vien.sap_het_han} color="#fbbf24"
                      colors={colors}
                      onPress={() => navigation.navigate('AdminExpiredMembers', { filter: 'expiring' })}
                    />
                  )}
                  {(dash?.hoi_vien?.het_han ?? 0) > 0 && (
                    <AlertRow
                      icon={AlertTriangle} iconBg={colors.dangerLight} iconColor={colors.danger}
                      label="Hội viên đã hết hạn" count={dash.hoi_vien.het_han} color={colors.danger}
                      colors={colors}
                      onPress={() => navigation.navigate('AdminExpiredMembers', { filter: 'expired' })}
                    />
                  )}
                  {(dash?.yeu_cau_cho_duyet ?? 0) > 0 && (
                    <AlertRow
                      icon={UserCheck} iconBg={colors.primaryLight} iconColor={colors.primary}
                      label="Yêu cầu gia hạn chờ duyệt" count={dash.yeu_cau_cho_duyet} color={colors.primary}
                      onPress={() => navigation.navigate('AdminPackageRequests')}
                      colors={colors}
                    />
                  )}
                </View>
              </>
            )}

            {/* ── Doanh thu theo loại ── */}
            {todayRevenue && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Phân loại doanh thu hôm nay</Text>
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {/* Doanh thu hôm qua để so sánh */}
                  <View style={[revRow.row, { borderBottomColor: colors.borderLight }]}>
                    <View style={[revRow.dot, { backgroundColor: colors.textMuted }]} />
                    <Text style={[revRow.label, { color: colors.textSecondary }]}>Doanh thu hôm qua</Text>
                    <Text style={[revRow.value, { color: colors.textSecondary }]}>{formatPrice(todayRevenue.hom_qua || 0)}</Text>
                  </View>
                  {(todayRevenue.tien_goi_tap ?? 0) > 0 && (
                    <RevenueRow label="Gói Gym" value={formatPrice(todayRevenue.tien_goi_tap)} colors={colors} />
                  )}
                  {(todayRevenue.tien_goi_pt ?? 0) > 0 && (
                    <RevenueRow label="Gói PT" value={formatPrice(todayRevenue.tien_goi_pt)} colors={colors} />
                  )}
                  {((todayRevenue.tong_tien || 0) - (todayRevenue.tien_goi_tap || 0) - (todayRevenue.tien_goi_pt || 0)) > 0 && (
                    <RevenueRow
                      label="Khác"
                      value={formatPrice((todayRevenue.tong_tien || 0) - (todayRevenue.tien_goi_tap || 0) - (todayRevenue.tien_goi_pt || 0))}
                      colors={colors}
                    />
                  )}
                  {!todayRevenue.tien_goi_tap && !todayRevenue.tien_goi_pt && ((todayRevenue.tong_tien || 0) - (todayRevenue.tien_goi_tap || 0) - (todayRevenue.tien_goi_pt || 0)) <= 0 && (
                    <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                      <Text style={{ fontSize: 12, color: colors.textMuted }}>Chưa có doanh thu hôm nay</Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* ── Thống kê nhanh ── */}
            {dash && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Thống kê thêm</Text>
                <View style={styles.statsRow}>
                  <View style={[styles.statBox, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.statVal, { color: colors.primary }]}>{dash.tong_pt ?? '—'}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Huấn luyện viên</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.statBox, { backgroundColor: isDark ? '#1a3040' : '#e3f2fd' }]}
                    onPress={() => navigation.navigate('AdminStaff')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.statVal, { color: isDark ? '#60a5fa' : '#1565c0' }]}>{dash.tong_nhan_vien ?? '—'}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Nhân viên</Text>
                  </TouchableOpacity>
                  <View style={[styles.statBox, { backgroundColor: isDark ? '#2e1c4a' : '#f3e8ff' }]}>
                    <Text style={[styles.statVal, { color: '#c084fc' }]}>{dash.tong_goi_tap ?? '—'}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Gói đang BH</Text>
                  </View>
                </View>
              </>
            )}

            <View style={{ height: 24 }} />
          </>
        )}
      </ScrollView>

      {/* ── MODAL CHI TIẾT GIAO DỊCH DOANH THU ── */}
      <Modal visible={showTransactionsModal} transparent animationType="slide" onRequestClose={() => setShowTransactionsModal(false)}>
        <View style={modalStyles.backdrop}>
          <View style={[modalStyles.container, { backgroundColor: colors.surface }]}>
            <View style={modalStyles.header}>
              <Text style={[modalStyles.title, { color: colors.text }]}>Giao dịch hôm nay</Text>
              <TouchableOpacity onPress={() => setShowTransactionsModal(false)} style={modalStyles.closeBtn}>
                <X color={colors.text} size={20} />
              </TouchableOpacity>
            </View>
            
            {!(todayRevenue?.giao_dich) || todayRevenue.giao_dich.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>Chưa có giao dịch nào hôm nay</Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={todayRevenue.giao_dich.slice((txPage - 1) * PAGE_SIZE, txPage * PAGE_SIZE)}
                  keyExtractor={(item, idx) => String(idx)}
                  contentContainerStyle={modalStyles.list}
                  renderItem={({ item }) => {
                    const txInfo = getTransactionStatusAndDiff(item);
                    const isGym = item.loai === 'goi_tap';
                    const typeColor = isGym ? colors.primary : '#8b5cf6';
                    const typeBg = isGym ? colors.primaryLight : 'rgba(139,92,246,0.12)';
                    return (
                      <View style={[modalStyles.txCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        {/* Row 1: Tên KH + Loại */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, width: '100%' }}>
                          <Text style={[modalStyles.rowTitle, { color: colors.text, flex: 1, marginRight: 8 }]} numberOfLines={1}>
                            {item.khach_hang}
                          </Text>
                          <View style={[modalStyles.typeBadge, { backgroundColor: typeBg }]}>
                            <Text style={[modalStyles.typeBadgeText, { color: typeColor }]}>
                              {isGym ? 'GYM' : 'PT'}
                            </Text>
                          </View>
                        </View>
                        {/* Row 2: Sản phẩm + Giờ */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, width: '100%' }}>
                          <Text style={[modalStyles.rowText, { color: colors.textSecondary, flex: 1 }]} numberOfLines={1}>
                            {item.san_pham}
                          </Text>
                          <Text style={[modalStyles.rowText, { color: colors.textMuted }]}>
                            {new Date(item.thoi_gian).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        {/* Row 3: Trạng thái + Tiền + Chênh lệch */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <View style={[modalStyles.badge, { backgroundColor: txInfo.statusBg }]}>
                            <Text style={[modalStyles.badgeText, { color: txInfo.statusColor }]}>
                              {txInfo.statusText}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[modalStyles.rowTitle, { color: colors.primary, fontSize: 13 }]}>
                              {formatPrice(item.gia_thuc_te)}
                            </Text>
                            <Text style={[{ fontSize: 11, fontWeight: '700', color: txInfo.diffColor, textAlign: 'right' }]}>
                              {txInfo.diffText}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  }}
                />
                <Pagination 
                  currentPage={txPage} 
                  totalItems={todayRevenue.giao_dich.length} 
                  onPageChange={setTxPage} 
                />
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── MODAL CHI TIẾT CHECK-IN HÔM NAY ── */}
      <Modal visible={showCheckinsModal} transparent animationType="slide" onRequestClose={() => setShowCheckinsModal(false)}>
        <View style={modalStyles.backdrop}>
          <View style={[modalStyles.container, { backgroundColor: colors.surface }]}>
            <View style={modalStyles.header}>
              <Text style={[modalStyles.title, { color: colors.text }]}>Check-in hôm nay</Text>
              <TouchableOpacity onPress={() => setShowCheckinsModal(false)} style={modalStyles.closeBtn}>
                <X color={colors.text} size={20} />
              </TouchableOpacity>
            </View>
            
            {checkinsLoading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : todayCheckins.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>Chưa có lượt vào ra nào hôm nay</Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={todayCheckins.slice((checkinPage - 1) * PAGE_SIZE, checkinPage * PAGE_SIZE)}
                  keyExtractor={(item, idx) => String(idx)}
                  contentContainerStyle={modalStyles.list}
                  renderItem={({ item }) => (
                    <View style={modalStyles.row}>
                      <View style={modalStyles.rowHeader}>
                        <Text style={[modalStyles.rowTitle, { color: colors.text }]}>{item.ho_ten}</Text>
                        <View style={[
                          modalStyles.badge, 
                          { backgroundColor: item.loai === 'vao' ? colors.primaryLight : colors.dangerLight }
                        ]}>
                          <Text style={[
                            modalStyles.badgeText, 
                            { color: item.loai === 'vao' ? colors.primary : colors.danger }
                          ]}>
                            {item.loai === 'vao' ? 'VÀO' : 'RA'}
                          </Text>
                        </View>
                      </View>
                      <View style={modalStyles.rowHeader}>
                        <Text style={[modalStyles.rowText, { color: colors.textSecondary }]}>
                          Phương thức: {item.phuong_thuc === 'thu_cong' ? 'Thủ công' : item.phuong_thuc === 'qr_code' ? 'QR Code' : 'Thẻ từ'}
                        </Text>
                        <Text style={[modalStyles.rowText, { color: colors.textMuted }]}>{item.gio_hien_thi || '—'}</Text>
                      </View>
                    </View>
                  )}
                />
                <Pagination 
                  currentPage={checkinPage} 
                  totalItems={todayCheckins.length} 
                  onPageChange={setCheckinPage} 
                />
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── MODAL THÔNG BÁO HỆ THỐNG ── */}
      <Modal visible={showNotifModal} transparent animationType="slide" onRequestClose={() => setShowNotifModal(false)}>
        <View style={modalStyles.backdrop}>
          <View style={[modalStyles.container, { backgroundColor: colors.surface, maxHeight: '85%' }]}>
            <View style={modalStyles.header}>
              <View>
                <Text style={[modalStyles.title, { color: colors.text }]}>Thông báo ({unreadCount})</Text>
                <Text style={{ fontSize: 10, color: colors.textMuted }}>Mới nhận gần đây</Text>
              </View>
              <View style={modalStyles.headerActions}>
                {notifications.length > 0 && (
                  <>
                    <TouchableOpacity onPress={handleMarkAllRead} style={[modalStyles.actionBtn, { borderColor: colors.primary }]}>
                      <Text style={[modalStyles.actionBtnText, { color: colors.primary }]}>Đọc tất cả</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDeleteAllNotifs} style={[modalStyles.actionBtn, { borderColor: colors.danger }]}>
                      <Text style={[modalStyles.actionBtnText, { color: colors.danger }]}>Xóa tất cả</Text>
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity onPress={() => setShowNotifModal(false)} style={modalStyles.closeBtn}>
                  <X color={colors.text} size={20} />
                </TouchableOpacity>
              </View>
            </View>

            {notifications.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>Không có thông báo nào</Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={notifications.slice((notifPage - 1) * PAGE_SIZE, notifPage * PAGE_SIZE)}
                  keyExtractor={(item) => String(item.id)}
                  contentContainerStyle={modalStyles.list}
                  renderItem={({ item }) => {
                    const s = getNotifStyle(item.loai);
                    return (
                      <View style={[modalStyles.notifItem, { backgroundColor: s.bg, borderColor: s.border }]}>
                        <Text style={[modalStyles.notifTitle, { color: s.text }]}>{item.tieu_de}</Text>
                        <Text style={[modalStyles.notifContent, { color: s.text }]}>{item.noi_dung}</Text>
                        <View style={modalStyles.notifFooter}>
                          {!item.da_doc && (
                            <TouchableOpacity 
                              style={[modalStyles.notifBtn, { backgroundColor: colors.primary + '22' }]} 
                              onPress={() => handleMarkAsRead(item.id)}
                            >
                              <Check color={colors.primary} size={12} strokeWidth={2.5} />
                              <Text style={[modalStyles.notifBtnText, { color: colors.primary }]}>Đã đọc</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity 
                            style={[modalStyles.notifBtn, { backgroundColor: colors.danger + '22' }]} 
                            onPress={() => handleDeleteNotif(item.id)}
                          >
                            <Trash2 color={colors.danger} size={12} strokeWidth={2.5} />
                            <Text style={[modalStyles.notifBtnText, { color: colors.danger }]}>Xóa</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  }}
                />
                <Pagination 
                  currentPage={notifPage} 
                  totalItems={notifications.length} 
                  onPageChange={setNotifPage} 
                />
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── MODAL CHỌN CHI NHÁNH ── */}
      <Modal visible={showBranchModal} transparent animationType="slide" onRequestClose={() => setShowBranchModal(false)}>
        <View style={modalStyles.backdrop}>
          <View style={[modalStyles.container, { backgroundColor: colors.surface, maxHeight: '70%' }]}>
            <View style={modalStyles.header}>
              <Text style={[modalStyles.title, { color: colors.text }]}>Chọn chi nhánh</Text>
              <TouchableOpacity onPress={() => setShowBranchModal(false)} style={modalStyles.closeBtn}>
                <X color={colors.text} size={20} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[branchPickerStyles.item, { borderBottomColor: colors.borderLight }]}
              onPress={() => { setSelectedBranch(''); setShowBranchModal(false); }}
            >
              <View style={[
                branchPickerStyles.radio,
                { borderColor: selectedBranch === '' ? colors.primary : colors.border },
                selectedBranch === '' && { backgroundColor: colors.primary }
              ]} />
              <Text style={[branchPickerStyles.itemText, { color: selectedBranch === '' ? colors.primary : colors.text, fontWeight: selectedBranch === '' ? '700' : '500' }]}>
                Tất cả chi nhánh
              </Text>
            </TouchableOpacity>
            <FlatList
              data={branches}
              keyExtractor={(item) => String(item.id || item.ten)}
              renderItem={({ item }) => {
                const isSelected = selectedBranch === item.ten;
                return (
                  <TouchableOpacity
                    style={[branchPickerStyles.item, { borderBottomColor: colors.borderLight }]}
                    onPress={() => { setSelectedBranch(item.ten); setShowBranchModal(false); }}
                  >
                    <View style={[
                      branchPickerStyles.radio,
                      { borderColor: isSelected ? colors.primary : colors.border },
                      isSelected && { backgroundColor: colors.primary }
                    ]} />
                    <Text style={[branchPickerStyles.itemText, { color: isSelected ? colors.primary : colors.text, fontWeight: isSelected ? '700' : '500' }]}>
                      {item.ten}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
    minHeight: '40%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  list: {
    paddingBottom: 20,
    gap: 10,
  },
  txCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
    width: '100%',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'left',
  },
  rowText: {
    fontSize: 12,
    textAlign: 'left',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
  notifItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  notifContent: {
    fontSize: 12,
    lineHeight: 16,
  },
  notifFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  notifBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  notifBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

const pagination = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    marginTop: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellBtn: {
    position: 'relative',
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  bellBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  headerDate: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  headerDateText: { fontSize: 12, color: '#ffffff', fontWeight: '600' },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  loadingBox: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 13 },

  revenueBanner: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  revenueBannerLeft: { flex: 1 },
  revenueBannerLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginBottom: 4 },
  revenueBannerValue: { fontSize: 32, fontWeight: '900', color: '#ffffff' },
  revenueBannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  revenueBannerIcon: { opacity: 0.5 },

  sectionTitle: {
    fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 8, marginTop: 4, paddingLeft: 2,
  },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 16 },

  card: {
    borderRadius: 16, paddingHorizontal: 16,
    shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8, elevation: 2,
    borderWidth: 1,
    marginBottom: 16,
  },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  branchTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
});

const branchPickerStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  itemText: {
    fontSize: 14,
  },
});
