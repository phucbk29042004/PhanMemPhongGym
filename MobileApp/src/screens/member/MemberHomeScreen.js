import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl, ScrollView,
  StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import {
  Award, CalendarCheck, ChevronRight, Clock,
  CreditCard, Dumbbell, QrCode, ShieldCheck,
  TrendingUp, Users, Zap,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import ProfileAvatar from '../../components/ProfileAvatar';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';
import { formatDate } from '../../utils/data';

// ── Hằng số màu sắc Paradise Gym ─────────────────────────
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
  gray500: '#6b7c6b',
  gray700: '#2d3c2d',
  gray900: '#141c14',
  danger: '#dc2626',
  dangerLight: '#fef2f2',
  warning: '#f59e0b',
  warningLight: '#fffbeb',
  shadow: '#1D9336',
};

// ── Helper: số ngày còn lại ───────────────────────────────
function daysLeft(den_ngay) {
  if (!den_ngay) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const end = new Date(den_ngay); end.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((end - today) / 86400000));
}

// ── Helper: format giá tiền ───────────────────────────────
function formatPrice(val) {
  if (val == null) return '—';
  return Number(val).toLocaleString('vi-VN') + 'đ';
}

// ── Component: Card Gói Hội Viên ──────────────────────────
function PackageCard({ item, index }) {
  const isPT = item.loai_goi === 'pt' || item.loai_goi === 'theo_buoi';
  const colors = [
    { bg: G.primaryLight, accent: G.primary },
    { bg: '#e8f4fd', accent: '#1565c0' },
    { bg: '#fef9e7', accent: '#b7791f' },
    { bg: '#f3e8ff', accent: '#7c3aed' },
  ];
  const c = colors[index % colors.length];

  return (
    <View style={[styles.packageCard, { backgroundColor: c.bg }]}>
      <View style={[styles.packageIconBox, { backgroundColor: c.accent + '22' }]}>
        {isPT ? <Users color={c.accent} size={22} strokeWidth={2} /> : <Award color={c.accent} size={22} strokeWidth={2} />}
      </View>
      <Text style={[styles.packageName, { color: c.accent }]} numberOfLines={2}>{item.ten_goi}</Text>
      <Text style={[styles.packagePrice, { color: G.gray900 }]}>{formatPrice(item.gia)}</Text>
      {item.so_thang ? (
        <Text style={styles.packageSub}>{item.so_thang} tháng{item.so_ngay_them > 0 ? ` +${item.so_ngay_them} ngày` : ''}</Text>
      ) : item.so_buoi ? (
        <Text style={styles.packageSub}>{item.so_buoi} buổi</Text>
      ) : null}
    </View>
  );
}

// ── Component: Chip Tiện Ích ──────────────────────────────
function UtilityChip({ icon: Icon, label, onPress, accent = G.primary }) {
  return (
    <TouchableOpacity style={styles.utilChip} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.utilIcon, { backgroundColor: accent + '18' }]}>
        <Icon color={accent} size={22} strokeWidth={2} />
      </View>
      <Text style={[styles.utilLabel, { color: G.gray700 }]} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Component: Alert Banner ───────────────────────────────
function AlertBanner({ item }) {
  const cfg = {
    danger: { bg: G.dangerLight, border: G.danger, text: '#7f1d1d' },
    warning: { bg: G.warningLight, border: G.warning, text: '#78350f' },
    info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e3a5f' },
    success: { bg: G.primaryLight, border: G.primary, text: '#14532d' },
  }[item.muc_do] || { bg: G.primaryLight, border: G.primary, text: '#14532d' };

  return (
    <View style={[styles.alertBanner, { backgroundColor: cfg.bg, borderLeftColor: cfg.border }]}>
      <Zap color={cfg.border} size={16} strokeWidth={2.5} style={{ marginRight: 8, flexShrink: 0 }} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.alertTitle, { color: cfg.text }]}>{item.tieu_de}</Text>
        <Text style={[styles.alertBody, { color: cfg.text }]}>{item.noi_dung}</Text>
      </View>
    </View>
  );
}

