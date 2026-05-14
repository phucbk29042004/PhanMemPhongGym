import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, RefreshControl, ScrollView,
  StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import {
  Award, CalendarCheck, CheckCircle2, ChevronRight, Clock,
  Dumbbell, QrCode, ShieldCheck, TrendingUp, UserCheck, Users, Zap,
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
};

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

// ── Màn hình chính HLV (PT Home Screen) ───────────────────
export default function PTHomeScreen({ navigation }) {
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // ── Fetch dữ liệu thực tế từ API Backend ─────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [profileRes, schedRes] = await Promise.all([
        api.get('/members/me/profile'),
        api.get('/pt/schedules'), // Backend tự động filter theo PT đăng nhập
      ]);

      if (profileRes.data?.success) setProfile(profileRes.data.data);
      if (schedRes.data?.success) setSchedules(schedRes.data.data || []);
    } catch (err) {
      console.error('[PTHomeScreen] fetchAll error:', err?.message);
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

  // ── Thao tác Xác nhận Hoàn thành buổi tập ────────────────
  const handleConfirmSchedule = async (id) => {
    Alert.alert(
      'Xác nhận buổi tập',
      'Bạn có chắc chắn xác nhận học viên đã hoàn thành buổi tập này? Khóa học sẽ tự động trừ 1 buổi trong gói PT tương ứng.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            setActionLoadingId(id);
            try {
              const res = await api.put(`/pt/schedules/${id}/confirm`);
              if (res.data?.success || res.status === 200) {
                await fetchAll();
              } else {
                Alert.alert('Lỗi', res.data?.message || 'Không thể xác nhận buổi tập.');
              }
            } catch (err) {
              Alert.alert('Lỗi', err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật DB.');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  // ── Thống kê nhanh từ danh sách ──────────────────────────
  const pendingSchedules = schedules.filter(s => s.trang_thai === 'cho_tap');
  const completedCount = schedules.filter(s => s.trang_thai === 'da_tap').length;
  const uniqueStudents = new Set(schedules.map(s => s.hoi_vien_id).filter(Boolean)).size;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={G.primaryDark} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[G.primary]} tintColor={G.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ──────────────────────────────────────────────── */}
        {/* TOP BANNER — Hiệu ứng tia nắng & Nhận diện HLV   */}
        {/* ──────────────────────────────────────────────── */}
        <View style={styles.banner}>
          {Array.from({ length: 12 }).map((_, i) => (
            <View
              key={i}
              style={[styles.sunRay, { transform: [{ rotate: `${i * 30}deg` }] }]}
            />
          ))}

          <View style={styles.bannerHeader}>
            <View style={styles.bannerLeft}>
              <View style={styles.bannerAvatar}>
                <ProfileAvatar
                  uri={profile?.avatar_url || user?.avatar_url}
                  name={profile?.ho_ten || user?.name}
                  size={46}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerGreeting}>Huấn luyện viên 👋</Text>
                <Text style={styles.bannerName} numberOfLines={1}>
                  {profile?.ho_ten || user?.name || 'PT chuyên nghiệp'}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.bannerLogout} onPress={logout} activeOpacity={0.8}>
              <Text style={styles.bannerLogoutText}>Đăng xuất</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bannerBody}>
            <View style={styles.specBadge}>
              <Award color={G.white} size={14} strokeWidth={2.5} />
              <Text style={styles.specBadgeText}>
                {profile?.chuyen_mon || 'Fitness & Bodybuilding'}
              </Text>
            </View>
            <Text style={styles.bannerSubtitle}>
              {profile?.chi_nhanh || 'Hệ thống Paradise GYM Premium'}
            </Text>
          </View>
        </View>

        {/* ──────────────────────────────────────────────── */}
        {/* THỐNG KÊ TỔNG QUAN (PREMIUM CARDS)               */}
        {/* ──────────────────────────────────────────────── */}
        <View style={styles.statsWrapper}>
          <View style={[styles.statCard, { backgroundColor: G.primary }]}>
            <Users color="rgba(255,255,255,0.25)" size={42} style={styles.statBgIcon} />
            <Text style={styles.statNum}>{uniqueStudents}</Text>
            <Text style={styles.statLabel}>Học viên</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: G.primaryMid }]}>
            <Clock color="rgba(255,255,255,0.25)" size={42} style={styles.statBgIcon} />
            <Text style={styles.statNum}>{pendingSchedules.length}</Text>
            <Text style={styles.statLabel}>Ca chờ tập</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: G.white, borderWidth: 1, borderColor: G.gray200 }]}>
            <CheckCircle2 color={G.primaryLight} size={42} style={styles.statBgIcon} />
            <Text style={[styles.statNum, { color: G.gray900 }]}>{completedCount}</Text>
            <Text style={[styles.statLabel, { color: G.gray500 }]}>Đã dạy</Text>
          </View>
        </View>

        {/* ──────────────────────────────────────────────── */}
        {/* TIỆN ÍCH NHANH CHO HLV                           */}
        {/* ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBox}>
              <Zap color={G.primary} size={18} strokeWidth={2} />
            </View>
            <Text style={styles.sectionTitle}>Quản lý & Tiện ích</Text>
          </View>

          <View style={styles.utilGrid}>
            <UtilityChip
              icon={QrCode}
              label={'Mã QR\nCheck-in'}
              accent="#7c3aed"
              onPress={() => navigation?.navigate?.('QRCode')}
            />
            <UtilityChip
              icon={CalendarCheck}
              label={'Lịch dạy\ncủa tôi'}
              accent={G.primary}
              onPress={() => navigation?.navigate?.('Schedule')}
            />
            <UtilityChip
              icon={Users}
              label={'Danh sách\nHọc viên'}
              accent="#0891b2"
              onPress={() => navigation?.navigate?.('Members')}
            />
            <UtilityChip
              icon={UserCheck}
              label={'Hồ sơ\nchuyên môn'}
              accent="#b7791f"
              onPress={() => navigation?.navigate?.('Profile')}
            />
          </View>
        </View>

        {/* ──────────────────────────────────────────────── */}
        {/* DANH SÁCH CA DẠY CHỜ HOÀN THÀNH                  */}
        {/* ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBox}>
              <Clock color={G.primary} size={18} strokeWidth={2} />
            </View>
            <Text style={styles.sectionTitle}>Ca dạy tiếp theo</Text>
            <TouchableOpacity onPress={() => navigation?.navigate?.('Schedule')}>
              <Text style={styles.viewAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={G.primary} size="small" />
            </View>
          ) : pendingSchedules.length === 0 ? (
            <View style={styles.emptyBox}>
              <CalendarCheck color={G.gray400} size={32} strokeWidth={1.5} />
              <Text style={styles.emptyText}>Tuyệt vời! Không còn ca dạy nào đang chờ xác nhận.</Text>
            </View>
          ) : (
            <View style={styles.schedulesList}>
              {pendingSchedules.slice(0, 5).map((item) => (
                <View key={item.id} style={styles.scheduleItem}>
                  <View style={styles.schedHeader}>
                    <View style={styles.schedTimeBadge}>
                      <Text style={styles.schedTimeBadgeText}>
                        {item.gio_bat_dau} - {item.gio_ket_thuc}
                      </Text>
                    </View>
                    <Text style={styles.schedDateText}>{formatDate(item.ngay_tap)}</Text>
                  </View>

                  <View style={styles.schedBody}>
                    <View style={styles.schedMemberInfo}>
                      <ProfileAvatar uri={item.avatar_hoi_vien} name={item.ten_hoi_vien} size={40} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.schedMemberName}>{item.ten_hoi_vien}</Text>
                        <Text style={styles.schedPackageType}>
                          {item.loai_buoi === 'ca_nhan' ? 'Cá nhân (1 kèm 1)' : 'Tập nhóm'} • Còn lại: <Text style={{ color: G.primary, fontWeight: '700' }}>{item.buoi_con_lai ?? '—'} buổi</Text>
                        </Text>
                      </View>
                    </View>

                    {item.ghi_chu ? (
                      <Text style={styles.schedNote} numberOfLines={2}>Ghi chú: {item.ghi_chu}</Text>
                    ) : null}
                  </View>

                  <View style={styles.schedFooter}>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusPillText}>Chờ tập</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.confirmActionBtn}
                      onPress={() => handleConfirmSchedule(item.id)}
                      disabled={actionLoadingId === item.id}
                    >
                      {actionLoadingId === item.id ? (
                        <ActivityIndicator size="small" color={G.white} />
                      ) : (
                        <Text style={styles.confirmActionBtnText}>✓ Hoàn thành</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ──────────────────────────────────────────────── */}
        {/* PANEL PARADISE GYM PREMIUM                       */}
        {/* ──────────────────────────────────────────────── */}
        <View style={styles.paradisePanel}>
          <View style={styles.paradisePanelInner}>
            <View style={styles.paradiseBadge}>
              <ShieldCheck color={G.white} size={12} strokeWidth={2} />
              <Text style={styles.paradiseBadgeText}>TRAINER PORTAL</Text>
            </View>
            <Text style={styles.paradiseTitle}>Paradise GYM</Text>
            <Text style={styles.paradiseDesc}>
              Đồng hành cùng sự thay đổi và bứt phá giới hạn thể chất của học viên
            </Text>
            <View style={styles.paradiseStats}>
              {[
                { icon: Users, label: 'Học viên tin tưởng', value: '100%' },
                { icon: Dumbbell, label: 'Chương trình chuẩn', value: '5 sao' },
                { icon: Award, label: 'Hỗ trợ tận tâm', value: '24/7' },
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

      </ScrollView>
    </View>
  );
}

