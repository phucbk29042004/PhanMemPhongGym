import React, { useCallback, useState, useEffect } from 'react';
import {
  ActivityIndicator, RefreshControl,
  StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View, Platform, ScrollView, Alert,
} from 'react-native';
import {
  AlertCircle, CheckCircle2, Lock, Unlock, Search, User, Shield, X, Plus, Edit2,
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
function StaffCard({ item, colors, onToggleLock, onEdit, onPress, showActions }) {
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

  useFocusEffect(useCallback(() => {
    fetchBranches();
    fetchStaff();
  }, [fetchBranches, fetchStaff]));

  const onRefresh = () => { fetchBranches(); fetchStaff(true); };

  useEffect(() => { setSwipePage(0); }, [search, genderFilter, statusFilter, selectedBranch]);

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
              Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ.');
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
          <Text style={styles.headerTitle}>Nhân viên</Text>
          <Text style={styles.headerSub}>{filteredStaff.length} / {staffList.length} nhân viên</Text>
        </View>
        <View style={styles.headerActions}>
          {(user?.vai_tro === 'admin' || user?.vai_tro === 'chu_phong_gym' || user?.vai_tro === 'quan_ly') && (
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

      {/* ── Bộ lọc chi nhánh (ẩn với nhân viên có chi nhánh cố định) ── */}
      {!isStaffWithBranch && (
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
            placeholder="Tìm tên, SĐT, mã nhân viên…"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X color={colors.textMuted} size={14} strokeWidth={2} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
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
      </View>

      {/* List */}
      {loading ? (
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
              onPress={() => navigation.navigate('AdminMemberDetail', { memberId: item.id })}
              showActions={user?.vai_tro === 'admin' || user?.vai_tro === 'chu_phong_gym' || user?.vai_tro === 'quan_ly'}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 0, paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row', justifyConent: 'space-between', alignItems: 'flex-end',
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