// ── Màn hình chính ────────────────────────────────────────
export default function MemberHomeScreen({ navigation }) {
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [gymPackages, setGymPackages] = useState([]);
  const [ptPackages, setPtPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch dữ liệu thực tế từ API ─────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [profileRes, notiRes, pkgRes, ptPkgRes] = await Promise.all([
        api.get('/members/me/profile'),
        api.get('/members/me/notifications'),
        api.get('/packages'),          // Gói gym
        api.get('/packages/pt'),       // Gói PT
      ]);

      if (profileRes.data?.success) setProfile(profileRes.data.data);
      if (notiRes.data?.success) setNotifications(notiRes.data.data?.notifications || []);
      if (pkgRes.data?.success) setGymPackages(pkgRes.data.data || []);
      if (ptPkgRes.data?.success) setPtPackages(ptPkgRes.data.data || []);
    } catch (err) {
      console.error('[HomeScreen] fetchAll error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  // ── Dữ liệu đã xử lý ─────────────────────────────────────
  const activePlan = profile?.goi_tap?.[0] || null;
  const activePT = profile?.dang_ky_pt?.[0] || null;
  const remaining = daysLeft(activePlan?.den_ngay);
  const ptRemaining = activePT ? Math.max(0, (activePT.so_buoi_dang_ky || 0) - (activePT.so_buoi_da_tap || 0)) : null;
  // Thêm prefix 'gym-' / 'pt-' vào id để tránh key trùng khi render
  const allPackages = [
    ...gymPackages.map(p => ({ ...p, _key: `gym-${p.id}` })),
    ...ptPackages.map(p => ({ ...p, _key: `pt-${p.id}` })),
  ];
  const urgentAlerts = notifications.filter(n => n.muc_do === 'danger' || n.muc_do === 'warning');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={G.primaryDark} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[G.primary]} tintColor={G.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ──────────────────────────────────────────────── */}
        {/* TOP BANNER — Paradise Gym với hiệu ứng tia nắng  */}
        {/* ──────────────────────────────────────────────── */}
        <View style={styles.banner}>
          {/* Tia nắng tỏa ra bằng View xoay — hiệu ứng thuần RN */}
          {Array.from({ length: 12 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.sunRay,
                { transform: [{ rotate: `${i * 30}deg` }] },
              ]}
            />
          ))}
          {/* Header: avatar + tên người dùng */}
          <View style={styles.bannerHeader}>
            <View style={styles.bannerLeft}>
              <View style={styles.bannerAvatar}>
                <ProfileAvatar
                  uri={profile?.avatar_url || user?.avatar_url}
                  name={profile?.ho_ten || user?.name}
                  size={42}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerGreeting}>Xin chào 👋</Text>
                <Text style={styles.bannerName} numberOfLines={1}>
                  {profile?.ho_ten || user?.name || 'Hội viên'}
                </Text>
              </View>
            </View>
            <View style={styles.bannerBadge}>
              <ShieldCheck color={G.white} size={14} strokeWidth={2} />
              <Text style={styles.bannerBadgeText}>
                {profile?.loai_hv === 'vip' ? 'VIP' : profile?.loai_hv === 'premium' ? 'Premium' : 'Standard'}
              </Text>
            </View>
          </View>

          {/* Tiêu đề lớn */}
          <View style={styles.bannerBody}>
            <Text style={styles.bannerTitle}>Paradise GYM</Text>
            <Text style={styles.bannerSubtitle}>
              {profile?.chi_nhanh || 'Chăm sóc sức khỏe mỗi ngày'}
            </Text>
          </View>
        </View>

        {/* ── Cảnh báo quan trọng (nếu có) ─────────────────── */}
        {!loading && urgentAlerts.length > 0 && (
          <View style={styles.alertSection}>
            {urgentAlerts.map((n, i) => <AlertBanner key={i} item={n} />)}
          </View>
        )}

        {/* ────────────────────────────────────── */}
        {/* CARD HỢP ĐỒNG / GÓI TẬP ĐANG HOẠT ĐỘNG */}
        {/* ────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBox}>
              <CreditCard color={G.primary} size={18} strokeWidth={2} />
            </View>
            <Text style={styles.sectionTitle}>Hợp đồng</Text>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={G.primary} size="small" />
            </View>
          ) : activePlan ? (
            <View style={styles.contractCard}>
              {/* Trạng thái + tên gói */}
              <View style={styles.contractTop}>
                <View style={styles.contractBadge}>
                  <ShieldCheck color={G.primary} size={12} strokeWidth={2.5} />
                  <Text style={styles.contractBadgeText}>Đang hoạt động</Text>
                </View>
                {remaining !== null && remaining <= 7 && (
                  <View style={[styles.contractBadge, { backgroundColor: G.dangerLight }]}>
                    <Clock color={G.danger} size={12} strokeWidth={2.5} />
                    <Text style={[styles.contractBadgeText, { color: G.danger }]}>Sắp hết hạn</Text>
                  </View>
                )}
              </View>
              <Text style={styles.contractPackageName}>{activePlan.ten_goi}</Text>

              {/* Thông số grid */}
              <View style={styles.contractGrid}>
                <View style={styles.contractGridItem}>
                  <CalendarCheck color={G.gray400} size={14} strokeWidth={2} />
                  <Text style={styles.contractGridLabel}>Từ ngày</Text>
                  <Text style={styles.contractGridValue}>{formatDate(activePlan.tu_ngay)}</Text>
                </View>
                <View style={styles.contractDivider} />
                <View style={styles.contractGridItem}>
                  <Clock color={remaining !== null && remaining <= 7 ? G.danger : G.gray400} size={14} strokeWidth={2} />
                  <Text style={styles.contractGridLabel}>Hết hạn</Text>
                  <Text style={[styles.contractGridValue, remaining !== null && remaining <= 7 && { color: G.danger }]}>
                    {formatDate(activePlan.den_ngay)}
                  </Text>
                </View>
                <View style={styles.contractDivider} />
                <View style={styles.contractGridItem}>
                  <TrendingUp color={G.primary} size={14} strokeWidth={2} />
                  <Text style={styles.contractGridLabel}>Còn lại</Text>
                  <Text style={[styles.contractGridValue, { color: remaining !== null && remaining <= 7 ? G.danger : G.primary }]}>
                    {remaining !== null ? `${remaining} ngày` : '—'}
                  </Text>
                </View>
              </View>

              {/* HLV PT (nếu có) */}
              {activePT ? (
                <View style={styles.ptRow}>
                  <Dumbbell color={G.primary} size={14} strokeWidth={2} />
                  <Text style={styles.ptRowText}>
                    {activePT.ten_goi_pt ? (
                      <>
                        Gói PT: <Text style={{ fontWeight: '700', color: G.gray900 }}>{activePT.ten_goi_pt}</Text>
                        {'  •  '}
                      </>
                    ) : null}
                    HLV: <Text style={{ fontWeight: '700', color: G.gray900 }}>{activePT.ten_pt}</Text>
                    {'  •  '}Còn <Text style={{ fontWeight: '700', color: G.primary }}>{ptRemaining} buổi</Text>
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.emptyContract}>
              <CreditCard color={G.gray400} size={32} strokeWidth={1.5} />
              <Text style={styles.emptyContractText}>Không có dữ liệu</Text>
              <Text style={styles.emptyContractSub}>Liên hệ lễ tân để đăng ký gói tập</Text>
            </View>
          )}
        </View>

        {/* ──────────────────── */}
        {/* TIỆN ÍCH NHANH      */}
        {/* ──────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBox}>
              <Zap color={G.primary} size={18} strokeWidth={2} />
            </View>
            <Text style={styles.sectionTitle}>Tiện ích</Text>
            {profile?.chi_nhanh ? (
              <Text style={styles.branchLabel} numberOfLines={1}>{profile.chi_nhanh}</Text>
            ) : null}
          </View>

          <View style={styles.utilGrid}>
            <UtilityChip
              icon={QrCode}
              label={'Quét QR\nCheck-in'}
              accent="#7c3aed"
              onPress={() => navigation?.navigate?.('QRCode')}
            />
            <UtilityChip
              icon={CalendarCheck}
              label={'Lịch tập\ntiếp theo'}
              accent={G.primary}
              onPress={() => navigation?.navigate?.('Schedule')}
            />
            <UtilityChip
              icon={TrendingUp}
              label={'Thống kê\ntập luyện'}
              accent="#0891b2"
              onPress={() => navigation?.navigate?.('Checkins')}
            />
            <UtilityChip
              icon={Award}
              label={'Buổi PT\ncòn lại'}
              accent="#b7791f"
              onPress={() => navigation?.navigate?.('Schedule')}
            />
          </View>
        </View>

        {/* ──────────────────── */}
        {/* GÓI HỘI VIÊN THỰC TẾ */}
        {/* ──────────────────── */}
        {!loading && allPackages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBox}>
                <Award color={G.primary} size={18} strokeWidth={2} />
              </View>
              <Text style={styles.sectionTitle}>Gói Hội Viên</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.packageScroll}
            >
              {allPackages.map((item, i) => (
                <PackageCard key={item._key} item={item} index={i} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ──────────────────────────── */}
        {/* PANEL PARADISE GYM          */}
        {/* ──────────────────────────── */}
        <View style={styles.paradisePanel}>
          <View style={styles.paradisePanelInner}>
            <View style={styles.paradiseBadge}>
              <ShieldCheck color={G.white} size={12} strokeWidth={2} />
              <Text style={styles.paradiseBadgeText}>PREMIUM GYM</Text>
            </View>
            <Text style={styles.paradiseTitle}>Paradise GYM</Text>
            <Text style={styles.paradiseDesc}>
              Không gian hiện đại · Huấn luyện viên chuyên nghiệp · Thiết bị cao cấp
            </Text>
            <View style={styles.paradiseStats}>
              {[
                { icon: Users, label: 'Hội viên', value: '500+' },
                { icon: Dumbbell, label: 'Huấn luyện viên', value: '20+' },
                { icon: Award, label: 'Năm hoạt động', value: '5+' },
              ].map(({ icon: Icon, label, value }) => (
                <View key={label} style={styles.paradiseStat}>
                  <Icon color={G.primaryMid} size={18} strokeWidth={2} />
                  <Text style={styles.paradiseStatValue}>{value}</Text>
                  <Text style={styles.paradiseStatLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}

// ── StyleSheet ────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: G.gray50 },
  scrollContent: { paddingBottom: 24 },

  // Banner
  banner: {
    backgroundColor: G.primaryDark,
    paddingTop: 52,
    paddingBottom: 24,
    paddingHorizontal: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  sunRay: {
    position: 'absolute',
    width: 2,
    height: 280,
    backgroundColor: 'rgba(255,255,255,0.045)',
    top: -40,
    left: '50%',
    transformOrigin: 'bottom center',
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bannerAvatar: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 24,
    overflow: 'hidden',
  },
  bannerGreeting: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  bannerName: { fontSize: 15, color: G.white, fontWeight: '700', maxWidth: 160 },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  bannerBadgeText: { color: G.white, fontSize: 11, fontWeight: '700' },
  bannerBody: { alignItems: 'center' },
  bannerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: G.white,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Alerts
  alertSection: { paddingHorizontal: 16, paddingTop: 14, gap: 8 },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
  },
  alertTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  alertBody: { fontSize: 12, lineHeight: 17, opacity: 0.85 },

  // Section
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: G.white,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  sectionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: G.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: G.gray900, flex: 1 },
  branchLabel: { fontSize: 11, color: G.gray400, maxWidth: 130, textAlign: 'right' },

  // Contract card
  loadingBox: { paddingVertical: 20, alignItems: 'center' },
  contractCard: {
    backgroundColor: G.primaryLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: G.gray200,
  },
  contractTop: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  contractBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  contractBadgeText: { fontSize: 10, fontWeight: '700', color: G.primary },
  contractPackageName: {
    fontSize: 18,
    fontWeight: '800',
    color: G.gray900,
    marginBottom: 12,
  },
  contractGrid: {
    flexDirection: 'row',
    backgroundColor: G.white,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  contractGridItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    gap: 3,
  },
  contractDivider: { width: 1, backgroundColor: G.gray200 },
  contractGridLabel: { fontSize: 10, color: G.gray400, fontWeight: '500' },
  contractGridValue: { fontSize: 12, fontWeight: '700', color: G.gray700 },
  ptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: G.white,
    borderRadius: 10,
    padding: 10,
  },
  ptRowText: { fontSize: 13, color: G.gray500, flex: 1 },
  emptyContract: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  emptyContractText: { fontSize: 15, fontWeight: '700', color: G.gray500 },
  emptyContractSub: { fontSize: 12, color: G.gray400 },

  // Utility chips
  utilGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  utilChip: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    minWidth: 55,
  },
  utilIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 13,
  },

  // Package cards
  packageScroll: { paddingRight: 4, gap: 10 },
  packageCard: {
    width: 140,
    padding: 14,
    borderRadius: 16,
    gap: 6,
  },
  packageIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  packageName: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  packagePrice: { fontSize: 16, fontWeight: '800' },
  packageSub: { fontSize: 11, color: G.gray400, fontWeight: '500' },

  // Paradise panel
  paradisePanel: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  paradisePanelInner: {
    backgroundColor: G.primaryDark,
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  paradiseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  paradiseBadgeText: { color: G.white, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  paradiseTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: G.white,
    marginBottom: 6,
  },
  paradiseDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
    marginBottom: 18,
  },
  paradiseStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  paradiseStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  paradiseStatValue: { fontSize: 18, fontWeight: '800', color: G.white },
  paradiseStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
});
