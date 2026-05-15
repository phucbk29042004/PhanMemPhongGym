import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView,
  StatusBar, StyleSheet, Switch, Text,
  TouchableOpacity, View,
} from 'react-native';
import {
  Award, Badge, Building2, Calendar, ChevronRight,
  Clock, Dumbbell, KeyRound, LogOut,
  Moon, Phone, ShieldCheck, Star, Sun, User, UserCheck,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import ProfileAvatar from '../../components/ProfileAvatar';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';
import { formatDate, formatDateTime, checkinMethodLabel } from '../../utils/data';

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

// ── Màn hình hồ sơ HLV ──────────────────────────────────────
export default function PTProfileScreen() {
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, notifRes, checkinsRes] = await Promise.all([
        api.get('/members/me/profile'),
        api.get('/members/me/notifications'),
        api.get('/checkins/me?limit=5'),
      ]);
      if (profileRes.data?.success) setProfile(profileRes.data.data);
      setNotifications(notifRes.data?.data?.notifications || []);
      setCheckins(checkinsRes.data?.data || []);
    } catch (err) {
      console.error('[PTProfileScreen] fetch error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleLogout = () => { logout?.(); };

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
          <View style={styles.profileHeaderBg} />

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={G.white} />
            </View>
          ) : (
            <View style={styles.profileCard}>
              <View style={styles.avatarWrapper}>
                <ProfileAvatar
                  uri={profile?.avatar_url || user?.avatar_url}
                  name={profile?.ho_ten || user?.name}
                  size={72}
                />
                <View style={styles.avatarBadge}>
                  <ShieldCheck color={G.white} size={10} strokeWidth={2.5} fill={G.white} />
                </View>
              </View>

              <Text style={styles.profileName}>
                {profile?.ho_ten || user?.name || 'Huấn luyện viên'}
              </Text>
              
              <View style={styles.profilePhoneRow}>
                <Phone color="rgba(255,255,255,0.7)" size={12} strokeWidth={2} />
                <Text style={styles.profilePhone}>
                  {profile?.so_dien_thoai || '—'}
                </Text>
              </View>

              <View style={styles.profileBadgeRow}>
                <View style={styles.profileBadge}>
                  <Award color={G.primary} size={11} strokeWidth={2.5} />
                  <Text style={styles.profileBadgeText}>PT Chuyên nghiệp</Text>
                </View>
                {profile?.ma_ho_so ? (
                  <View style={styles.profileBadge}>
                    <Badge color={G.primary} size={11} strokeWidth={2.5} />
                    <Text style={styles.profileBadgeText}>{profile.ma_ho_so}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.quickStats}>
                <View style={styles.quickStat}>
                  <Dumbbell color={G.primary} size={16} strokeWidth={2} />
                  <Text style={styles.quickStatVal} numberOfLines={1}>
                    {profile?.chuyen_mon || 'Gym/Fitness'}
                  </Text>
                  <Text style={styles.quickStatLabel}>Chuyên môn</Text>
                </View>
                <View style={styles.quickStatDivider} />
                <View style={styles.quickStat}>
                  <Building2 color={G.primary} size={16} strokeWidth={2} />
                  <Text style={styles.quickStatVal} numberOfLines={1}>
                    {profile?.chi_nhanh || 'Paradise GYM'}
                  </Text>
                  <Text style={styles.quickStatLabel}>Chi nhánh</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ── THÔNG TIN CHUYÊN MÔN ──────────────── */}
        <Section title="Thông tin HLV">
          <MenuRow
            icon={User} label="Họ và tên" sublabel={profile?.ho_ten || '—'}
            onPress={() => {}} rightEl={null}
          />
          <MenuRow
            icon={Award} label="Chuyên môn" sublabel={profile?.chuyen_mon || '—'}
            onPress={() => {}} rightEl={null}
          />
          <MenuRow
            icon={Badge} label="CCCD / CMND" sublabel={profile?.cccd || '—'}
            onPress={() => {}} rightEl={null}
          />
          <MenuRow
            icon={Building2} label="Chi nhánh làm việc" sublabel={profile?.chi_nhanh || '—'}
            onPress={() => {}} rightEl={<View />}
          />
        </Section>

        {/* ── NHẬT KÝ RA VÀO ──────────────────── */}
        <Section title="Nhật ký Check-in ca làm">
          {checkins.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: G.gray400 }}>Chưa có dữ liệu check-in</Text>
            </View>
          ) : checkins.map((item, idx) => (
            <MenuRow
              key={item.id}
              icon={item.loai === 'vao' ? ShieldCheck : Clock}
              iconBg={item.loai === 'vao' ? G.primaryLight : '#fff7ed'}
              iconColor={item.loai === 'vao' ? G.primary : '#ea580c'}
              label={item.loai === 'vao' ? 'Vào ca' : 'Tan ca'}
              sublabel={`${formatDateTime(item.thoi_diem)} • ${checkinMethodLabel(item.phuong_thuc)}`}
              onPress={() => {}}
              rightEl={null}
            />
          ))}
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

  quickStats: {
    flexDirection: 'row',
    marginTop: 14,
    backgroundColor: G.gray50,
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
  },
  quickStat: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3, paddingHorizontal: 4 },
  quickStatDivider: { width: 1, backgroundColor: G.gray200 },
  quickStatVal: { fontSize: 11, fontWeight: '800', color: G.gray900, textAlign: 'center' },
  quickStatLabel: { fontSize: 9, color: G.gray400, fontWeight: '500' },
});