// ── StyleSheet ────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: G.gray50 },
  scrollContent: { paddingBottom: 32 },

  // Banner
  banner: {
    backgroundColor: G.primaryDark,
    paddingTop: 52,
    paddingBottom: 36,
    paddingHorizontal: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  sunRay: {
    position: 'absolute',
    width: 2,
    height: 300,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -50,
    left: '50%',
    transformOrigin: 'bottom center',
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bannerAvatar: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 24,
    overflow: 'hidden',
  },
  bannerGreeting: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  bannerName: { fontSize: 16, color: G.white, fontWeight: '700', maxWidth: 170 },
  bannerLogout: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  bannerLogoutText: { color: '#fca5a5', fontSize: 11, fontWeight: '700' },
  bannerBody: { alignItems: 'flex-start', marginTop: 4 },
  specBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 6,
  },
  specBadgeText: { color: G.white, fontSize: 12, fontWeight: '700' },
  bannerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },

  // Stats Wrapper (Nằm đè lên viền banner dưới)
  statsWrapper: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: -20,
    justifyContent: 'space-between',
    gap: 8,
    zIndex: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  statBgIcon: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    transform: [{ rotate: '-15deg' }],
  },
  statNum: { fontSize: 18, fontWeight: '800', color: G.white, marginBottom: 2 },
  statLabel: { fontSize: 10, fontWeight: '600', color: G.white, opacity: 0.9, textAlign: 'center' },

  // Section
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: G.white,
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  sectionTitle: { fontSize: 15, fontWeight: '800', color: G.gray900, flex: 1 },
  viewAllText: { fontSize: 12, fontWeight: '700', color: G.primary },

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

  // Schedules List
  loadingBox: { paddingVertical: 20, alignItems: 'center' },
  emptyBox: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 13, color: G.gray400, textAlign: 'center', paddingHorizontal: 20 },
  schedulesList: { gap: 12 },
  scheduleItem: {
    backgroundColor: G.gray50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: G.gray200,
    borderLeftWidth: 4,
    borderLeftColor: G.primary,
    overflow: 'hidden',
  },
  schedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  schedTimeBadge: {
    backgroundColor: G.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  schedTimeBadgeText: { fontSize: 11, fontWeight: '800', color: G.primaryDark },
  schedDateText: { fontSize: 11, fontWeight: '600', color: G.gray500 },
  schedBody: { paddingHorizontal: 12, paddingBottom: 10 },
  schedMemberInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  schedMemberName: { fontSize: 15, fontWeight: '700', color: G.gray900, marginBottom: 2 },
  schedPackageType: { fontSize: 11, color: G.gray500, fontWeight: '500' },
  schedNote: {
    fontSize: 11,
    color: G.gray500,
    fontStyle: 'italic',
    backgroundColor: G.white,
    padding: 6,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: G.gray200,
  },
  schedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: G.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: G.gray200,
  },
  statusPill: {
    backgroundColor: '#fef9c3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusPillText: { fontSize: 10, fontWeight: '700', color: '#a16207' },
  confirmActionBtn: {
    backgroundColor: G.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  confirmActionBtnText: { color: G.white, fontSize: 11, fontWeight: '700' },

  // Paradise panel
  paradisePanel: { marginHorizontal: 16, marginTop: 16 },
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
  paradiseTitle: { fontSize: 22, fontWeight: '800', color: G.white, marginBottom: 6 },
  paradiseDesc: {
    fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 18, marginBottom: 18,
  },
  paradiseStats: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden',
  },
  paradiseStat: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 4 },
  paradiseStatValue: { fontSize: 15, fontWeight: '800', color: G.white },
  paradiseStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
});
