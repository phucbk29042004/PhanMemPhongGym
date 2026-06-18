import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal,
  Platform, RefreshControl, ScrollView,
  StatusBar, StyleSheet, Switch, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import {
  Award, Badge, Building2, Calendar, ChevronRight,
  Clock, Dumbbell, Eye, EyeOff, KeyRound, LogOut,
  Moon, Phone, ShieldCheck, Star, Sun, User, X,
} from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ProfileAvatar from '../../components/ProfileAvatar';
import EditProfileModal from '../../components/EditProfileModal';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { formatDate, formatDateTime, checkinMethodLabel } from '../../utils/data';

// ── Fixed brand colors ─────────────────────────────────────
const BRAND = {
  primary: '#1D9336',
  primaryDark: '#155f27',
  primaryLight: '#e6f4ea',
  primaryMid: '#4db870',
  danger: '#dc2626',
  dangerLight: '#fef2f2',
};

// ── Component: Menu row ─────────────────────────────────────
function MenuRow({ icon: Icon, iconBg, iconColor, label, sublabel, onPress, rightEl, danger, colors }) {
  const Container = onPress ? TouchableOpacity : View;
  const containerProps = onPress ? { onPress, activeOpacity: 0.7 } : {};
  return (
    <Container
      style={[
        menuStyles.row,
        { borderBottomColor: danger ? (colors?.dangerLight || BRAND.dangerLight) : (colors?.borderLight || '#f0f4f0') },
      ]}
      {...containerProps}
    >
      <View style={[menuStyles.iconBox, { backgroundColor: iconBg || colors?.primaryLight || BRAND.primaryLight }]}>
        <Icon color={iconColor || colors?.primary || BRAND.primary} size={18} strokeWidth={2} />
      </View>
      <View style={menuStyles.labelBox}>
        <Text style={[menuStyles.label, { color: danger ? BRAND.danger : (colors?.text || '#141c14') }]}>{label}</Text>
        {sublabel ? <Text style={[menuStyles.sublabel, { color: colors?.textMuted || '#9cad9c' }]} numberOfLines={1}>{sublabel}</Text> : null}
      </View>
      {rightEl !== undefined ? rightEl : (
        onPress ? <ChevronRight color={danger ? BRAND.danger : (colors?.textMuted || '#9cad9c')} size={18} strokeWidth={2} /> : null
      )}
    </Container>
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
  },
  iconBox: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  labelBox: { flex: 1 },
  label: { fontSize: 14, fontWeight: '700' },
  sublabel: { fontSize: 11, marginTop: 1 },
});

// ── Component: Section container ────────────────────────────
function Section({ title, children, colors, extraHeader }) {
  return (
    <View style={secStyles.wrapper}>
      {(title || extraHeader) ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          {title ? <Text style={[secStyles.title, { color: colors?.textMuted || '#9cad9c' }]}>{title}</Text> : <View />}
          {extraHeader || null}
        </View>
      ) : null}
      <View style={[secStyles.card, { backgroundColor: colors?.surface || '#ffffff' }]}>{children}</View>
    </View>
  );
}
const secStyles = StyleSheet.create({
  wrapper: { marginHorizontal: 16, marginBottom: 14 },
  title: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, paddingLeft: 4 },
  card: {
    borderRadius: 18, paddingHorizontal: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 3,
  },
});

