import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  ActivityIndicator, Alert, FlatList, RefreshControl,
  StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View, Platform, ScrollView,
} from 'react-native';
import {
  AlertCircle, Award, CalendarCheck, CheckCircle2, Clock,
  Dumbbell, Edit2, Search, Trash2, User, Users, X, Plus, XCircle,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/useAuthStore';

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
  const days = daysLeft(item.ngay_het_han);

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
        {item.ten_goi_tap ? (
          <Text style={[card.pkg, { color: colors.primary }]} numberOfLines={1}>
            {item.ten_goi_tap} · HH {formatDate(item.ngay_het_han)}
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

// ── PT Components (dùng cho sub-tab HLV/PT) ───────────────
function ScheduleBadge({ status, colors }) {
  const cfg = {
    cho_tap:  { bg: colors.warningLight || '#fffbeb', color: colors.warning || '#d97706', label: 'Chờ tập',  Icon: Clock },
    da_tap:   { bg: colors.primaryLight || '#e6f4ea', color: colors.primary || '#1D9336', label: 'Đã tập',   Icon: CheckCircle2 },
    da_huy:   { bg: colors.dangerLight || '#fef2f2',  color: colors.danger || '#dc2626',  label: 'Đã hủy',   Icon: XCircle },
  }[status] || { bg: colors.borderLight || '#f0f4f0', color: colors.textMuted || '#9cad9c', label: status, Icon: Clock };
  return (
    <View style={[sbPT.wrap, { backgroundColor: cfg.bg }]}>
      <cfg.Icon color={cfg.color} size={10} strokeWidth={2.5} />
      <Text style={[sbPT.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}
const sbPT = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  text: { fontSize: 10, fontWeight: '700' },
});

function PTAvatar({ name, size = 44 }) {
  const safeName = name || '?';
  const initials = safeName.split(' ').slice(-2).map(w => w[0] || '').join('').toUpperCase().slice(0, 2);
  const colorsList = ['#1D9336', '#1565c0', '#7c3aed', '#d97706', '#dc2626'];
  const charCode = safeName.charCodeAt(0) || 0;
  const color = colorsList[charCode % colorsList.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color, fontSize: size * 0.35, fontWeight: '800' }}>{initials}</Text>
    </View>
  );
}

function PTCard({ item, onPress, expanded, onEdit, onDelete, colors, isAdmin }) {
  return (
    <TouchableOpacity
      style={[ptCardStyle.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={ptCardStyle.top}>
        <PTAvatar name={item.ho_ten} />
        <View style={ptCardStyle.info}>
          <Text style={[ptCardStyle.name, { color: colors.text }]} numberOfLines={1}>{item.ho_ten}</Text>
          <Text style={[ptCardStyle.sub, { color: colors.primary }]}>{item.chuyen_mon || 'Gym / Fitness'}</Text>
          <Text style={[ptCardStyle.sub2, { color: colors.textSecondary }]}>{item.ma_ho_so} • {item.so_dien_thoai || '—'} • {item.chi_nhanh || 'Chưa rõ'}</Text>
        </View>
        <View style={ptCardStyle.stats}>
          <View style={[ptCardStyle.statBadge, { backgroundColor: colors.primaryLight }]}>
            <Users color={colors.primary} size={12} strokeWidth={2} />
            <Text style={[ptCardStyle.statText, { color: colors.primary }]}>{item.so_hoc_vien ?? 0} HV</Text>
          </View>
        </View>
      </View>
      {expanded && item.lich_hom_nay?.length > 0 && (
        <View style={[ptCardStyle.schedules, { borderTopColor: colors.border }]}>
          <Text style={[ptCardStyle.scheduleTitle, { color: colors.textSecondary }]}>Lịch hôm nay ({item.lich_hom_nay.length} buổi)</Text>
          {item.lich_hom_nay.map((s, idx) => (
            <View key={idx} style={[ptCardStyle.scheduleRow, { borderBottomColor: colors.border }]}>
              <View style={ptCardStyle.scheduleLeft}>
                <Text style={[ptCardStyle.scheduleMember, { color: colors.text }]} numberOfLines={1}>{s.ten_hoi_vien || '—'}</Text>
                <Text style={[ptCardStyle.scheduleTime, { color: colors.textSecondary }]}>🕒 {s.gio_bat_dau || '—'} – {s.gio_ket_thuc || '—'}</Text>
              </View>
              <ScheduleBadge status={s.trang_thai} colors={colors} />
            </View>
          ))}
        </View>
      )}
      {expanded && (!item.lich_hom_nay || item.lich_hom_nay.length === 0) && (
        <View style={[ptCardStyle.emptySchedule, { borderTopColor: colors.border }]}>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>Không có lịch hôm nay</Text>
        </View>
      )}
      {expanded && (
        <View style={[ptCardStyle.actions, { borderTopWidth: 1, borderTopColor: colors.border }]}>
          <TouchableOpacity style={[ptCardStyle.actionBtn, { borderColor: colors.primary }]} onPress={() => onEdit(item)} activeOpacity={0.7}>
            <Edit2 color={colors.primary} size={12} strokeWidth={2.5} />
            <Text style={[ptCardStyle.actionText, { color: colors.primary }]}>Sửa hồ sơ</Text>
          </TouchableOpacity>
          {isAdmin && (
            <TouchableOpacity style={[ptCardStyle.actionBtn, { borderColor: colors.danger }]} onPress={() => onDelete(item)} activeOpacity={0.7}>
              <Trash2 color={colors.danger} size={12} strokeWidth={2.5} />
              <Text style={[ptCardStyle.actionText, { color: colors.danger }]}>Xóa PT</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
const ptCardStyle = StyleSheet.create({
  wrap: { borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 6, elevation: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  sub: { fontSize: 11, fontWeight: '600', marginBottom: 1 },
  sub2: { fontSize: 11 },
  stats: { alignItems: 'flex-end', gap: 4 },
  statBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statText: { fontSize: 10, fontWeight: '700' },
  schedules: { marginTop: 12, borderTopWidth: 1, paddingTop: 10 },
  scheduleTitle: { fontSize: 11, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1 },
  scheduleLeft: { flex: 1, marginRight: 8 },
  scheduleMember: { fontSize: 13, fontWeight: '600' },
  scheduleTime: { fontSize: 11, marginTop: 1 },
  emptySchedule: { marginTop: 10, paddingVertical: 10, alignItems: 'center', borderTopWidth: 1 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12, paddingTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  actionText: { fontSize: 12, fontWeight: '700' },
});

export default function AdminMembersScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { user, role, selectedBranch, setSelectedBranch } = useAuthStore();
  const isStaffWithBranch = user?.chi_nhanh && user?.vai_tro !== 'admin' && user?.vai_tro !== 'chu_phong_gym';
  const isAdmin = role === 'admin';
  const [branches, setBranches] = useState([]);
  const insets = useSafeAreaInsets();

  // Sub-tab: 'hv' | 'pt'
  const [mainTab, setMainTab] = useState('hv');

  // ── State Hội viên ────────────────────────────────────────
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  // ── State PT ──────────────────────────────────────────────
  const [trainers, setTrainers] = useState([]);
  const [ptLoading, setPtLoading] = useState(true);
  const [ptRefreshing, setPtRefreshing] = useState(false);
  const [ptSearch, setPtSearch] = useState('');
  const [ptExpandedId, setPtExpandedId] = useState(null);
  const [ptInnerTab, setPtInnerTab] = useState('list'); // 'list' | 'schedule'
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (route?.params?.filter) {
      setFilter(route.params.filter);
      navigation.setParams({ filter: undefined });
    }
    if (route?.params?.mainTab) {
      setMainTab(route.params.mainTab);
      navigation.setParams({ mainTab: undefined });
    }
  }, [route?.params?.filter, route?.params?.mainTab]);

  const fetchBranches = useCallback(async () => {
    try {
      const res = await api.get('/branches');
      if (res.data?.success) setBranches(res.data.data || []);
    } catch (err) {
      console.error('[AdminMembers] fetch branches error:', err?.message);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const q = selectedBranch ? `&chi_nhanh=${encodeURIComponent(selectedBranch)}` : '';
      const res = await api.get(`/members?limit=200&loai_ho_so=hoi_vien${q}`);
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
  }, [selectedBranch]);

  const fetchTrainers = useCallback(async () => {
    try {
      const q = selectedBranch ? `?chi_nhanh=${encodeURIComponent(selectedBranch)}` : '';
      const res = await api.get(`/trainers${q}`);
      if (res.data?.success) {
        const list = res.data.data?.trainers || res.data.data || [];
        const withSchedules = await Promise.all(
          list.map(async (pt) => {
            try {
              const s = await api.get(`/trainers/${pt.id}/schedules?date=${today}`);
              return { ...pt, lich_hom_nay: s.data?.data || [] };
            } catch {
              return { ...pt, lich_hom_nay: [] };
            }
          })
        );
        setTrainers(withSchedules);
      }
    } catch (err) {
      console.error('[AdminMembers/PT] fetch error:', err?.message);
    } finally {
      setPtLoading(false);
      setPtRefreshing(false);
    }
  }, [today, selectedBranch]);

  const fetchTodaySchedules = useCallback(async () => {
    setScheduleLoading(true);
    try {
      const q = selectedBranch ? `?chi_nhanh=${encodeURIComponent(selectedBranch)}` : '';
      const res = await api.get(`/pt/schedules${q}`);
      setTodaySchedules(res.data?.data || []);
    } catch (err) {
      console.error('[AdminMembers/PT] schedules error:', err?.message);
    } finally {
      setScheduleLoading(false);
    }
  }, [selectedBranch]);

  const groupedSchedules = useMemo(() => {
    const groups = {};
    todaySchedules.forEach(s => {
      const date = s.ngay_tap || 'Chưa rõ';
      if (!groups[date]) groups[date] = [];
      groups[date].push(s);
    });
    return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(date => ({
      date,
      list: groups[date].sort((a, b) => (a.gio_bat_dau || '').localeCompare(b.gio_bat_dau || '')),
    }));
  }, [todaySchedules]);

  useFocusEffect(useCallback(() => {
    fetchBranches();
    fetchMembers();
    fetchTrainers();
    fetchTodaySchedules();
  }, [fetchBranches, fetchMembers, fetchTrainers, fetchTodaySchedules]));

  const onRefresh = () => {
    setRefreshing(true);
    setPtRefreshing(true);
    fetchBranches();
    fetchMembers();
    fetchTrainers();
    fetchTodaySchedules();
  };

  // ── HV pagination ─────────────────────────────────────────
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => { setPage(1); }, [search, filter]);

  const filtered = members.filter(m => {
    const q = search.toLowerCase().trim();
    if (q && !m.ho_ten?.toLowerCase().includes(q) && !m.so_dien_thoai?.includes(q) && !m.ma_ho_so?.toLowerCase().includes(q)) return false;
    if (filter === 'all') return true;
    if (filter === 'active') return m.trang_thai === 'con_han';
    if (filter === 'expiring') return m.trang_thai === 'sap_het_han';
    if (filter === 'expired') return m.trang_thai === 'het_han';
    if (filter === 'no_pkg') return m.trang_thai === 'chua_dang_ky';
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedData = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // ── PT pagination ─────────────────────────────────────────
  const [ptPage, setPtPage] = useState(1);
  useEffect(() => { setPtPage(1); }, [ptSearch]);

  const filteredTrainers = trainers.filter(pt => {
    const q = ptSearch.toLowerCase().trim();
    if (!q) return true;
    return pt.ho_ten?.toLowerCase().includes(q) || pt.chuyen_mon?.toLowerCase().includes(q) || pt.ma_ho_so?.toLowerCase().includes(q);
  });
  const ptTotalPages = Math.ceil(filteredTrainers.length / itemsPerPage) || 1;
  const paginatedPT = filteredTrainers.slice((ptPage - 1) * itemsPerPage, ptPage * itemsPerPage);

  const totalToday = trainers.reduce((sum, pt) => sum + (pt.lich_hom_nay?.length || 0), 0);
  const doneToday = trainers.reduce((sum, pt) => sum + (pt.lich_hom_nay?.filter(s => s.trang_thai === 'da_tap').length || 0), 0);

  const handleDeletePT = (item) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa PT ${item.ho_ten}? Tài khoản đăng nhập của PT này (nếu có) cũng sẽ bị khóa.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa', style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(`/trainers/${item.id}`);
              if (res.data?.success) {
                Alert.alert('Thành công', 'Đã xóa PT thành công.');
                fetchTrainers();
              } else {
                Alert.alert('Lỗi', res.data?.message || 'Không thể xóa PT.');
              }
            } catch (err) {
              Alert.alert('Lỗi', err?.response?.data?.message || 'Có lỗi xảy ra khi xóa PT.');
            }
          }
        }
      ]
    );
  };

  // ── Header title & action theo sub-tab ───────────────────
  const headerTitle = mainTab === 'hv' ? 'Hội viên' : 'Huấn luyện viên';
  const headerSub = mainTab === 'hv'
    ? `${members.length} tổng · ${filtered.length} hiển thị`
    : `${trainers.length} PT · ${totalToday} lịch hôm nay · ${doneToday} đã tập`;
  const headerAddAction = mainTab === 'hv'
    ? () => navigation.navigate('AdminAddEditMember')
    : () => navigation.navigate('AdminAddEditPT');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primaryDark, paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <Text style={styles.headerSub}>{headerSub}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={headerAddAction}
          >
            <Plus color="#ffffff" size={20} />
          </TouchableOpacity>
          <View style={styles.headerBadge}>
            {mainTab === 'hv'
              ? <Users color="#ffffff" size={18} strokeWidth={2} />
              : <Dumbbell color="#ffffff" size={18} strokeWidth={2} />
            }
          </View>
        </View>
      </View>

      {/* ── Sub-tab Hội viên / HLV ────────────────────────── */}
      <View style={[styles.mainTabRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.mainTabBtn, mainTab === 'hv' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setMainTab('hv')}
        >
          <Text style={[styles.mainTabText, { color: mainTab === 'hv' ? colors.primary : colors.textSecondary, fontWeight: mainTab === 'hv' ? '700' : '600' }]}>
            Hội viên
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTabBtn, mainTab === 'pt' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setMainTab('pt')}
        >
          <Text style={[styles.mainTabText, { color: mainTab === 'pt' ? colors.primary : colors.textSecondary, fontWeight: mainTab === 'pt' ? '700' : '600' }]}>
            HLV / PT
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Bộ lọc chi nhánh (ẩn với nhân viên có chi nhánh cố định) ── */}
      {!isStaffWithBranch && (
        <View style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 8 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            <TouchableOpacity
              style={[{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 }, { backgroundColor: selectedBranch === '' ? colors.primary : colors.surfaceVariant }]}
              onPress={() => setSelectedBranch('')}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: selectedBranch === '' ? '#fff' : colors.textSecondary }}>Tất cả chi nhánh</Text>
            </TouchableOpacity>
            {branches.map((b) => {
              const isSelected = selectedBranch === b.ten;
              return (
                <TouchableOpacity
                  key={b.id || b.ten}
                  style={[{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 }, { backgroundColor: isSelected ? colors.primary : colors.surfaceVariant }]}
                  onPress={() => setSelectedBranch(b.ten)}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: isSelected ? '#fff' : colors.textSecondary }}>{b.ten}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ════════════════ SUB-TAB: HỘI VIÊN ════════════════ */}
      {mainTab === 'hv' && (
        <>
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
            <View style={{ flex: 1 }}>
              <FlatList
                data={paginatedData}
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
              {totalPages > 1 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface }}>
                  <TouchableOpacity disabled={page === 1} onPress={() => setPage(p => Math.max(1, p - 1))} style={{ paddingHorizontal: 16, paddingVertical: 8, opacity: page === 1 ? 0.4 : 1 }}>
                    <Text style={{ color: colors.primary, fontWeight: '700' }}>Trước</Text>
                  </TouchableOpacity>
                  <Text style={{ color: colors.text, marginHorizontal: 16, fontWeight: '600' }}>Trang {page} / {totalPages}</Text>
                  <TouchableOpacity disabled={page === totalPages} onPress={() => setPage(p => Math.min(totalPages, p + 1))} style={{ paddingHorizontal: 16, paddingVertical: 8, opacity: page === totalPages ? 0.4 : 1 }}>
                    <Text style={{ color: colors.primary, fontWeight: '700' }}>Sau</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </>
      )}

      {/* ════════════════ SUB-TAB: HLV / PT ════════════════ */}
      {mainTab === 'pt' && (
        <>
          {/* Inner tab: Danh sách / Lịch tập */}
          <View style={[styles.innerTabRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.innerTabBtn, ptInnerTab === 'list' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setPtInnerTab('list')}
            >
              <Text style={[styles.innerTabText, { color: ptInnerTab === 'list' ? colors.primary : colors.textSecondary, fontWeight: ptInnerTab === 'list' ? '700' : '600' }]}>Danh sách PT</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.innerTabBtn, ptInnerTab === 'schedule' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setPtInnerTab('schedule')}
            >
              <Text style={[styles.innerTabText, { color: ptInnerTab === 'schedule' ? colors.primary : colors.textSecondary, fontWeight: ptInnerTab === 'schedule' ? '700' : '600' }]}>
                Lịch tập {todaySchedules.length > 0 ? `(${todaySchedules.length})` : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {ptInnerTab === 'list' ? (
            <>
              <View style={styles.searchWrap}>
                <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Search color={colors.textMuted} size={16} strokeWidth={2} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Tìm tên, chuyên môn, mã hồ sơ…"
                    placeholderTextColor={colors.textMuted}
                    value={ptSearch}
                    onChangeText={setPtSearch}
                  />
                  {ptSearch ? (
                    <TouchableOpacity onPress={() => setPtSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <X color={colors.textMuted} size={14} strokeWidth={2} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {ptLoading ? (
                <View style={styles.loadingBox}><ActivityIndicator size="large" color={colors.primary} /></View>
              ) : (
                <View style={{ flex: 1 }}>
                  <FlatList
                    data={paginatedPT}
                    keyExtractor={item => String(item.id)}
                    renderItem={({ item }) => (
                      <PTCard
                        item={item}
                        expanded={ptExpandedId === item.id}
                        onPress={() => setPtExpandedId(ptExpandedId === item.id ? null : item.id)}
                        onEdit={(pt) => navigation.navigate('AdminAddEditPT', { ptId: pt.id })}
                        onDelete={handleDeletePT}
                        colors={colors}
                        isAdmin={isAdmin}
                      />
                    )}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={ptRefreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
                    ListEmptyComponent={
                      <View style={styles.emptyBox}>
                        <Dumbbell color={colors.textMuted} size={48} strokeWidth={1} />
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>Không tìm thấy PT</Text>
                      </View>
                    }
                    showsVerticalScrollIndicator={false}
                  />
                  {ptTotalPages > 1 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface }}>
                      <TouchableOpacity disabled={ptPage === 1} onPress={() => setPtPage(p => Math.max(1, p - 1))} style={{ paddingHorizontal: 16, paddingVertical: 8, opacity: ptPage === 1 ? 0.4 : 1 }}>
                        <Text style={{ color: colors.primary, fontWeight: '700' }}>Trước</Text>
                      </TouchableOpacity>
                      <Text style={{ color: colors.text, marginHorizontal: 16, fontWeight: '600' }}>Trang {ptPage} / {ptTotalPages}</Text>
                      <TouchableOpacity disabled={ptPage === ptTotalPages} onPress={() => setPtPage(p => Math.min(ptTotalPages, p + 1))} style={{ paddingHorizontal: 16, paddingVertical: 8, opacity: ptPage === ptTotalPages ? 0.4 : 1 }}>
                        <Text style={{ color: colors.primary, fontWeight: '700' }}>Sau</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </>
          ) : (
            <ScrollView
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={ptRefreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
              showsVerticalScrollIndicator={false}
            >
              {scheduleLoading ? (
                <View style={styles.loadingBox}><ActivityIndicator size="large" color={colors.primary} /></View>
              ) : groupedSchedules.length === 0 ? (
                <View style={styles.emptyBox}>
                  <CalendarCheck color={colors.textMuted} size={48} strokeWidth={1} />
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>Chưa có lịch tập nào</Text>
                </View>
              ) : (
                groupedSchedules.map((group, groupIdx) => (
                  <View key={groupIdx} style={{ marginBottom: 16 }}>
                    <View style={[styles.dateGroupHeader, { borderBottomColor: colors.border }]}>
                      <CalendarCheck color={colors.primary} size={15} strokeWidth={2.5} />
                      <Text style={[styles.dateGroupText, { color: colors.text }]}>
                        {group.date === 'Chưa rõ' ? 'Chưa rõ ngày' : new Date(group.date + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </Text>
                      <Text style={[styles.dateGroupCount, { color: colors.textSecondary }]}>({group.list.length} buổi)</Text>
                    </View>
                    {group.list.map((s, idx) => (
                      <View key={s.id || idx} style={[scheduleCardStyle.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={scheduleCardStyle.left}>
                          <Text style={[scheduleCardStyle.time, { color: colors.primary }]}>🕒 {s.gio_bat_dau || '—'} – {s.gio_ket_thuc || '—'}</Text>
                          <Text style={[scheduleCardStyle.member, { color: colors.text }]} numberOfLines={1}>HV: {s.ten_hoi_vien || '—'}</Text>
                          <Text style={[scheduleCardStyle.pt, { color: colors.textSecondary }]} numberOfLines={1}>PT: {s.ten_pt || '—'}</Text>
                          {s.ghi_chu ? <Text style={[scheduleCardStyle.note, { color: colors.textSecondary }]} numberOfLines={2}>📝 {s.ghi_chu}</Text> : null}
                        </View>
                        <ScheduleBadge status={s.trang_thai} colors={colors} />
                      </View>
                    ))}
                  </View>
                ))
              )}
              <View style={{ height: 24 }} />
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}


const scheduleCardStyle = StyleSheet.create({
  wrap: { borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 6, elevation: 1 },
  left: { flex: 1 },
  time: { fontSize: 12, fontWeight: '600', marginBottom: 3 },
  member: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  pt: { fontSize: 12, fontWeight: '600' },
  note: { fontSize: 11, marginTop: 3 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 0, paddingBottom: 16,
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
  mainTabRow: { flexDirection: 'row', borderBottomWidth: 1 },
  mainTabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  mainTabText: { fontSize: 14 },
  innerTabRow: { flexDirection: 'row', borderBottomWidth: 1 },
  innerTabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  innerTabText: { fontSize: 13 },
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
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  emptyBox: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '600' },
  dateGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, marginTop: 10, marginBottom: 8, borderBottomWidth: 1 },
  dateGroupText: { fontSize: 14, fontWeight: '800' },
  dateGroupCount: { fontSize: 12, fontWeight: '600' },
});
