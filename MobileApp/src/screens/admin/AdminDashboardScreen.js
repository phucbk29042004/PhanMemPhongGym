import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView,
  StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import {
  AlertTriangle, BarChart3, CalendarCheck, CheckCircle2,
  Clock, CreditCard, DollarSign, TrendingUp, UserCheck, Users,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';

const G = {
  primary: '#1D9336',
  primaryDark: '#155f27',
  primaryLight: '#e6f4ea',
  primaryMid: '#4db870',
  white: '#ffffff',
  gray50: '#f8faf8',
  gray100: '#f0f4f0',
  gray200: '#e4ebe4',
  gray400: '#9cad9c',
  gray700: '#2d3c2d',
  gray900: '#141c14',
  danger: '#dc2626',
  dangerLight: '#fef2f2',
  warning: '#d97706',
  warningLight: '#fffbeb',
  blue: '#1565c0',
  blueLight: '#e3f2fd',
  purple: '#7c3aed',
  purpleLight: '#f3e8ff',
};

function formatPrice(val) {
  if (val == null || val === 0) return '0đ';
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  if (val >= 1_000) return (val / 1_000).toFixed(0) + 'K';
  return Number(val).toLocaleString('vi-VN') + 'đ';
}

function formatDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

// ── KPI Card ──────────────────────────────────────────────
function KpiCard({ icon: Icon, iconBg, iconColor, label, value, sub, subColor }) {
  return (
    <View style={kpi.card}>
      <View style={[kpi.iconBox, { backgroundColor: iconBg }]}>
        <Icon color={iconColor} size={20} strokeWidth={2} />
      </View>
      <Text style={kpi.value}>{value}</Text>
      <Text style={kpi.label}>{label}</Text>
      {sub ? <Text style={[kpi.sub, subColor && { color: subColor }]}>{sub}</Text> : null}
    </View>
  );
}

const kpi = StyleSheet.create({
  card: {
    flex: 1, minWidth: '45%',
    backgroundColor: G.white,
    borderRadius: 16, padding: 16,
    alignItems: 'flex-start',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 3,
    margin: 4,
  },
  iconBox: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  value: { fontSize: 22, fontWeight: '800', color: G.gray900 },
  label: { fontSize: 11, color: G.gray400, marginTop: 2, fontWeight: '600' },
  sub: { fontSize: 10, color: G.primary, marginTop: 4, fontWeight: '700' },
});

// ── Alert Row ─────────────────────────────────────────────
function AlertRow({ icon: Icon, iconColor, iconBg, label, count, color }) {
  return (
    <View style={alertRow.row}>
      <View style={[alertRow.iconBox, { backgroundColor: iconBg }]}>
        <Icon color={iconColor} size={16} strokeWidth={2} />
      </View>
      <Text style={alertRow.label}>{label}</Text>
      <View style={[alertRow.badge, { backgroundColor: color + '22' }]}>
        <Text style={[alertRow.badgeText, { color }]}>{count}</Text>
      </View>
    </View>
  );
}

const alertRow = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, gap: 12,
    borderBottomWidth: 1, borderBottomColor: G.gray100,
  },
  iconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontSize: 13, fontWeight: '600', color: G.gray700 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '800' },
});

// ── Revenue Row ───────────────────────────────────────────
function RevenueRow({ label, value, percent, isPositive }) {
  return (
    <View style={revRow.row}>
      <View style={revRow.dot} />
      <Text style={revRow.label}>{label}</Text>
      <Text style={revRow.value}>{value}</Text>
    </View>
  );
}

const revRow = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10, borderBottomWidth: 1, borderBottomColor: G.gray100 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: G.primary },
  label: { flex: 1, fontSize: 13, color: G.gray700, fontWeight: '600' },
  value: { fontSize: 13, fontWeight: '800', color: G.gray900 },
});