// ── Modal Đổi mật khẩu ─────────────────────────────────────
function ChangePasswordModal({ visible, onClose, colors }) {
  const [matKhauCu, setMatKhauCu] = useState('');
  const [matKhauMoi, setMatKhauMoi] = useState('');
  const [xacNhan, setXacNhan] = useState('');
  const [showCu, setShowCu] = useState(false);
  const [showMoi, setShowMoi] = useState(false);
  const [showXn, setShowXn] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setMatKhauCu(''); setMatKhauMoi(''); setXacNhan('');
    setShowCu(false); setShowMoi(false); setShowXn(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSave = async () => {
    if (!matKhauCu) return Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu hiện tại.');
    if (!matKhauMoi || matKhauMoi.length < 6) return Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
    if (matKhauMoi !== xacNhan) return Alert.alert('Lỗi', 'Xác nhận mật khẩu không khớp.');
    setSaving(true);
    try {
      const res = await api.post('/auth/doi-mat-khau', { mat_khau_cu: matKhauCu, mat_khau_moi: matKhauMoi });
      if (res.data?.success) {
        Alert.alert('Thành công', 'Đã cập nhật mật khẩu.', [{ text: 'OK', onPress: handleClose }]);
      } else {
        Alert.alert('Lỗi', res.data?.message || 'Không thể đổi mật khẩu.');
      }
    } catch (err) {
      Alert.alert('Lỗi', err?.displayMessage || 'Có lỗi xảy ra.');
    } finally {
      setSaving(false);
    }
  };

  const C = colors || {};
  const inputBg = C.surfaceVariant || '#f0f4f0';
  const inputBorder = C.border || '#e4ebe4';
  const textColor = C.text || '#141c14';
  const labelColor = C.textSecondary || '#6b7c6b';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView style={pwStyles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[pwStyles.sheet, { backgroundColor: C.surface || '#ffffff' }]}>
          <View style={pwStyles.header}>
            <Text style={[pwStyles.headerTitle, { color: textColor }]}>Đổi mật khẩu</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X color={C.textMuted || '#9cad9c'} size={22} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {[
            { label: 'Mật khẩu hiện tại', val: matKhauCu, set: setMatKhauCu, show: showCu, toggleShow: () => setShowCu(p => !p) },
            { label: 'Mật khẩu mới', val: matKhauMoi, set: setMatKhauMoi, show: showMoi, toggleShow: () => setShowMoi(p => !p) },
            { label: 'Xác nhận mật khẩu mới', val: xacNhan, set: setXacNhan, show: showXn, toggleShow: () => setShowXn(p => !p) },
          ].map(({ label, val, set, show, toggleShow }) => (
            <View key={label} style={pwStyles.fieldWrap}>
              <Text style={[pwStyles.fieldLabel, { color: labelColor }]}>{label}</Text>
              <View style={[pwStyles.inputRow, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                <TextInput
                  style={[pwStyles.input, { color: textColor }]}
                  value={val}
                  onChangeText={set}
                  secureTextEntry={!show}
                  placeholder="••••••••"
                  placeholderTextColor={C.textMuted || '#9cad9c'}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={toggleShow} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  {show
                    ? <EyeOff color={C.textMuted || '#9cad9c'} size={18} strokeWidth={2} />
                    : <Eye color={C.textMuted || '#9cad9c'} size={18} strokeWidth={2} />
                  }
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={pwStyles.btnRow}>
            <TouchableOpacity style={[pwStyles.btnCancel, { borderColor: inputBorder }]} onPress={handleClose}>
              <Text style={[pwStyles.btnCancelText, { color: labelColor }]}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pwStyles.btnSave, { opacity: saving ? 0.7 : 1 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={pwStyles.btnSaveText}>{saving ? 'Đang lưu…' : 'Lưu'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const pwStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, height: 48,
  },
  input: { flex: 1, fontSize: 15, height: 48 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnCancel: {
    flex: 1, height: 46, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  btnCancelText: { fontSize: 14, fontWeight: '700' },
  btnSave: {
    flex: 1, height: 46, borderRadius: 12,
    backgroundColor: BRAND.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  btnSaveText: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
});

// ── Màn hình hồ sơ HLV ──────────────────────────────────────
export default function PTProfileScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme, colors } = useTheme();
  const [profile, setProfile] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, checkinsRes] = await Promise.all([
        api.get('/members/me/profile'),
        api.get('/checkins/me?limit=5'),
      ]);
      if (profileRes.data?.success) setProfile(profileRes.data.data);
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

  const safeCheckins = Array.isArray(checkins) ? checkins : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      <ChangePasswordModal
        visible={showChangePw}
        onClose={() => setShowChangePw(false)}
        colors={colors}
      />

      <EditProfileModal
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        profile={profile}
        onSaved={fetchData}
        colors={colors}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND.primary]} tintColor={BRAND.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── CARD THÔNG TIN HEADER ─────────────── */}
        <View style={styles.profileHeader}>
          <View style={[styles.profileHeaderBg, { backgroundColor: BRAND.primaryDark }]} />

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#ffffff" />
            </View>
          ) : (
            <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
              <TouchableOpacity style={styles.avatarWrapper} onPress={() => setShowEditProfile(true)} activeOpacity={0.8}>
                <ProfileAvatar
                  uri={profile?.avatar_url || user?.avatar_url}
                  name={profile?.ho_ten || user?.name}
                  size={72}
                />
                <View style={[styles.avatarBadge, { backgroundColor: BRAND.primary, borderColor: colors.surface }]}>
                  <ShieldCheck color="#ffffff" size={10} strokeWidth={2.5} fill="#ffffff" />
                </View>
              </TouchableOpacity>

              <Text style={[styles.profileName, { color: colors.text }]}>
                {profile?.ho_ten || user?.name || 'Huấn luyện viên'}
              </Text>
              <View style={[styles.profilePhoneRow, { backgroundColor: BRAND.primaryDark }]}>
                <Phone color="rgba(255,255,255,0.7)" size={12} strokeWidth={2} />
                <Text style={styles.profilePhone}>{profile?.so_dien_thoai || '—'}</Text>
              </View>

              <View style={styles.profileBadgeRow}>
                <View style={[styles.profileBadge, { backgroundColor: colors.primaryLight }]}>
                  <Award color={colors.primary} size={11} strokeWidth={2.5} />
                  <Text style={[styles.profileBadgeText, { color: colors.primary }]}>PT Chuyên nghiệp</Text>
                </View>
                {profile?.ma_ho_so ? (
                  <View style={[styles.profileBadge, { backgroundColor: colors.primaryLight }]}>
                    <Badge color={colors.primary} size={11} strokeWidth={2.5} />
                    <Text style={[styles.profileBadgeText, { color: colors.primary }]}>{profile.ma_ho_so}</Text>
                  </View>
                ) : null}
              </View>

              <View style={[styles.quickStats, { backgroundColor: colors.surfaceVariant }]}>
                <View style={styles.quickStat}>
                  <Dumbbell color={colors.primary} size={16} strokeWidth={2} />
                  <Text style={[styles.quickStatVal, { color: colors.text }]} numberOfLines={1}>
                    {profile?.chuyen_mon || 'Gym/Fitness'}
                  </Text>
                  <Text style={[styles.quickStatLabel, { color: colors.textMuted }]}>Chuyên môn</Text>
                </View>
                <View style={[styles.quickStatDivider, { backgroundColor: colors.border }]} />
                <View style={styles.quickStat}>
                  <Building2 color={colors.primary} size={16} strokeWidth={2} />
                  <Text style={[styles.quickStatVal, { color: colors.text }]} numberOfLines={1}>
                    {profile?.chi_nhanh || 'Paradise GYM'}
                  </Text>
                  <Text style={[styles.quickStatLabel, { color: colors.textMuted }]}>Chi nhánh</Text>
                </View>
              </View>
            </View>
          )}
        </View>



        {/* ── THÔNG TIN CHUYÊN MÔN ──────────────── */}
        <Section 
          title="Thông tin HLV" 
          colors={colors}
          extraHeader={
            <TouchableOpacity onPress={() => setShowEditProfile(true)}>
              <Text style={{ fontSize: 11, color: BRAND.primary, fontWeight: '700' }}>Sửa thông tin</Text>
            </TouchableOpacity>
          }
        >
          <MenuRow icon={User} label="Họ và tên" sublabel={profile?.ho_ten || '—'} onPress={null} colors={colors} />
          <MenuRow icon={Award} label="Chuyên môn" sublabel={profile?.chuyen_mon || '—'} onPress={null} colors={colors} />
          <MenuRow icon={Badge} label="CCCD / CMND" sublabel={profile?.cccd || '—'} onPress={null} colors={colors} />
          <MenuRow icon={Building2} label="Chi nhánh làm việc" sublabel={profile?.chi_nhanh || '—'} onPress={null} colors={colors} />
        </Section>

        {/* ── NHẬT KÝ RA VÀO ──────────────────── */}
        <Section title="Nhật ký Check-in ca làm" colors={colors}>
          {safeCheckins.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>Chưa có dữ liệu check-in</Text>
            </View>
          ) : safeCheckins.map((item) => (
            <MenuRow
              key={item.id}
              icon={item.loai === 'vao' ? ShieldCheck : Clock}
              iconBg={item.loai === 'vao' ? colors.primaryLight : '#fff7ed'}
              iconColor={item.loai === 'vao' ? colors.primary : '#ea580c'}
              label={item.loai === 'vao' ? 'Vào ca' : 'Tan ca'}
              sublabel={`${formatDateTime(item.thoi_diem)} • ${checkinMethodLabel(item.phuong_thuc)}`}
              onPress={null}
              colors={colors}
            />
          ))}
        </Section>

        {/* ── CÀI ĐẶT ──────────────────────────── */}
        <Section title="Cài đặt" colors={colors}>
          <MenuRow
            icon={KeyRound} iconBg={colors.primaryLight}
            label="Đổi mật khẩu" sublabel="Cập nhật mật khẩu đăng nhập"
            onPress={() => setShowChangePw(true)} colors={colors}
          />
          <MenuRow
            icon={Building2} iconBg={colors.primaryLight}
            label="Nội quy phòng tập" sublabel="Xem các quy định của phòng tập"
            onPress={() => navigation.navigate('GymRules')} colors={colors}
          />
          <MenuRow
            icon={isDark ? Moon : Sun}
            iconBg={isDark ? '#1e1e2e' : '#fef9c3'}
            iconColor={isDark ? '#a78bfa' : '#d97706'}
            label="Giao diện"
            sublabel={isDark ? 'Chế độ tối' : 'Chế độ sáng'}
            colors={colors}
            rightEl={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: BRAND.primaryMid }}
                thumbColor={isDark ? BRAND.primary : '#ffffff'}
                ios_backgroundColor={colors.border}
              />
            }
          />
        </Section>

        {/* ── ĐĂNG XUẤT ────────────────────────── */}
        <Section colors={colors}>
          <MenuRow
            icon={LogOut} iconBg={BRAND.dangerLight} iconColor={BRAND.danger}
            label="Đăng xuất" danger
            onPress={() => logout?.()}
            rightEl={null} colors={colors}
          />
        </Section>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  loadingBox: { paddingVertical: 40, alignItems: 'center' },

  profileHeader: { marginBottom: 16, position: 'relative' },
  profileHeaderBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 130,
  },
  profileCard: {
    marginHorizontal: 16,
    marginTop: 40,
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
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  profileName: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  profilePhoneRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginTop: 6,
  },
  profilePhone: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  profileBadgeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  profileBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  profileBadgeText: { fontSize: 11, fontWeight: '700' },
  quickStats: {
    flexDirection: 'row',
    marginTop: 14,
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
  },
  quickStat: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3, paddingHorizontal: 4 },
  quickStatDivider: { width: 1 },
  quickStatVal: { fontSize: 11, fontWeight: '800', textAlign: 'center' },
  quickStatLabel: { fontSize: 9, fontWeight: '500' },
});
