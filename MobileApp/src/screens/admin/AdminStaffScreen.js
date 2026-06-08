import React, { useCallback, useState, useEffect } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl,
  StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View, Platform, ScrollView, Alert,
} from 'react-native';
import {
  AlertCircle, CheckCircle2, Lock, Unlock, Search, User, Shield, X, Plus,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/useAuthStore';

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
function StaffCard({ item, colors, onToggleLock, onDelete }) {
  const isLocked = item.tk_trang_thai === 'khoa';
  const roleLabel = item.loai_ho_so === 'le_tan' ? 'Lễ tân' : 'Nhân viên';
  const roleColor = item.loai_ho_so === 'le_tan' ? '#4f46e5' : '#0d9488';
  const roleBg = item.loai_ho_so === 'le_tan' ? '#e0e7ff' : '#ccfbf1';

  return (
    <View style={[card.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Avatar name={item.ho_ten} />
      <View style={card.info}>
        <View style={card.nameRow}>
          <Text style={[card.name, { color: colors.text }]} numberOfLines={1}>{item.ho_ten}</Text>
          <View style={[card.roleBadge, { backgroundColor: roleBg }]}>
            <Text style={[card.roleText, { color: roleColor }]}>{roleLabel}</Text>
          </View>
        </View>
        <Text style={[card.sub, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.ma_ho_so} • {item.so_dien_thoai || '—'}
        </Text>
        <Text style={[card.email, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.email || 'Không có email'}
        </Text>
      </View>
      <View style={card.actions}>
        {item.ten_dang_nhap ? (
          <TouchableOpacity
            style={[card.actionBtn, { backgroundColor: isLocked ? colors.dangerLight : colors.borderLight }]}
            onPress={() => onToggleLock(item)}
            title={isLocked ? "Mở khóa" : "Khóa"}
          >
            {isLocked ? (
              <Lock color={colors.danger} size={16} strokeWidth={2.5} />
            ) : (
              <Unlock color={colors.textSecondary} size={16} strokeWidth={2.5} />
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
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

const FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'le_tan', label: 'Lễ tân' },
  { key: 'nhan_vien', label: 'Nhân viên' },
];

export default function AdminStaffScreen({ navigation }) {
  const { colors } = useTheme();
  const { selectedBranch, setSelectedBranch } = useAuthStore();
  const [branches, setBranches] = useState([]);
  const insets = useSafeAreaInsets();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const fetchBranches = useCallback(async () => {
    try {
      const res = await api.get('/branches');
      if (res.data?.success) {
        setBranches(res.data.data || []);
      }
    } catch (err) {
      console.error('[AdminStaff] fetch branches error:', err?.message);
    }
  }, []);

  const fetchStaff = useCallback(async () => {
    try {
      const q = selectedBranch ? `&chi_nhanh=${encodeURIComponent(selectedBranch)}` : '';
      const res = await api.get(`/staff?limit=200${q}`);
      if (res.data?.success) {
        const payload = res.data.data;
        setStaffList(Array.isArray(payload) ? payload : (payload?.data || payload?.staff || []));
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchBranches();
    fetchStaff();
  };

  useEffect(() => {
    setPage(1);
  }, [search, filter]);

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

  const filtered = staffList.filter(s => {
    const q = search.toLowerCase().trim();
    if (q && !s.ho_ten?.toLowerCase().includes(q) && !s.so_dien_thoai?.includes(q) && !s.ma_ho_so?.toLowerCase().includes(q)) return false;

    if (filter === 'all') return true;
    if (filter === 'le_tan') return s.loai_ho_so === 'le_tan';
    if (filter === 'nhan_vien') return s.loai_ho_so === 'nhan_vien';
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedData = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primaryDark, paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.headerTitle}>Nhân viên</Text>
          <Text style={styles.headerSub}>{staffList.length} tổng · {filtered.length} hiển thị</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.addBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => {
              // Điều hướng sang thêm mới hội viên nhưng chỉ định vai trò mặc định
              navigation.navigate('AdminAddEditMember', { defaultRole: 'le_tan' });
            }}
          >
            <Plus color="#ffffff" size={20} />
          </TouchableOpacity>
          <View style={styles.headerBadge}>
            <Shield color="#ffffff" size={18} strokeWidth={2} />
          </View>
        </View>
      </View>

      {/* ── Bộ lọc chi nhánh (ScrollView ngang) ── */}
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.chip, 
                { backgroundColor: filter === f.key ? colors.primary : colors.surface, borderColor: filter === f.key ? colors.primary : colors.border }
              ]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: filter === f.key ? '#ffffff' : colors.textSecondary }}>{f.label}</Text>
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
        <View style={{ flex: 1 }}>
          <FlatList
            data={paginatedData}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <StaffCard 
                item={item} 
                colors={colors}
                onToggleLock={handleToggleLock}
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
            showsVerticalScrollIndicator={false}
          />
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface }}>
              <TouchableOpacity
                disabled={page === 1}
                onPress={() => setPage(p => Math.max(1, p - 1))}
                style={{ paddingHorizontal: 16, paddingVertical: 8, opacity: page === 1 ? 0.4 : 1 }}
              >
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Trước</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.text, marginHorizontal: 16, fontWeight: '600' }}>
                Trang {page} / {totalPages}
              </Text>
              <TouchableOpacity
                disabled={page === totalPages}
                onPress={() => setPage(p => Math.min(totalPages, p + 1))}
                style={{ paddingHorizontal: 16, paddingVertical: 8, opacity: page === totalPages ? 0.4 : 1 }}
              >
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Sau</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
