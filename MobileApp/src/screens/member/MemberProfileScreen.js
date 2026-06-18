import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal,
  Platform, RefreshControl, ScrollView,
  StatusBar, StyleSheet, Switch, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import {
  Award, Badge, Building2, Calendar, ChevronRight,
  CreditCard, Dumbbell, Eye, EyeOff, KeyRound, LogOut,
  Moon, Phone, Star, Sun, User, UserCheck, X,
} from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ProfileAvatar from '../../components/ProfileAvatar';
import EditProfileModal from '../../components/EditProfileModal';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { formatDate } from '../../utils/data';

// ── Fixed brand colors (not theme-dependent) ───────────────
const BRAND = {
  primary: '#1D9336',
  primaryDark: '#155f27',
  primaryLight: '#e6f4ea',
  primaryMid: '#4db870',
  danger: '#dc2626',
  dangerLight: '#fef2f2',
};

// ── Helper format tiền ──────────────────────────────────────
function formatPrice(val) {
  if (val == null) return '—';
  return Number(val).toLocaleString('vi-VN') + 'đ';
}

function genderLabel(g) {
  return g === 'nam' || g === 'male' ? 'Nam' : g === 'nu' || g === 'female' ? 'Nữ' : (g || '—');
}

function memberTypeLabel(type) {
  return { vip: 'VIP', premium: 'Premium', Student: 'Sinh viên' }[type] || 'Thường';
}

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
function Section({ title, children, colors }) {
  return (
    <View style={secStyles.wrapper}>
      {title ? <Text style={[secStyles.title, { color: colors?.textMuted || '#9cad9c' }]}>{title}</Text> : null}
      <View style={[secStyles.card, { backgroundColor: colors?.surface || '#ffffff' }]}>{children}</View>
    </View>
  );
}
const secStyles = StyleSheet.create({
  wrapper: { marginHorizontal: 16, marginBottom: 14 },
  title: { fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8, paddingLeft: 4 },
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
          {/* Header */}
          <View style={pwStyles.header}>
            <Text style={[pwStyles.headerTitle, { color: textColor }]}>Đổi mật khẩu</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X color={C.textMuted || '#9cad9c'} size={22} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Fields */}
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

          {/* Buttons */}
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
    paddingHorizontal: 14, paddingVertical: 0,
    height: 48,
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

// ── Màn hình chính ─────────────────────────────────────────
export default function MemberProfileScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme, colors } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [savingHealth, setSavingHealth] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/members/me/profile');
      if (res.data?.success) {
        setProfile(res.data.data);
        setHeightCm(res.data.data?.chieu_cao_cm ? String(res.data.data.chieu_cao_cm) : '');
        setWeightKg(res.data.data?.can_nang_kg ? String(res.data.data.can_nang_kg) : '');
      }
    } catch (err) {
      console.error('[ProfileScreen] fetch error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const bmi = (() => {
    const h = Number(heightCm);
    const w = Number(weightKg);
    if (!h || !w) return null;
    const value = w / Math.pow(h / 100, 2);
    const category = value < 18.5 ? 'Gầy' : value < 25 ? 'Bình thường' : value < 30 ? 'Thừa cân' : 'Béo phì';
    const advice = value < 18.5 ? 'Nên tăng năng lượng nạp vào và tập sức mạnh.' : value < 25 ? 'Duy trì lịch tập và dinh dưỡng cân bằng.' : value < 30 ? 'Nên kiểm soát khẩu phần và tăng vận động.' : 'Nên có kế hoạch giảm cân an toàn cùng PT.';
    return { value, category, advice };
  })();

  const saveHealth = async () => {
    setSavingHealth(true);
    try {
      const res = await api.patch('/members/me/health', { chieu_cao_cm: heightCm || null, can_nang_kg: weightKg || null });
      if (res.data?.success) {
        Alert.alert('Thành công', 'Đã cập nhật BMI.');
        fetchProfile();
      }
    } catch (err) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể cập nhật BMI.');
    } finally {
      setSavingHealth(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const onRefresh = () => { setRefreshing(true); fetchProfile(); };

  const activePlan = profile?.goi_tap?.find(p => p.trang_thai === 'dang_hoat_dong') || null;
  const choKichHoatPlan = profile?.goi_tap?.find(p => p.trang_thai === 'cho_kich_hoat') || null;
  const activePT = profile?.dang_ky_pt?.[0] || null;
  const ptRemaining = activePT ? Math.max(0, (activePT.so_buoi_dang_ky || 0) - (activePT.so_buoi_da_tap || 0)) : null;
  const diaChiParts = [profile?.dia_chi_tam_tru, profile?.phuong_xa, profile?.quan_huyen, profile?.tinh_thanh].filter(Boolean);
  const diaChi = diaChiParts.join(', ') || '—';

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
        onSaved={fetchProfile}
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
                  <Star color="#ffffff" size={10} strokeWidth={2.5} fill="#ffffff" />
                </View>
              </TouchableOpacity>

              <Text style={[styles.profileName, { color: colors.text }]}>
                {profile?.ho_ten || user?.name || 'Hội viên'}
              </Text>
              <View style={[styles.profilePhoneRow, { backgroundColor: BRAND.primaryDark }]}>
                <Phone color="rgba(255,255,255,0.7)" size={12} strokeWidth={2} />
                <Text style={styles.profilePhone}>{profile?.so_dien_thoai || '—'}</Text>
              </View>

              <View style={styles.profileBadgeRow}>
                <View style={[styles.profileBadge, { backgroundColor: colors.primaryLight }]}>
                  <UserCheck color={colors.primary} size={11} strokeWidth={2.5} />
                  <Text style={[styles.profileBadgeText, { color: colors.primary }]}>
                    {memberTypeLabel(profile?.loai_hv)}
                  </Text>
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
                  <CreditCard color={colors.primary} size={16} strokeWidth={2} />
                  <Text style={[styles.quickStatVal, { color: colors.text }]}>
                    {activePlan ? activePlan.ten_goi : (choKichHoatPlan ? choKichHoatPlan.ten_goi : 'Chưa có')}
                  </Text>
                  <Text style={[styles.quickStatLabel, { color: colors.textMuted }]}>Gói tập</Text>
                </View>
                <View style={[styles.quickStatDivider, { backgroundColor: colors.border }]} />
                <View style={styles.quickStat}>
                  <Calendar color={colors.primary} size={16} strokeWidth={2} />
                  <Text style={[styles.quickStatVal, { color: colors.text }]}>
                    {activePlan ? formatDate(activePlan.den_ngay) : (choKichHoatPlan ? formatDate(choKichHoatPlan.den_ngay) : '—')}
                  </Text>
                  <Text style={[styles.quickStatLabel, { color: colors.textMuted }]}>Hết hạn</Text>
                </View>
                <View style={[styles.quickStatDivider, { backgroundColor: colors.border }]} />
                <View style={styles.quickStat}>
                  <Dumbbell color={colors.primary} size={16} strokeWidth={2} />
                  <Text style={[styles.quickStatVal, { color: colors.text }]}>
                    {ptRemaining != null ? `${ptRemaining}` : '—'}
                  </Text>
                  <Text style={[styles.quickStatLabel, { color: colors.textMuted }]}>Buổi PT</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <Section 
          title="Thông tin định danh" 
          colors={colors}
          extraHeader={
            <TouchableOpacity onPress={() => setShowEditProfile(true)}>
              <Text style={{ fontSize: 11, color: BRAND.primary, fontWeight: '700' }}>Sửa thông tin</Text>
            </TouchableOpacity>
          }
        >
          <MenuRow icon={User} label="Họ và tên" sublabel={profile?.ho_ten || '—'} onPress={null} colors={colors} />
          <MenuRow icon={Calendar} label="Ngày sinh" sublabel={formatDate(profile?.ngay_sinh) || '—'} onPress={null} colors={colors} />
          <MenuRow icon={User} label="Giới tính" sublabel={genderLabel(profile?.gioi_tinh)} onPress={null} colors={colors} />
          <MenuRow icon={Badge} label="CCCD / CMND" sublabel={profile?.cccd || '—'} onPress={null} colors={colors} />
          <MenuRow icon={Building2} label="Địa chỉ" sublabel={diaChi} onPress={null} colors={colors} />
          <MenuRow icon={Building2} label="Chi nhánh" sublabel={profile?.chi_nhanh || '—'} onPress={null} colors={colors} />
        </Section>

        {/* ── CÀI ĐẶT ──────────────────────────── */}
        <Section title="Chỉ số BMI" colors={colors}>
          <View style={styles.bmiBox}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bmiValue, { color: colors.primary }]}>{bmi ? bmi.value.toFixed(1) : '—'}</Text>
              <Text style={[styles.bmiCategory, { color: colors.text }]}>{bmi ? bmi.category : 'Chưa có dữ liệu'}</Text>
              <Text style={[styles.bmiAdvice, { color: colors.textMuted }]}>{bmi ? bmi.advice : 'Nhập chiều cao và cân nặng để tính BMI theo chuẩn châu Á.'}</Text>
            </View>
          </View>
          <View style={styles.bmiInputs}>
            <TextInput style={[styles.bmiInput, { color: colors.text, borderColor: colors.border }]} placeholder="Chiều cao cm" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={heightCm} onChangeText={setHeightCm} />
            <TextInput style={[styles.bmiInput, { color: colors.text, borderColor: colors.border }]} placeholder="Cân nặng kg" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={weightKg} onChangeText={setWeightKg} />
          </View>
          <TouchableOpacity style={[styles.bmiBtn, { backgroundColor: colors.primary }]} onPress={saveHealth} disabled={savingHealth}>
            {savingHealth ? <ActivityIndicator color="#fff" /> : <Text style={styles.bmiBtnText}>Lưu BMI</Text>}
          </TouchableOpacity>
        </Section>

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
  bmiBox: { paddingVertical: 14, paddingHorizontal: 4 },
  bmiValue: { fontSize: 34, fontWeight: '900' },
  bmiCategory: { fontSize: 15, fontWeight: '800', marginTop: 2 },
  bmiAdvice: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  bmiInputs: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  bmiInput: { flex: 1, height: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  bmiBtn: { height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  bmiBtnText: { color: '#fff', fontWeight: '900' },

  quickStats: {
    flexDirection: 'row',
    marginTop: 14,
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
  },
  quickStat: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3 },
  quickStatDivider: { width: 1 },
  quickStatVal: { fontSize: 11, fontWeight: '800', textAlign: 'center' },
  quickStatLabel: { fontSize: 9, fontWeight: '500' },
});
