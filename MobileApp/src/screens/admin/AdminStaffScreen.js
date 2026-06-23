import React, { useCallback, useState, useEffect } from 'react';
import {
  ActivityIndicator, RefreshControl,
  StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View, Platform, ScrollView, Alert, Modal,
} from 'react-native';
import {
  AlertCircle, CheckCircle2, Lock, Unlock, Search, User, Shield, X, Plus, Edit2, Trash2,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/useAuthStore';
import SwipePager from '../../components/SwipePager';

// ── Avatar chữ cái ────────────────────────────────────────
function Avatar({ name, size = 44 }) {
  const safeName = name || '?';
  const initials = safeName.split(' ').slice(-2).map(w => w[0] || '').join('').toUpperCase().slice(0, 2);
  const colorsList = ['#4f46e5', '#0891b2', '#0d9488', '#ea580c', '#e11d48'];
  const charCode = safeName.charCodeAt(0) || 0;
  const color = colorsList[charCode % colorsList.length];
  return (
    <View style={[av.box, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '22' }]}>
      <Text style={[av.text, { color, fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
}
const av = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '800' },
});

// ── Staff Card ──────────────────────────────────────────
function StaffCard({ item, colors, onToggleLock, onEdit, onDelete, onPress, showActions }) {
  const isLocked = item.tk_trang_thai === 'khoa';
  const roleColor = '#0d9488';
  const roleBg = '#ccfbf1';

  return (
    <TouchableOpacity
      style={[card.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Avatar name={item.ho_ten} />
      <View style={card.info}>
        <View style={card.nameRow}>
          <Text style={[card.name, { color: colors.text }]} numberOfLines={1}>{item.ho_ten}</Text>
          <View style={[card.roleBadge, { backgroundColor: roleBg }]}>
            <Text style={[card.roleText, { color: roleColor }]}>Nhân viên</Text>
          </View>
        </View>
        <Text style={[card.sub, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.ma_ho_so} • {item.so_dien_thoai || '—'} • {item.chi_nhanh || '—'}
        </Text>
        <Text style={[card.email, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.email || 'Không có email'}
        </Text>
      </View>
      {showActions && (
        <View style={card.actions}>
          <TouchableOpacity
            style={[card.actionBtn, { backgroundColor: colors.primaryLight }]}
            onPress={onEdit}
          >
            <Edit2 color={colors.primary} size={15} strokeWidth={2.5} />
          </TouchableOpacity>
          {item.ten_dang_nhap ? (
            <TouchableOpacity
              style={[card.actionBtn, { backgroundColor: isLocked ? colors.dangerLight : colors.borderLight }]}
              onPress={() => onToggleLock(item)}
            >
              {isLocked
                ? <Lock color={colors.danger} size={15} strokeWidth={2.5} />
                : <Unlock color={colors.textSecondary} size={15} strokeWidth={2.5} />
              }
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[card.actionBtn, { backgroundColor: colors.dangerLight }]}
            onPress={onDelete}
          >
            <Trash2 color={colors.danger} size={15} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const card = StyleSheet.create({
  wrap: {
    borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 8,
    borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 6, elevation: 1,
  },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  name: { fontSize: 14, fontWeight: '700', maxWidth: '65%' },
  roleBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  roleText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  sub: { fontSize: 11, marginBottom: 2 },
  email: { fontSize: 11, fontStyle: 'italic' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  }
});

// ── Account Card & Config ─────────────────────────────────
const ACC_ROLE_FILTERS = [
  { key: 'all', label: 'Tất cả vai trò' },
  { key: 'admin', label: 'Quản trị viên' },
  { key: 'nhan_vien', label: 'Nhân viên' },
  { key: 'pt', label: 'PT' },
  { key: 'hoi_vien', label: 'Hội viên' },
];

const ACC_STATUS_FILTERS = [
  { key: 'all', label: 'Tất cả trạng thái' },
  { key: 'hoat_dong', label: 'Hoạt động' },
  { key: 'khoa', label: 'Bị khóa' },
];

function AccountCard({ item, colors, onEdit, onDelete, currentUserId }) {
  const isLocked = item.trang_thai === 'khoa';
  const roleColors = {
    admin: { bg: '#fee2e2', text: '#ef4444' },
    chu_phong_gym: { bg: '#ffedd5', text: '#f97316' },
    nhan_vien: { bg: '#e0f2fe', text: '#0284c7' },
    pt: { bg: '#ccfbf1', text: '#0d9488' },
    hoi_vien: { bg: '#f3f4f6', text: '#4b5563' }
  };
  const roleStyle = roleColors[item.ma_vai_tro] || { bg: '#f3f4f6', text: '#4b5563' };

  return (
    <View style={[card.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Avatar name={item.ho_ten || item.ten_dang_nhap} />
      <View style={card.info}>
        <View style={card.nameRow}>
          <Text style={[card.name, { color: colors.text }]} numberOfLines={1}>{item.ten_dang_nhap}</Text>
          <View style={[card.roleBadge, { backgroundColor: roleStyle.bg }]}>
            <Text style={[card.roleText, { color: roleStyle.text }]}>{item.ten_vai_tro || item.ma_vai_tro}</Text>
          </View>
        </View>
        <Text style={[card.sub, { color: colors.textSecondary }]} numberOfLines={1}>
          Hồ sơ: {item.ho_ten || 'Chưa liên kết'} {item.ma_ho_so ? `(${item.ma_ho_so})` : ''}
        </Text>
        <Text style={[card.email, { color: isLocked ? colors.danger : colors.success }]} numberOfLines={1}>
          Trạng thái: {isLocked ? 'Bị khóa' : 'Hoạt động'}
        </Text>
      </View>
      <View style={card.actions}>
        <TouchableOpacity
          style={[card.actionBtn, { backgroundColor: colors.primaryLight }]}
          onPress={onEdit}
        >
          <Edit2 color={colors.primary} size={15} strokeWidth={2.5} />
        </TouchableOpacity>
        {item.id !== currentUserId && (
          <TouchableOpacity
            style={[card.actionBtn, { backgroundColor: colors.dangerLight }]}
            onPress={onDelete}
          >
            <Trash2 color={colors.danger} size={15} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const GENDER_FILTERS = [
  { key: 'all', label: 'Tất cả giới tính' },
  { key: 'Nam', label: 'Nam' },
  { key: 'Nu', label: 'Nữ' },
  { key: 'Khac', label: 'Khác' },
];

const STATUS_FILTERS = [
  { key: 'all', label: 'Tất cả trạng thái' },
  { key: 'hoat_dong', label: 'Hoạt động' },
  { key: 'khoa', label: 'Bị khóa' },
];

export default function AdminStaffScreen({ navigation }) {
  const { colors } = useTheme();
  const { user, selectedBranch, setSelectedBranch } = useAuthStore();
  const isStaffWithBranch = user?.chi_nhanh && user?.vai_tro !== 'admin' && user?.vai_tro !== 'chu_phong_gym';
  const [branches, setBranches] = useState([]);
  const insets = useSafeAreaInsets();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [swipePage, setSwipePage] = useState(0);
  const PAGE_SIZE = 10;

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState('staff'); // 'staff' | 'accounts'

  // ── Accounts states ──
  const [accountsList, setAccountsList] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accSearch, setAccSearch] = useState('');
  const [accRoleFilter, setAccRoleFilter] = useState('all');
  const [accStatusFilter, setAccStatusFilter] = useState('all');
  const [swipePageAcc, setSwipePageAcc] = useState(0);

  // ── Edit account modal states ──
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('nhan_vien');
  const [editStatus, setEditStatus] = useState('hoat_dong');

  const fetchBranches = useCallback(async () => {
    try {
      const res = await api.get('/branches');
      if (res.data?.success) setBranches(res.data.data || []);
    } catch (err) {
      console.error('[AdminStaff] fetch branches error:', err?.message);
    }
  }, []);

  const fetchStaff = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      let url = `/staff?page=1&limit=200`;
      if (selectedBranch) url += `&chi_nhanh=${encodeURIComponent(selectedBranch)}`;
      const res = await api.get(url);
      if (res.data?.success) {
        const payload = res.data.data;
        const items = Array.isArray(payload) ? payload : (payload?.data || []);
        setStaffList(items);
      }
    } catch (err) {
      console.error('[AdminStaff] fetch error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedBranch]);

  const fetchAccounts = useCallback(async (isRefresh = false) => {
    if (!(user?.vai_tro === 'admin' || user?.vai_tro === 'chu_phong_gym')) return;
    if (isRefresh) setRefreshing(true);
    else setAccountsLoading(true);

    try {
      let url = `/staff/accounts?search=${encodeURIComponent(accSearch)}`;
      if (accRoleFilter !== 'all') url += `&vai_tro=${accRoleFilter}`;
      if (accStatusFilter !== 'all') url += `&trang_thai=${accStatusFilter}`;
      if (selectedBranch) url += `&chi_nhanh=${encodeURIComponent(selectedBranch)}`;
      const res = await api.get(url);
      if (res.data?.success) {
        setAccountsList(res.data.data || []);
      }
    } catch (err) {
      console.error('[AdminStaff] fetch accounts error:', err?.message);
    } finally {
      setAccountsLoading(false);
      setRefreshing(false);
    }
  }, [accSearch, accRoleFilter, accStatusFilter, user, selectedBranch]);

  useFocusEffect(useCallback(() => {
    fetchBranches();
    if (activeTab === 'accounts') {
      fetchAccounts();
    } else {
      fetchStaff();
    }
  }, [fetchBranches, fetchStaff, fetchAccounts, activeTab]));

  const onRefresh = () => {
    fetchBranches();
    if (activeTab === 'accounts') {
      fetchAccounts(true);
    } else {
      fetchStaff(true);
    }
  };

  useEffect(() => {
    setSwipePage(0);
  }, [search, genderFilter, statusFilter, selectedBranch]);

  useEffect(() => {
    setSwipePageAcc(0);
  }, [accSearch, accRoleFilter, accStatusFilter]);

  // Fetch khi thay đổi các filter
  useEffect(() => {
    if (activeTab === 'accounts') {
      fetchAccounts();
    } else {
      fetchStaff();
    }
  }, [activeTab, selectedBranch, search, genderFilter, statusFilter, accSearch, accRoleFilter, accStatusFilter, fetchStaff, fetchAccounts]);

  const handleToggleLock = (staff) => {
    const isLocked = staff.tk_trang_thai === 'khoa';
    const actionText = isLocked ? 'mở khóa' : 'khóa';
    Alert.alert(
      'Thay đổi trạng thái tài khoản',
      `Bạn có chắc chắn muốn ${actionText} tài khoản của nhân viên "${staff.ho_ten}" không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          onPress: async () => {
            try {
              const res = await api.put(`/staff/${staff.id}`, {
                trang_thai: isLocked ? 'hoat_dong' : 'khoa'
              });
              if (res.data?.success) {
                Alert.alert('Thành công', `Đã ${actionText} tài khoản nhân viên.`);
                fetchStaff();
              } else {
                Alert.alert('Thất bại', res.data?.message || 'Có lỗi xảy ra.');
              }
            } catch (err) {
              Alert.alert('Lỗi', err.displayMessage || err?.response?.data?.message || 'Có lỗi xảy ra.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteStaff = (staff) => {
    Alert.alert(
      'Xóa hồ sơ nhân viên',
      `Bạn có chắc chắn muốn xóa hồ sơ nhân viên "${staff.ho_ten}" không? Thao tác này sẽ khóa tài khoản đi kèm nếu có.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(`/staff/${staff.id}`);
              if (res.data?.success) {
                Alert.alert('Thành công', 'Đã xóa hồ sơ nhân viên thành công.');
                fetchStaff();
              } else {
                Alert.alert('Thất bại', res.data?.message || 'Có lỗi xảy ra.');
              }
            } catch (err) {
              Alert.alert('Lỗi', err.displayMessage || err?.response?.data?.message || 'Có lỗi xảy ra.');
            }
          }
        }
      ]
    );
  };

  const openEditModal = (account) => {
    setEditingAccount(account);
    setEditUsername(account.ten_dang_nhap);
    setEditPassword('');
    setEditRole(account.ma_vai_tro);
    setEditStatus(account.trang_thai || 'hoat_dong');
    setEditModalVisible(true);
  };

  const handleUpdateAccount = async () => {
    if (!editUsername.trim()) {
      Alert.alert('Lỗi', 'Tên đăng nhập không được để trống.');
      return;
    }
    try {
      const payload = {
        ten_dang_nhap: editUsername.trim(),
        vai_tro: editRole,
        trang_thai: editStatus
      };
      if (editPassword.trim()) {
        payload.mat_khau = editPassword.trim();
      }
      const res = await api.put(`/staff/accounts/${editingAccount.id}`, payload);
      if (res.data?.success) {
        Alert.alert('Thành công', 'Cập nhật tài khoản thành công.');
        setEditModalVisible(false);
        if (activeTab === 'accounts') fetchAccounts();
        else fetchStaff();
      } else {
        Alert.alert('Thất bại', res.data?.message || 'Có lỗi xảy ra.');
      }
    } catch (err) {
      Alert.alert('Lỗi', err.displayMessage || err?.response?.data?.message || 'Có lỗi xảy ra.');
    }
  };

  const handleDeleteAccount = (account) => {
    if (account.id === user?.id) {
      Alert.alert('Cảnh báo', 'Bạn không thể tự xóa tài khoản của chính mình!');
      return;
    }
    Alert.alert(
      'Xóa tài khoản hệ thống',
      `Bạn có chắc chắn muốn xóa tài khoản "${account.ten_dang_nhap}" không? Thao tác này sẽ gỡ bỏ tài khoản khỏi hồ sơ liên kết.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(`/staff/accounts/${account.id}`);
              if (res.data?.success) {
                Alert.alert('Thành công', 'Đã xóa tài khoản thành công.');
                fetchAccounts();
              } else {
                Alert.alert('Thất bại', res.data?.message || 'Có lỗi xảy ra.');
              }
            } catch (err) {
              Alert.alert('Lỗi', err.displayMessage || err?.response?.data?.message || 'Có lỗi xảy ra.');
            }
          }
        }
      ]
    );
  };

  const filteredStaff = staffList.filter(s => {
    const q = search.toLowerCase().trim();
    if (q && !s.ho_ten?.toLowerCase().includes(q) && !s.so_dien_thoai?.includes(q) && !s.ma_ho_so?.toLowerCase().includes(q)) return false;
    if (genderFilter !== 'all' && s.gioi_tinh !== genderFilter) return false;
    if (statusFilter !== 'all' && s.tk_trang_thai !== statusFilter) return false;
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primaryDark, paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.headerTitle}>
            {activeTab === 'staff' ? 'Nhân viên' : 'Tài khoản'}
          </Text>
          <Text style={styles.headerSub}>
            {activeTab === 'staff'
              ? `${filteredStaff.length} / ${staffList.length} nhân viên`
              : `${accountsList.length} tài khoản hệ thống`
            }
          </Text>
        </View>
        <View style={styles.headerActions}>
          {activeTab === 'staff' && (user?.vai_tro === 'admin' || user?.vai_tro === 'chu_phong_gym') && (
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              onPress={() => {
                navigation.navigate('AdminAddEditMember', { defaultRole: 'nhan_vien' });
              }}
            >
              <Plus color="#ffffff" size={20} />
            </TouchableOpacity>
          )}
          <View style={styles.headerBadge}>
            <Shield color="#ffffff" size={18} strokeWidth={2} />
          </View>
        </View>
      </View>

      {/* ── Tab Bar (chỉ hiện với admin & chu_phong_gym) ── */}
      {(user?.vai_tro === 'admin' || user?.vai_tro === 'chu_phong_gym') && (
        <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'staff' && [styles.tabActiveBtn, { borderBottomColor: colors.primary }]]}
            onPress={() => setActiveTab('staff')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'staff' ? colors.primary : colors.textSecondary }]}>
              Nhân sự
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'accounts' && [styles.tabActiveBtn, { borderBottomColor: colors.primary }]]}
            onPress={() => setActiveTab('accounts')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'accounts' ? colors.primary : colors.textSecondary }]}>
              Tài khoản hệ thống
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Bộ lọc chi nhánh (chỉ hiện ở tab nhân sự & ẩn với nhân viên có chi nhánh cố định) ── */}
      {activeTab === 'staff' && !isStaffWithBranch && (
        <View style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 8 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            <TouchableOpacity
              style={[
                { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
                { backgroundColor: selectedBranch === '' ? colors.primary : colors.surfaceVariant }
              ]}
              onPress={() => setSelectedBranch('')}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: selectedBranch === '' ? '#fff' : colors.textSecondary }}>
                Tất cả chi nhánh
              </Text>
            </TouchableOpacity>
            {branches.map((b) => {
              const isSelected = selectedBranch === b.ten;
              return (
                <TouchableOpacity
                  key={b.id || b.ten}
                  style={[
                    { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
                    { backgroundColor: isSelected ? colors.primary : colors.surfaceVariant }
                  ]}
                  onPress={() => setSelectedBranch(b.ten)}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: isSelected ? '#fff' : colors.textSecondary }}>
                    {b.ten}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search color={colors.textMuted} size={16} strokeWidth={2} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={activeTab === 'staff' ? 'Tìm tên, SĐT, mã nhân viên…' : 'Tìm tên đăng nhập, họ tên, mã…'}
            placeholderTextColor={colors.textMuted}
            value={activeTab === 'staff' ? search : accSearch}
            onChangeText={activeTab === 'staff' ? setSearch : setAccSearch}
            returnKeyType="search"
          />
          {(activeTab === 'staff' ? search : accSearch) ? (
            <TouchableOpacity
              onPress={() => activeTab === 'staff' ? setSearch('') : setAccSearch('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X color={colors.textMuted} size={14} strokeWidth={2} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {activeTab === 'staff' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4, alignItems: 'center' }}>
            {/* Gender Filters */}
            {GENDER_FILTERS.map(f => (
              <TouchableOpacity
                key={'gender-' + f.key}
                style={[
                  styles.chip,
                  { backgroundColor: genderFilter === f.key ? colors.primary : colors.surface, borderColor: genderFilter === f.key ? colors.primary : colors.border }
                ]}
                onPress={() => setGenderFilter(f.key)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: genderFilter === f.key ? '#ffffff' : colors.textSecondary }}>{f.label}</Text>
              </TouchableOpacity>
            ))}
            <View style={{ width: 1, height: 16, backgroundColor: colors.border, marginHorizontal: 8 }} />
            {/* Status Filters */}
            {STATUS_FILTERS.map(f => (
              <TouchableOpacity
                key={'status-' + f.key}
                style={[
                  styles.chip,
                  { backgroundColor: statusFilter === f.key ? colors.primary : colors.surface, borderColor: statusFilter === f.key ? colors.primary : colors.border }
                ]}
                onPress={() => setStatusFilter(f.key)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: statusFilter === f.key ? '#ffffff' : colors.textSecondary }}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4, alignItems: 'center' }}>
            {/* Accounts Role Filters */}
            {ACC_ROLE_FILTERS.map(f => (
              <TouchableOpacity
                key={'acc-role-' + f.key}
                style={[
                  styles.chip,
                  { backgroundColor: accRoleFilter === f.key ? colors.primary : colors.surface, borderColor: accRoleFilter === f.key ? colors.primary : colors.border }
                ]}
                onPress={() => setAccRoleFilter(f.key)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: accRoleFilter === f.key ? '#ffffff' : colors.textSecondary }}>{f.label}</Text>
              </TouchableOpacity>
            ))}
            <View style={{ width: 1, height: 16, backgroundColor: colors.border, marginHorizontal: 8 }} />
            {/* Accounts Status Filters */}
            {ACC_STATUS_FILTERS.map(f => (
              <TouchableOpacity
                key={'acc-status-' + f.key}
                style={[
                  styles.chip,
                  { backgroundColor: accStatusFilter === f.key ? colors.primary : colors.surface, borderColor: accStatusFilter === f.key ? colors.primary : colors.border }
                ]}
                onPress={() => setAccStatusFilter(f.key)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: accStatusFilter === f.key ? '#ffffff' : colors.textSecondary }}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* List */}
      {activeTab === 'staff' ? (
        loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <SwipePager
            data={filteredStaff}
            pageSize={PAGE_SIZE}
            page={swipePage}
            onPageChange={setSwipePage}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <StaffCard
                item={item}
                colors={colors}
                onToggleLock={handleToggleLock}
                onEdit={() => navigation.navigate('AdminAddEditMember', { memberId: item.id })}
                onDelete={() => handleDeleteStaff(item)}
                onPress={() => navigation.navigate('AdminMemberDetail', { memberId: item.id })}
                showActions={user?.vai_tro === 'admin' || user?.vai_tro === 'chu_phong_gym'}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <User color={colors.textMuted} size={48} strokeWidth={1} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>Không tìm thấy nhân viên</Text>
              </View>
            }
            colors={colors}
          />
        )
      ) : (
        accountsLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <SwipePager
            data={accountsList}
            pageSize={PAGE_SIZE}
            page={swipePageAcc}
            onPageChange={setSwipePageAcc}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <AccountCard
                item={item}
                colors={colors}
                onEdit={() => openEditModal(item)}
                onDelete={() => handleDeleteAccount(item)}
                currentUserId={user?.id}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <User color={colors.textMuted} size={48} strokeWidth={1} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>Không tìm thấy tài khoản</Text>
              </View>
            }
            colors={colors}
          />
        )
      )}

      {/* Modal chỉnh sửa tài khoản */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.card, { backgroundColor: colors.surface }]}>
            {/* Header */}
            <View style={[modalStyles.header, { backgroundColor: colors.primary }]}>
              <Text style={modalStyles.headerTitle}>Chỉnh sửa tài khoản</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X color="#ffffff" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={modalStyles.body}>
              {/* Tên đăng nhập */}
              <View style={modalStyles.field}>
                <Text style={[modalStyles.label, { color: colors.text }]}>Tên đăng nhập *</Text>
                <TextInput
                  style={[modalStyles.input, { color: colors.text, borderColor: colors.border }]}
                  value={editUsername}
                  onChangeText={setEditUsername}
                  autoCapitalize="none"
                />
              </View>

              {/* Mật khẩu mới */}
              <View style={modalStyles.field}>
                <Text style={[modalStyles.label, { color: colors.text }]}>Mật khẩu mới (để trống nếu giữ nguyên)</Text>
                <TextInput
                  style={[modalStyles.input, { color: colors.text, borderColor: colors.border }]}
                  value={editPassword}
                  onChangeText={setEditPassword}
                  placeholder="Nhập mật khẩu mới..."
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              {/* Vai trò */}
              <View style={modalStyles.field}>
                <Text style={[modalStyles.label, { color: colors.text }]}>Vai trò tài khoản *</Text>
                <View style={modalStyles.roleGrid}>
                  {[
                    { key: 'admin', label: 'Quản trị' },
                    { key: 'nhan_vien', label: 'Nhân viên' },
                    { key: 'pt', label: 'HLV (PT)' },
                    { key: 'hoi_vien', label: 'Hội viên' }
                  ].map(r => {
                    const isSelected = editRole === r.key;
                    return (
                      <TouchableOpacity
                        key={r.key}
                        style={[
                          modalStyles.roleBtn,
                          { borderColor: isSelected ? colors.primary : colors.border },
                          isSelected && { backgroundColor: colors.primaryLight }
                        ]}
                        onPress={() => setEditRole(r.key)}
                      >
                        <Text style={[modalStyles.roleBtnText, { color: isSelected ? colors.primary : colors.text, fontWeight: isSelected ? '700' : '500' }]}>
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Trạng thái */}
              <View style={modalStyles.field}>
                <Text style={[modalStyles.label, { color: colors.text }]}>Trạng thái *</Text>
                <View style={modalStyles.statusRow}>
                  {[
                    { key: 'hoat_dong', label: 'Hoạt động' },
                    { key: 'khoa', label: 'Bị khóa' }
                  ].map(s => {
                    const isSelected = editStatus === s.key;
                    return (
                      <TouchableOpacity
                        key={s.key}
                        style={[
                          modalStyles.statusBtn,
                          { borderColor: isSelected ? colors.primary : colors.border },
                          isSelected && { backgroundColor: isSelected ? (s.key === 'hoat_dong' ? colors.successLight : colors.dangerLight) : 'transparent' }
                        ]}
                        onPress={() => setEditStatus(s.key)}
                      >
                        <Text style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: isSelected ? (s.key === 'hoat_dong' ? colors.success : colors.danger) : colors.text
                        }}>
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={[modalStyles.footer, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[modalStyles.btnCancel, { borderColor: colors.border }]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={[modalStyles.btnCancelText, { color: colors.textSecondary }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.btnSubmit, { backgroundColor: colors.primary }]}
                onPress={handleUpdateAccount}
              >
                <Text style={modalStyles.btnSubmitText}>Cập nhật</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 20
  },
  card: {
    width: '100%', maxWidth: 400, borderRadius: 24,
    overflow: 'hidden', elevation: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2, shadowRadius: 10
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
  body: { padding: 20, gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700' },
  input: {
    height: 42, borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 12, fontSize: 14
  },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleBtn: {
    width: '48%', height: 38, borderWidth: 1, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center'
  },
  roleBtnText: { fontSize: 12 },
  statusRow: { flexDirection: 'row', gap: 10 },
  statusBtn: {
    flex: 1, height: 38, borderWidth: 1, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center'
  },
  footer: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 10,
    paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1
  },
  btnCancel: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1
  },
  btnCancelText: { fontSize: 14, fontWeight: '700' },
  btnSubmit: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12
  },
  btnSubmitText: { fontSize: 14, fontWeight: '700', color: '#ffffff' }
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 0, paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center'
  },
  headerBadge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  tabBar: { flexDirection: 'row', height: 48, alignItems: 'center' },
  tabBtn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActiveBtn: { borderBottomWidth: 2 },
  tabText: { fontSize: 14, fontWeight: '700' },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 12 : 6,
    shadowColor: '#000', shadowOpacity: 0.01, shadowRadius: 6, elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 10,
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, marginRight: 8,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '600' },
});
