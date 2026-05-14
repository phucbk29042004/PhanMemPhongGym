import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView,
  StatusBar, StyleSheet, Switch, Text,
  TouchableOpacity, View,
} from 'react-native';
import {
  Award, Badge, Building2, Calendar, ChevronRight,
  CreditCard, Dumbbell, KeyRound, LogOut,
  Moon, Phone, Star, Sun, User, UserCheck,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import ProfileAvatar from '../../components/ProfileAvatar';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';
import { formatDate } from '../../utils/data';

// ── Màu sắc ────────────────────────────────────────────────
const G = {
  primary: '#1D9336',
  primaryDark: '#155f27',
  primaryLight: '#e6f4ea',
  primaryMid: '#4db870',
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
};

// ── Helper format tiền ──────────────────────────────────────
function formatPrice(val) {
  if (val == null) return '—';
  return Number(val).toLocaleString('vi-VN') + 'đ';
}

// ── Helper label giới tính ──────────────────────────────────
function genderLabel(g) {
  return g === 'nam' || g === 'male' ? 'Nam' : g === 'nu' || g === 'female' ? 'Nữ' : (g || '—');
}

// ── Helper label loại HV ────────────────────────────────────
function memberTypeLabel(type) {
  return { vip: 'VIP', premium: 'Premium', Student: 'Sinh viên' }[type] || 'Thường';
}

// ── Component: Menu row ─────────────────────────────────────
function MenuRow({ icon: Icon, iconBg, iconColor, label, sublabel, onPress, rightEl, danger }) {
  return (
    <TouchableOpacity
      style={[menuStyles.row, danger && menuStyles.rowDanger]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[menuStyles.iconBox, { backgroundColor: iconBg || G.primaryLight }]}>
        <Icon color={iconColor || G.primary} size={18} strokeWidth={2} />
      </View>
      <View style={menuStyles.labelBox}>
        <Text style={[menuStyles.label, danger && { color: G.danger }]}>{label}</Text>
        {sublabel ? <Text style={menuStyles.sublabel} numberOfLines={1}>{sublabel}</Text> : null}
      </View>
      {rightEl !== undefined ? rightEl : (
        <ChevronRight color={danger ? G.danger : G.gray300} size={18} strokeWidth={2} />
      )}
    </TouchableOpacity>
  );
}

const menuStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: G.gray100,
  },
  rowDanger: { borderBottomColor: G.dangerLight },
  iconBox: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  labelBox: { flex: 1 },
  label: { fontSize: 14, fontWeight: '700', color: G.gray900 },
  sublabel: { fontSize: 11, color: G.gray400, marginTop: 1 },
});

// ── Component: Section container ────────────────────────────
function Section({ title, children }) {
  return (
    <View style={secStyles.wrapper}>
      {title ? <Text style={secStyles.title}>{title}</Text> : null}
      <View style={secStyles.card}>{children}</View>
    </View>
  );
}
const secStyles = StyleSheet.create({
  wrapper: { marginHorizontal: 16, marginBottom: 14 },
  title: { fontSize: 12, fontWeight: '700', color: G.gray400, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8, paddingLeft: 4 },
  card: {
    backgroundColor: G.white, borderRadius: 18, paddingHorizontal: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 3,
  },
});