// ── Màn hình chính ────────────────────────────────────────
export default function AdminDashboardScreen() {
  const { user } = useAuthStore();
  const [dash, setDash] = useState(null);
  const [todayRevenue, setTodayRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('30'); // '7' | '30' | '90'

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, todayRes] = await Promise.all([
        api.get('/revenue/dashboard'),
        api.get('/revenue/today'),
      ]);
      if (dashRes.data?.success) setDash(dashRes.data.data);
      if (todayRes.data?.success) setTodayRevenue(todayRes.data.data);
    } catch (err) {
      console.error('[AdminDashboard] fetch error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Chào buổi sáng' : now.getHours() < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={G.primaryDark} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>{greeting}, Admin</Text>
          <Text style={styles.headerTitle}>Paradise GYM</Text>
        </View>
        <View style={styles.headerDate}>
          <Text style={styles.headerDateText}>
            {now.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' })}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[G.primary]} tintColor={G.primary} />}
        contentContainerStyle={styles.scroll}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={G.primary} />
            <Text style={styles.loadingText}>Đang tải dữ liệu…</Text>
          </View>
        ) : (
          <>
            {/* ── Doanh thu hôm nay ── */}
            <View style={styles.revenueBanner}>
              <View style={styles.revenueBannerLeft}>
                <Text style={styles.revenueBannerLabel}>Doanh thu hôm nay</Text>
                <Text style={styles.revenueBannerValue}>
                  {formatPrice(todayRevenue?.tong_doanh_thu || 0)}
                </Text>
                <Text style={styles.revenueBannerSub}>
                  {todayRevenue?.so_giao_dich || 0} giao dịch • {todayRevenue?.so_hv_moi || 0} HV mới
                </Text>
              </View>
              <View style={styles.revenueBannerIcon}>
                <DollarSign color={G.white} size={32} strokeWidth={1.5} />
              </View>
            </View>

            {/* ── KPI Grid ── */}
            <Text style={styles.sectionTitle}>Tổng quan</Text>
            <View style={styles.kpiGrid}>
              <KpiCard
                icon={Users}
                iconBg={G.primaryLight} iconColor={G.primary}
                label="Hội viên đang HĐ"
                value={dash?.tong_hoi_vien ?? '—'}
                sub={`+${dash?.hv_moi_trong_thang ?? 0} tháng này`}
              />
              <KpiCard
                icon={CheckCircle2}
                iconBg={G.blueLight} iconColor={G.blue}
                label="Check-in hôm nay"
                value={dash?.check_in_hom_nay ?? '—'}
                sub={`${dash?.check_in_tuan_nay ?? 0} lượt tuần này`}
              />
              <KpiCard
                icon={CalendarCheck}
                iconBg="#f3e8ff" iconColor={G.purple}
                label="Lịch PT hôm nay"
                value={dash?.lich_pt_hom_nay ?? '—'}
                sub={`${dash?.lich_pt_da_tap ?? 0} đã xác nhận`}
              />
              <KpiCard
                icon={TrendingUp}
                iconBg={G.warningLight} iconColor={G.warning}
                label="Doanh thu tháng"
                value={formatPrice(dash?.doanh_thu_thang ?? 0)}
                sub={`${dash?.so_goi_ban_thang ?? 0} gói bán`}
              />
            </View>

            {/* ── Cảnh báo ── */}
            {((dash?.sap_het_han ?? 0) > 0 || (dash?.het_han ?? 0) > 0 || (dash?.yeu_cau_cho_duyet ?? 0) > 0) && (
              <>
                <Text style={styles.sectionTitle}>Cần xử lý</Text>
                <View style={styles.card}>
                  {(dash?.sap_het_han ?? 0) > 0 && (
                    <AlertRow
                      icon={Clock} iconBg={G.warningLight} iconColor={G.warning}
                      label="Gói sắp hết hạn (7 ngày)" count={dash.sap_het_han} color={G.warning}
                    />
                  )}
                  {(dash?.het_han ?? 0) > 0 && (
                    <AlertRow
                      icon={AlertTriangle} iconBg={G.dangerLight} iconColor={G.danger}
                      label="Gói đã hết hạn" count={dash.het_han} color={G.danger}
                    />
                  )}
                  {(dash?.yeu_cau_cho_duyet ?? 0) > 0 && (
                    <AlertRow
                      icon={UserCheck} iconBg={G.primaryLight} iconColor={G.primary}
                      label="Yêu cầu gia hạn chờ duyệt" count={dash.yeu_cau_cho_duyet} color={G.primary}
                    />
                  )}
                </View>
              </>
            )}

            {/* ── Doanh thu theo loại ── */}
            {todayRevenue && (
              <>
                <Text style={styles.sectionTitle}>Phân loại doanh thu hôm nay</Text>
                <View style={styles.card}>
                  {(todayRevenue.doanh_thu_goi_gym ?? 0) > 0 && (
                    <RevenueRow label="Gói Gym" value={formatPrice(todayRevenue.doanh_thu_goi_gym)} />
                  )}
                  {(todayRevenue.doanh_thu_goi_pt ?? 0) > 0 && (
                    <RevenueRow label="Gói PT" value={formatPrice(todayRevenue.doanh_thu_goi_pt)} />
                  )}
                  {(todayRevenue.doanh_thu_khac ?? 0) > 0 && (
                    <RevenueRow label="Khác" value={formatPrice(todayRevenue.doanh_thu_khac)} />
                  )}
                  {!todayRevenue.doanh_thu_goi_gym && !todayRevenue.doanh_thu_goi_pt && (
                    <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                      <Text style={{ fontSize: 12, color: G.gray400 }}>Chưa có doanh thu hôm nay</Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* ── Thống kê nhanh ── */}
            {dash && (
              <>
                <Text style={styles.sectionTitle}>Thống kê thêm</Text>
                <View style={styles.statsRow}>
                  <View style={[styles.statBox, { backgroundColor: G.primaryLight }]}>
                    <Text style={[styles.statVal, { color: G.primary }]}>{dash.tong_pt ?? '—'}</Text>
                    <Text style={styles.statLabel}>Huấn luyện viên</Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: G.blueLight }]}>
                    <Text style={[styles.statVal, { color: G.blue }]}>{dash.tong_nhan_vien ?? '—'}</Text>
                    <Text style={styles.statLabel}>Nhân viên</Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: '#f3e8ff' }]}>
                    <Text style={[styles.statVal, { color: G.purple }]}>{dash.tong_goi_tap ?? '—'}</Text>
                    <Text style={styles.statLabel}>Gói đang BH</Text>
                  </View>
                </View>
              </>
            )}

            <View style={{ height: 24 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: G.gray50 },
  header: {
    backgroundColor: G.primaryDark,
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: G.white },
  headerDate: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  headerDateText: { fontSize: 12, color: G.white, fontWeight: '600' },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  loadingBox: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 13, color: G.gray400 },

  revenueBanner: {
    backgroundColor: G.primary,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: G.primary,
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  revenueBannerLeft: { flex: 1 },
  revenueBannerLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginBottom: 4 },
  revenueBannerValue: { fontSize: 32, fontWeight: '900', color: G.white },
  revenueBannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  revenueBannerIcon: { opacity: 0.5 },

  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: G.gray400,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 8, marginTop: 4, paddingLeft: 2,
  },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 16 },

  card: {
    backgroundColor: G.white, borderRadius: 16, paddingHorizontal: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 3,
    marginBottom: 16,
  },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', color: G.gray500, textAlign: 'center' },
});
