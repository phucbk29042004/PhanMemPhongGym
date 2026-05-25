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
import { useTheme } from '../../context/ThemeContext';

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
function KpiCard({ icon: Icon, iconBg, iconColor, label, value, sub, subColor, colors }) {
  return (
    <View style={[kpi.card, { backgroundColor: colors.surface }]}>
      <View style={[kpi.iconBox, { backgroundColor: iconBg }]}>
        <Icon color={iconColor} size={20} strokeWidth={2} />
      </View>
      <Text style={[kpi.value, { color: colors.text }]}>{value}</Text>
      <Text style={[kpi.label, { color: colors.textMuted }]}>{label}</Text>
      {sub ? <Text style={[kpi.sub, subColor && { color: subColor }]}>{sub}</Text> : null}
    </View>
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
export default function AdminDashboardScreen({ navigation }) {
  const { user } = useAuthStore();
  const { colors, isDark } = useTheme();
  const [dash, setDash] = useState(null);
  const [todayRevenue, setTodayRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.primaryDark }]}>
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
            <View style={[styles.revenueBanner, { backgroundColor: colors.primary }]}>
              <View style={styles.revenueBannerLeft}>
                <Text style={styles.revenueBannerLabel}>Doanh thu hôm nay</Text>
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
            </View>

            {/* ── KPI Grid ── */}
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Tổng quan</Text>
            <View style={styles.kpiGrid}>
              <KpiCard
                icon={Users}
                iconBg={colors.primaryLight} iconColor={colors.primary}
                label="Hội viên đang HĐ"
                value={dash?.hoi_vien?.con_han ?? '—'}
                sub={`+${dash?.percent_changes?.hoi_vien || 0}% tháng này`}
                colors={colors}
                subColor={colors.primary}
              />
              <KpiCard
                icon={CheckCircle2}
                iconBg={isDark ? '#1a3040' : '#e3f2fd'} iconColor={isDark ? '#60a5fa' : '#1565c0'}
                label="Check-in hôm nay"
                value={dash?.luot_vao_ra_hom_nay?.luot_vao ?? '—'}
                sub={`${dash?.check_in_tuan_nay ?? 0} lượt tuần này`}
                colors={colors}
                subColor={isDark ? '#60a5fa' : '#1565c0'}
              />
              <KpiCard
                icon={CalendarCheck}
                iconBg={isDark ? '#2e1c4a' : '#f3e8ff'} iconColor="#c084fc"
                label="Lịch PT hôm nay"
                value={dash?.lich_tap_hom_nay?.tong ?? '—'}
                sub={`${dash?.lich_tap_hom_nay?.da_tap || 0} đã tập`}
                colors={colors}
                subColor="#c084fc"
              />
              <KpiCard
                icon={TrendingUp}
                iconBg={isDark ? '#3d250c' : '#fffbeb'} iconColor="#fbbf24"
                label="Doanh thu tháng"
                value={formatPrice(dash?.doanh_thu_thang ?? 0)}
                sub={`${dash?.so_goi_ban_thang ?? 0} gói bán`}
                colors={colors}
                subColor="#fbbf24"
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
                      label="Gói sắp hết hạn (7 ngày)" count={dash.hoi_vien.sap_het_han} color="#fbbf24"
                      colors={colors}
                    />
                  )}
                  {(dash?.hoi_vien?.het_han ?? 0) > 0 && (
                    <AlertRow
                      icon={AlertTriangle} iconBg={colors.dangerLight} iconColor={colors.danger}
                      label="Gói đã hết hạn" count={dash.hoi_vien.het_han} color={colors.danger}
                      colors={colors}
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
                  <View style={[styles.statBox, { backgroundColor: isDark ? '#1a3040' : '#e3f2fd' }]}>
                    <Text style={[styles.statVal, { color: isDark ? '#60a5fa' : '#1565c0' }]}>{dash.tong_nhan_vien ?? '—'}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Nhân viên</Text>
                  </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
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
});
