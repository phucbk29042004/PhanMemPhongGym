import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Building2,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Moon,
  Phone,
  Shield,
  Sun,
  User,
  X,
  Edit2,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import ProfileAvatar from '../../components/ProfileAvatar';
import EditProfileModal from '../../components/EditProfileModal';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

function MenuRow({ icon: Icon, iconBg, iconColor, label, sublabel, onPress, rightEl, danger, colors }) {
  const defaultDangerLight = '#fef2f2';
  const defaultDanger = '#dc2626';
  const defaultBorder = '#f0f4f0';
  const defaultText = '#141c14';
  const defaultMuted = '#9cad9c';

  const borderBottomColor = danger
    ? colors?.dangerLight || defaultDangerLight
    : colors?.borderLight || defaultBorder;

  const bg = iconBg || (danger ? colors?.dangerLight || defaultDangerLight : colors?.primaryLight);
  const color = iconColor || (danger ? colors?.danger || defaultDanger : colors?.primary);
  const labelColor = danger ? colors?.danger || defaultDanger : colors?.text || defaultText;
  const sublabelColor = colors?.textMuted || defaultMuted;

  return (
    <TouchableOpacity
      style={[menuStyles.row, { borderBottomColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[menuStyles.iconBox, { backgroundColor: bg }]}>
        <Icon color={color} size={18} strokeWidth={2} />
      </View>
      <View style={menuStyles.labelBox}>
        <Text style={[menuStyles.label, { color: labelColor }]}>{label}</Text>
        {sublabel ? (
          <Text style={[menuStyles.sublabel, { color: sublabelColor }]} numberOfLines={1}>
            {sublabel}
          </Text>
        ) : null}
      </View>
      {rightEl !== undefined ? (
        rightEl
      ) : (
        <ChevronRight color={danger ? colors?.danger || defaultDanger : colors?.textMuted || defaultMuted} size={18} strokeWidth={2} />
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
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  labelBox: { flex: 1 },
  label: { fontSize: 14, fontWeight: '700' },
  sublabel: { fontSize: 11, marginTop: 1 },
});

function Section({ title, children, colors }) {
  return (
    <View style={secStyles.wrapper}>
      {title ? (
        <Text style={[secStyles.title, { color: colors?.textMuted || '#9cad9c' }]}>{title}</Text>
      ) : null}
      <View style={[secStyles.card, { backgroundColor: colors?.surface || '#ffffff' }]}>
        {children}
      </View>
    </View>
  );
}

const secStyles = StyleSheet.create({
  wrapper: { marginHorizontal: 16, marginBottom: 14 },
  title: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingLeft: 4,
  },
  card: {
    borderRadius: 18,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
});

// ── Modal đổi mật khẩu ────────────────────────────────────
function ChangePasswordModal({ visible, onClose, colors }) {
  const [matKhauCu, setMatKhauCu] = useState('');
  const [matKhauMoi, setMatKhauMoi] = useState('');
  const [xacNhan, setXacNhan] = useState('');
  const [showCu, setShowCu] = useState(false);
  const [showMoi, setShowMoi] = useState(false);
  const [showXn, setShowXn] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setMatKhauCu('');
    setMatKhauMoi('');
    setXacNhan('');
    setShowCu(false);
    setShowMoi(false);
    setShowXn(false);
  };
  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!matKhauCu) return Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu hiện tại.');
    if (!matKhauMoi || matKhauMoi.length < 6)
      return Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
    if (matKhauMoi !== xacNhan) return Alert.alert('Lỗi', 'Xác nhận mật khẩu không khớp.');
    setSaving(true);
    try {
      const res = await api.post('/auth/doi-mat-khau', {
        mat_khau_cu: matKhauCu,
        mat_khau_moi: matKhauMoi,
      });
      if (res.data?.success) {
        Alert.alert('Thành công', 'Đã cập nhật mật khẩu.', [{ text: 'OK', onPress: handleClose }]);
      } else {
        Alert.alert('Lỗi', res.data?.message || 'Không thể đổi mật khẩu.');
      }
    } catch (err) {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể kết nối máy chủ.');
    } finally {
      setSaving(false);
    }
  };

  const C = colors || {};
  const primaryColor = C.primary || '#1D9336';
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={pwStyles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[pwStyles.sheet, { backgroundColor: C.surface || '#ffffff' }]}>
          <View style={pwStyles.header}>
            <Text style={[pwStyles.headerTitle, { color: C.text || '#141c14' }]}>Đổi mật khẩu</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X color={C.textMuted || '#9cad9c'} size={22} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          {[
            {
              label: 'Mật khẩu hiện tại',
              val: matKhauCu,
              set: setMatKhauCu,
              show: showCu,
              toggleShow: () => setShowCu((p) => !p),
            },
            {
              label: 'Mật khẩu mới',
              val: matKhauMoi,
              set: setMatKhauMoi,
              show: showMoi,
              toggleShow: () => setShowMoi((p) => !p),
            },
            {
              label: 'Xác nhận mật khẩu mới',
              val: xacNhan,
              set: setXacNhan,
              show: showXn,
              toggleShow: () => setShowXn((p) => !p),
            },
          ].map(({ label, val, set, show, toggleShow }) => (
            <View key={label} style={pwStyles.fieldWrap}>
              <Text style={[pwStyles.fieldLabel, { color: C.textSecondary || '#6b7c6b' }]}>
                {label}
              </Text>
              <View
                style={[
                  pwStyles.inputRow,
                  {
                    backgroundColor: C.surfaceVariant || '#f0f4f0',
                    borderColor: C.border || '#e4ebe4',
                  },
                ]}
              >
                <TextInput
                  style={[pwStyles.input, { color: C.text || '#141c14' }]}
                  value={val}
                  onChangeText={set}
                  secureTextEntry={!show}
                  placeholder="••••••••"
                  placeholderTextColor={C.textMuted || '#9cad9c'}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={toggleShow} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  {show ? (
                    <EyeOff color={C.textMuted || '#9cad9c'} size={18} strokeWidth={2} />
                  ) : (
                    <Eye color={C.textMuted || '#9cad9c'} size={18} strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={pwStyles.btnRow}>
            <TouchableOpacity
              style={[pwStyles.btnCancel, { borderColor: C.border || '#e4ebe4' }]}
              onPress={handleClose}
            >
              <Text style={[pwStyles.btnCancelText, { color: C.textSecondary || '#6b7c6b' }]}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pwStyles.btnSave, { backgroundColor: primaryColor, opacity: saving ? 0.7 : 1 }]}
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
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 48 },
  input: { flex: 1, fontSize: 15, height: 48 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnCancel: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btnCancelText: { fontSize: 14, fontWeight: '700' },
  btnSave: { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnSaveText: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
});

// ── Màn hình chính ────────────────────────────────────────
export default function AdminProfileScreen({ navigation }) {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme, colors } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success) setProfile(res.data.data);
    } catch (err) {
      console.error('[AdminProfile] fetch error:', err?.message);
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const displayName = profile?.ho_ten || profile?.ten_dang_nhap || user?.name || 'Admin';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      <ChangePasswordModal visible={showChangePw} onClose={() => setShowChangePw(false)} colors={colors} />

      <EditProfileModal
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        profile={profile}
        onSaved={fetchProfile}
        colors={colors}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Profile Header ── */}
        <View style={styles.profileHeader}>
          <View style={[styles.profileHeaderBg, { backgroundColor: colors.primaryDark }]} />
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#ffffff" />
            </View>
          ) : (
            <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
              {/* Edit Icon on Card */}
              <TouchableOpacity
                style={[styles.editIconBtn, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => setShowEditProfile(true)}
                activeOpacity={0.8}
              >
                <Edit2 color={colors.primary} size={16} strokeWidth={2.5} />
              </TouchableOpacity>

              <View style={styles.avatarWrapper}>
                <ProfileAvatar uri={profile?.avatar_url} name={displayName} size={72} />
                <View
                  style={[
                    styles.avatarBadge,
                    { backgroundColor: colors.primary, borderColor: colors.surface },
                  ]}
                >
                  <Shield color="#ffffff" size={10} strokeWidth={2.5} fill="#ffffff" />
                </View>
              </View>
              <Text style={[styles.profileName, { color: colors.text }]}>{displayName}</Text>
              <View style={[styles.roleBadge, { backgroundColor: colors.primaryLight }]}>
                <Shield color={colors.primary} size={12} strokeWidth={2.5} />
                <Text style={[styles.roleBadgeText, { color: colors.primary }]}>Quản trị viên</Text>
              </View>

              <View style={[styles.quickStats, { backgroundColor: colors.surfaceVariant }]}>
                <View style={styles.quickStat}>
                  <User color={colors.primary} size={16} strokeWidth={2} />
                  <Text style={[styles.quickStatVal, { color: colors.text }]}>
                    {profile?.ten_dang_nhap || '—'}
                  </Text>
                  <Text style={[styles.quickStatLabel, { color: colors.textMuted }]}>
                    Tên đăng nhập
                  </Text>
                </View>
                {profile?.so_dien_thoai && (
                  <>
                    <View style={[styles.quickStatDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.quickStat}>
                      <Phone color={colors.primary} size={16} strokeWidth={2} />
                      <Text style={[styles.quickStatVal, { color: colors.text }]}>
                        {profile.so_dien_thoai}
                      </Text>
                      <Text style={[styles.quickStatLabel, { color: colors.textMuted }]}>SĐT</Text>
                    </View>
                  </>
                )}
                {profile?.chi_nhanh && (
                  <>
                    <View style={[styles.quickStatDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.quickStat}>
                      <Building2 color={colors.primary} size={16} strokeWidth={2} />
                      <Text
                        style={[styles.quickStatVal, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {profile.chi_nhanh}
                      </Text>
                      <Text style={[styles.quickStatLabel, { color: colors.textMuted }]}>
                        Chi nhánh
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          )}
        </View>

        {/* ── Cài đặt ── */}
        <Section title="Cài đặt" colors={colors}>
          <MenuRow
            icon={User}
            iconBg={colors.primaryLight}
            iconColor={colors.primary}
            label="Chỉnh sửa thông tin"
            sublabel="Họ tên, SĐT, Email, Giới tính..."
            onPress={() => setShowEditProfile(true)}
            colors={colors}
          />
          <MenuRow
            icon={Building2}
            iconBg={colors.primaryLight}
            iconColor={colors.primary}
            label="Nội quy phòng tập"
            sublabel="Xem quy định & nội quy phòng tập"
            onPress={() => navigation.navigate('GymRules')}
            colors={colors}
          />
          <MenuRow
            icon={KeyRound}
            iconBg={colors.primaryLight}
            iconColor={colors.primary}
            label="Đổi mật khẩu"
            sublabel="Cập nhật mật khẩu đăng nhập"
            onPress={() => setShowChangePw(true)}
            colors={colors}
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
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={isDark ? colors.primary : '#ffffff'}
                ios_backgroundColor={colors.border}
              />
            }
          />
        </Section>

        {/* ── Đăng xuất ── */}
        <Section colors={colors}>
          <MenuRow
            icon={LogOut}
            iconBg={colors.dangerLight || '#fef2f2'}
            iconColor={colors.danger || '#dc2626'}
            label="Đăng xuất"
            danger
            onPress={() => logout?.()}
            rightEl={null}
            colors={colors}
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
  profileHeaderBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 130 },
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
    position: 'relative',
  },
  editIconBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  profileName: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
  },
  roleBadgeText: { fontSize: 12, fontWeight: '800' },
  quickStats: { flexDirection: 'row', borderRadius: 14, overflow: 'hidden', width: '100%' },
  quickStat: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3, paddingHorizontal: 4 },
  quickStatDivider: { width: 1 },
  quickStatVal: { fontSize: 11, fontWeight: '800', textAlign: 'center' },
  quickStatLabel: { fontSize: 9, fontWeight: '500' },
});
