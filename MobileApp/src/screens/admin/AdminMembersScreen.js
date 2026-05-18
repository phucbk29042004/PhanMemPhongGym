import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl,
  StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import {
  AlertCircle, CheckCircle2, Clock, Search, User, Users, X,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';

const G = {
  primary: '#1D9336',
  primaryDark: '#155f27',
  primaryLight: '#e6f4ea',
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
  warning: '#d97706',
  warningLight: '#fffbeb',
};

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

function StatusBadge({ days }) {
  if (days === null) return (
    <View style={[badge.wrap, { backgroundColor: G.gray100 }]}>
      <Text style={[badge.text, { color: G.gray400 }]}>Chưa có gói</Text>
    </View>
  );
  if (days < 0) return (
    <View style={[badge.wrap, { backgroundColor: G.dangerLight }]}>
      <AlertCircle color={G.danger} size={10} strokeWidth={2.5} />
      <Text style={[badge.text, { color: G.danger }]}>Hết hạn</Text>
    </View>
  );
  if (days <= 7) return (
    <View style={[badge.wrap, { backgroundColor: G.warningLight }]}>
      <Clock color={G.warning} size={10} strokeWidth={2.5} />
      <Text style={[badge.text, { color: G.warning }]}>Còn {days}N</Text>
    </View>
  );
  return (
    <View style={[badge.wrap, { backgroundColor: G.primaryLight }]}>
      <CheckCircle2 color={G.primary} size={10} strokeWidth={2.5} />
      <Text style={[badge.text, { color: G.primary }]}>Còn {days}N</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  text: { fontSize: 10, fontWeight: '700' },
});

// ── Avatar chữ cái ────────────────────────────────────────
function Avatar({ name, size = 44 }) {
  const initials = (name || '?').split(' ').slice(-2).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['#1D9336', '#1565c0', '#7c3aed', '#d97706', '#dc2626'];
  const color = colors[(name || '').charCodeAt(0) % colors.length];
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
function MemberCard({ item }) {
  const activePkg = item.goi_hien_tai;
  const days = activePkg ? daysLeft(activePkg.den_ngay) : null;

  return (
    <View style={card.wrap}>
      <Avatar name={item.ho_ten} />
      <View style={card.info}>
        <View style={card.nameRow}>
          <Text style={card.name} numberOfLines={1}>{item.ho_ten}</Text>
          <StatusBadge days={days} />
        </View>
        <Text style={card.sub} numberOfLines={1}>
          {item.ma_ho_so} • {item.so_dien_thoai || '—'}
        </Text>
        {activePkg ? (
          <Text style={card.pkg} numberOfLines={1}>
            {activePkg.ten_goi} · HH {formatDate(activePkg.den_ngay)}
          </Text>
        ) : (
          <Text style={[card.pkg, { color: G.gray300 }]}>Chưa đăng ký gói tập</Text>
        )}
      </View>
    </View>
  );
}

const card = StyleSheet.create({
  wrap: {
    backgroundColor: G.white,
    borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 2,
  },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  name: { fontSize: 14, fontWeight: '700', color: G.gray900, flex: 1, marginRight: 8 },
  sub: { fontSize: 11, color: G.gray400, marginBottom: 3 },
  pkg: { fontSize: 11, color: G.primary, fontWeight: '600' },
});

// ── Filter Chip ───────────────────────────────────────────
function FilterChip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[chip.wrap, active && chip.active]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[chip.text, active && chip.textActive]}>{label}</Text>
    </TouchableOpacity>
  );
}
const chip = StyleSheet.create({
  wrap: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: G.white, borderWidth: 1, borderColor: G.gray200, marginRight: 8,
  },
  active: { backgroundColor: G.primary, borderColor: G.primary },
  text: { fontSize: 12, fontWeight: '600', color: G.gray500 },
  textActive: { color: G.white },
});

const FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Đang HĐ' },
  { key: 'expiring', label: 'Sắp hết hạn' },
  { key: 'expired', label: 'Hết hạn' },
  { key: 'no_pkg', label: 'Chưa có gói' },
];

export default function AdminMembersScreen() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchMembers = useCallback(async () => {
    try {
      const res = await api.get('/members?limit=200&loai_ho_so=hoi_vien');
      if (res.data?.success) {
        setMembers(res.data.data?.members || res.data.data || []);
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

    if (filter === 'no_pkg') return !m.goi_hien_tai;
    if (!m.goi_hien_tai) return filter === 'all';
    const days = daysLeft(m.goi_hien_tai?.den_ngay);
    if (filter === 'active') return days !== null && days > 7;
    if (filter === 'expiring') return days !== null && days >= 0 && days <= 7;
    if (filter === 'expired') return days !== null && days < 0;
    return true;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={G.primaryDark} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Hội viên</Text>
          <Text style={styles.headerSub}>{members.length} tổng · {filtered.length} hiển thị</Text>
        </View>
        <View style={styles.headerBadge}>
          <Users color={G.white} size={18} strokeWidth={2} />
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Search color={G.gray400} size={16} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm tên, SĐT, mã hồ sơ…"
            placeholderTextColor={G.gray400}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X color={G.gray400} size={14} strokeWidth={2} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <FilterChip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={G.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => <MemberCard item={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[G.primary]} tintColor={G.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <User color={G.gray300} size={48} strokeWidth={1} />
              <Text style={styles.emptyText}>Không tìm thấy hội viên</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: G.gray50 },
  header: {
    backgroundColor: G.primaryDark,
    paddingTop: 52, paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: G.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerBadge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: G.white, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: G.gray900 },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 10,
    overflow: 'scroll',
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: G.gray400, fontWeight: '600' },
});
