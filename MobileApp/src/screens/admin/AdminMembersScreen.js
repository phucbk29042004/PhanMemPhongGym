import React, { useCallback, useState, useEffect } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl,
  StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View, Platform, ScrollView,
} from 'react-native';
import {
  AlertCircle, CheckCircle2, Clock, Search, User, Users, X, Plus,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

function formatDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysLeft(den_ngay) {
  if (!den_ngay) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const end = new Date(den_ngay); end.setHours(0, 0, 0, 0);
  return Math.ceil((end - today) / 86400000);
}

function StatusBadge({ days, colors }) {
  if (days === null) return (
    <View style={[badge.wrap, { backgroundColor: colors.borderLight }]}>
      <Text style={[badge.text, { color: colors.textMuted }]}>Chưa có gói</Text>
    </View>
  );
  if (days < 0) return (
    <View style={[badge.wrap, { backgroundColor: colors.dangerLight }]}>
      <AlertCircle color={colors.danger} size={10} strokeWidth={2.5} />
      <Text style={[badge.text, { color: colors.danger }]}>Hết hạn</Text>
    </View>
  );
  if (days <= 7) return (
    <View style={[badge.wrap, { backgroundColor: '#fffbeb' }]}>
      <Clock color="#d97706" size={10} strokeWidth={2.5} />
      <Text style={[badge.text, { color: '#d97706' }]}>Còn {days}N</Text>
    </View>
  );
  return (
    <View style={[badge.wrap, { backgroundColor: colors.primaryLight }]}>
      <CheckCircle2 color={colors.primary} size={10} strokeWidth={2.5} />
      <Text style={[badge.text, { color: colors.primary }]}>Còn {days}N</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  text: { fontSize: 10, fontWeight: '700' },
});

// ── Avatar chữ cái ────────────────────────────────────────
function Avatar({ name, size = 44 }) {
  const safeName = name || '?';
  const initials = safeName.split(' ').slice(-2).map(w => w[0] || '').join('').toUpperCase().slice(0, 2);
  const colorsList = ['#1D9336', '#1565c0', '#7c3aed', '#d97706', '#dc2626'];
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

// ── Member Card ───────────────────────────────────────────
function MemberCard({ item, colors, onPress }) {
  const activePkg = Array.isArray(item.goi_tap_hien_tai) && item.goi_tap_hien_tai.length > 0 && item.goi_tap_hien_tai[0].trang_thai !== 'het_han' && item.goi_tap_hien_tai[0].trang_thai !== 'huy' ? item.goi_tap_hien_tai[0] : null;
  const days = activePkg ? daysLeft(activePkg.den_ngay) : null;

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
          <StatusBadge days={days} colors={colors} />
        </View>
        <Text style={[card.sub, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.ma_ho_so} • {item.so_dien_thoai || '—'}
        </Text>
        {activePkg ? (
          <Text style={[card.pkg, { color: colors.primary }]} numberOfLines={1}>
            {activePkg.ten_goi} · HH {formatDate(activePkg.den_ngay)}
          </Text>
        ) : (
          <Text style={[card.pkg, { color: colors.textMuted }]}>Chưa đăng ký gói tập</Text>
        )}
      </View>
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
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  name: { fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 },
  sub: { fontSize: 11, marginBottom: 3 },
  pkg: { fontSize: 11, fontWeight: '600' },
});

// ── Filter Chip ───────────────────────────────────────────
function FilterChip({ label, active, onPress, colors }) {
  return (
    <TouchableOpacity
      style={[
        chip.wrap, 
        { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[chip.text, { color: active ? '#ffffff' : colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}
const chip = StyleSheet.create({
  wrap: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, marginRight: 8,
  },
  text: { fontSize: 12, fontWeight: '600' },
});

const FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Đang HĐ' },
  { key: 'expiring', label: 'Sắp hết hạn' },
  { key: 'expired', label: 'Hết hạn' },
  { key: 'no_pkg', label: 'Chưa có gói' },
];

export default function AdminMembersScreen({ navigation, route }) {
  const { colors } = useTheme();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (route?.params?.filter) {
      setFilter(route.params.filter);
      // Clear route params so it doesn't get stuck on subsequent visits
      navigation.setParams({ filter: undefined });
    }
  }, [route?.params?.filter]);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await api.get('/members?limit=200&loai_ho_so=hoi_vien');
      if (res.data?.success) {
        const payload = res.data.data;
        setMembers(Array.isArray(payload) ? payload : (payload?.data || payload?.members || []));
      }
    } catch (err) {
      console.error('[AdminMembers] fetch error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchMembers(); }, [fetchMembers]));
  const onRefresh = () => { setRefreshing(true); fetchMembers(); };

  const filtered = members.filter(m => {
    const q = search.toLowerCase().trim();
    if (q && !m.ho_ten?.toLowerCase().includes(q) && !m.so_dien_thoai?.includes(q) && !m.ma_ho_so?.toLowerCase().includes(q)) return false;

    const activePkg = Array.isArray(m.goi_tap_hien_tai) && m.goi_tap_hien_tai.length > 0 && m.goi_tap_hien_tai[0].trang_thai !== 'het_han' && m.goi_tap_hien_tai[0].trang_thai !== 'huy' ? m.goi_tap_hien_tai[0] : null;

    if (filter === 'no_pkg') return !activePkg;
    if (!activePkg) return filter === 'all';
    const days = daysLeft(activePkg?.den_ngay);
    if (filter === 'active') return days !== null && days > 7;
    if (filter === 'expiring') return days !== null && days >= 0 && days <= 7;
    if (filter === 'expired') return days !== null && days < 0;
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primaryDark }]}>
        <View>
          <Text style={styles.headerTitle}>Hội viên</Text>
          <Text style={styles.headerSub}>{members.length} tổng · {filtered.length} hiển thị</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.addBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => navigation.navigate('AdminAddEditMember')}
          >
            <Plus color="#ffffff" size={20} />
          </TouchableOpacity>
          <View style={styles.headerBadge}>
            <Users color="#ffffff" size={18} strokeWidth={2} />
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search color={colors.textMuted} size={16} strokeWidth={2} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Tìm tên, SĐT, mã hồ sơ…"
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
            <FilterChip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} colors={colors} />
          ))}
        </ScrollView>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <MemberCard 
              item={item} 
              colors={colors}
              onPress={() => navigation.navigate('AdminMemberDetail', { memberId: item.id })}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <User color={colors.textMuted} size={48} strokeWidth={1} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Không tìm thấy hội viên</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 52, paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
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
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '600' },
});