// ── Màn hình chính ─────────────────────────────────────────
export default function MemberProfileScreen() {
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDark, setIsDark] = useState(false); // Placeholder chế độ tối

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/members/me/profile');
      if (res.data?.success) setProfile(res.data.data);
    } catch (err) {
      console.error('[ProfileScreen] fetch error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const onRefresh = () => { setRefreshing(true); fetchProfile(); };

  const activePlan = profile?.goi_tap?.[0] || null;
  const activePT = profile?.dang_ky_pt?.[0] || null;
  const ptRemaining = activePT ? Math.max(0, (activePT.so_buoi_dang_ky || 0) - (activePT.so_buoi_da_tap || 0)) : null;
  const diaChiParts = [profile?.dia_chi_tam_tru, profile?.phuong_xa, profile?.quan_huyen, profile?.tinh_thanh].filter(Boolean);
  const diaChi = diaChiParts.join(', ') || '—';

  const handleLogout = () => {
    logout?.();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={G.white} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[G.primary]} tintColor={G.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── CARD THÔNG TIN HEADER ─────────────── */}
        <View style={styles.profileHeader}>
          {/* Nền gradient xanh lá */}
          <View style={styles.profileHeaderBg} />

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={G.white} />
            </View>
          ) : (
            <View style={styles.profileCard}>
              {/* Avatar */}
              <View style={styles.avatarWrapper}>
                <ProfileAvatar
                  uri={profile?.avatar_url || user?.avatar_url}
                  name={profile?.ho_ten || user?.name}
                  size={72}
                />
                <View style={styles.avatarBadge}>
                  <Star color={G.white} size={10} strokeWidth={2.5} fill={G.white} />
                </View>
              </View>

              {/* Tên và thông tin cơ bản */}
              <Text style={styles.profileName}>
                {profile?.ho_ten || user?.name || 'Hội viên'}
              </Text>
              <View style={styles.profilePhoneRow}>
                <Phone color="rgba(255,255,255,0.7)" size={12} strokeWidth={2} />
                <Text style={styles.profilePhone}>
                  {profile?.so_dien_thoai || '—'}
                </Text>
              </View>

              {/* Badges */}
              <View style={styles.profileBadgeRow}>
                <View style={styles.profileBadge}>
                  <UserCheck color={G.primary} size={11} strokeWidth={2.5} />
                  <Text style={styles.profileBadgeText}>
                    {memberTypeLabel(profile?.loai_hv)}
                  </Text>
                </View>
                {profile?.ma_ho_so ? (
                  <View style={styles.profileBadge}>
                    <Badge color={G.primary} size={11} strokeWidth={2.5} />
                    <Text style={styles.profileBadgeText}>{profile.ma_ho_so}</Text>
                  </View>
                ) : null}
              </View>

              {/* Quick stats */}
              <View style={styles.quickStats}>
                <View style={styles.quickStat}>
                  <CreditCard color={G.primary} size={16} strokeWidth={2} />
                  <Text style={styles.quickStatVal}>
                    {activePlan ? activePlan.ten_goi : 'Chưa có'}
                  </Text>
                  <Text style={styles.quickStatLabel}>Gói tập</Text>
                </View>
                <View style={styles.quickStatDivider} />
                <View style={styles.quickStat}>
                  <Calendar color={G.primary} size={16} strokeWidth={2} />
                  <Text style={styles.quickStatVal}>
                    {activePlan ? formatDate(activePlan.den_ngay) : '—'}
                  </Text>
                  <Text style={styles.quickStatLabel}>Hết hạn</Text>
                </View>
                <View style={styles.quickStatDivider} />
                <View style={styles.quickStat}>
                  <Dumbbell color={G.primary} size={16} strokeWidth={2} />
                  <Text style={styles.quickStatVal}>
                    {ptRemaining != null ? `${ptRemaining}` : '—'}
                  </Text>
                  <Text style={styles.quickStatLabel}>Buổi PT</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ── THÔNG TIN CÁ NHÂN ─────────────────── */}
        <Section title="Thông tin định danh">
          <MenuRow
            icon={User} label="Họ và tên" sublabel={profile?.ho_ten || '—'}
            onPress={() => {}} rightEl={null}
          />
          <MenuRow
            icon={Calendar} label="Ngày sinh" sublabel={formatDate(profile?.ngay_sinh) || '—'}
            onPress={() => {}} rightEl={null}
          />
          <MenuRow
            icon={User} label="Giới tính" sublabel={genderLabel(profile?.gioi_tinh)}
            onPress={() => {}} rightEl={null}
          />
          <MenuRow
            icon={Badge} label="CCCD / CMND" sublabel={profile?.cccd || '—'}
            onPress={() => {}} rightEl={null}
          />
          <MenuRow
            icon={Building2} label="Địa chỉ" sublabel={diaChi}
            onPress={() => {}} rightEl={null}
          />
          <MenuRow
            icon={Building2} label="Chi nhánh" sublabel={profile?.chi_nhanh || '—'}
            onPress={() => {}} rightEl={<View />}
          />
        </Section>

        {/* ── GÓI TẬP & HỢP ĐỒNG ───────────────── */}
        <Section title="Gói tập & Hợp đồng">
          <MenuRow
            icon={Award}
            iconBg="#fef3c7"
            iconColor="#b7791f"
            label="Gói tập đang hoạt động"
            sublabel={activePlan ? `${activePlan.ten_goi} · Hết ${formatDate(activePlan.den_ngay)}` : 'Chưa đăng ký gói tập'}
            onPress={() => {}}
          />
          <MenuRow
            icon={Dumbbell}
            label="Gói PT cá nhân"
            sublabel={activePT ? `${activePT.ten_goi_pt || `HLV ${activePT.ten_pt}`} · Còn ${ptRemaining} buổi` : 'Chưa đăng ký gói PT'}
            onPress={() => {}}
          />
        </Section>

        {/* ── CÀI ĐẶT ──────────────────────────── */}
        <Section title="Cài đặt">
          <MenuRow
            icon={KeyRound}
            iconBg="#f0fdf4"
            label="Đổi mật khẩu"
            sublabel="Cập nhật mật khẩu đăng nhập"
            onPress={() => {}}
          />
          <MenuRow
            icon={isDark ? Moon : Sun}
            iconBg={isDark ? '#1e1e2e' : '#fef9c3'}
            iconColor={isDark ? '#a78bfa' : '#d97706'}
            label="Giao diện"
            sublabel={isDark ? 'Chế độ tối' : 'Chế độ sáng'}
            rightEl={
              <Switch
                value={isDark}
                onValueChange={setIsDark}
                trackColor={{ false: G.gray200, true: G.primaryMid }}
                thumbColor={isDark ? G.primary : G.white}
                ios_backgroundColor={G.gray200}
              />
            }
          />
        </Section>

        {/* ── ĐĂNG XUẤT ────────────────────────── */}
        <Section>
          <MenuRow
            icon={LogOut}
            iconBg={G.dangerLight}
            iconColor={G.danger}
            label="Đăng xuất"
            danger
            onPress={handleLogout}
            rightEl={null}
          />
        </Section>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: G.gray50 },
  scrollContent: { paddingBottom: 24 },
  loadingBox: { paddingVertical: 40, alignItems: 'center' },

  // Profile header
  profileHeader: { marginBottom: 16, position: 'relative' },
  profileHeaderBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 130,
    backgroundColor: G.primaryDark,
  },
  profileCard: {
    marginHorizontal: 16,
    marginTop: 40,
    backgroundColor: G.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatarBadge: {
    position: 'absolute',
    bottom: 0, right: -2,
    width: 22, height: 22,
    borderRadius: 11,
    backgroundColor: G.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: G.white,
  },
  profileName: { fontSize: 20, fontWeight: '800', color: G.gray900, textAlign: 'center' },
  profilePhoneRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: G.primaryDark,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginTop: 6,
  },
  profilePhone: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  profileBadgeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  profileBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: G.primaryLight,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  profileBadgeText: { fontSize: 11, fontWeight: '700', color: G.primary },

  // Quick stats
  quickStats: {
    flexDirection: 'row',
    marginTop: 14,
    backgroundColor: G.gray50,
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
  },
  quickStat: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3 },
  quickStatDivider: { width: 1, backgroundColor: G.gray200 },
  quickStatVal: { fontSize: 11, fontWeight: '800', color: G.gray900, textAlign: 'center' },
  quickStatLabel: { fontSize: 9, color: G.gray400, fontWeight: '500' },
});
