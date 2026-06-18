import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  ActivityIndicator, Alert, FlatList, RefreshControl, ScrollView,
  StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View, Platform
} from 'react-native';
import {
  Award, CalendarCheck, CheckCircle2, Clock,
  Dumbbell, Search, Users, X, XCircle, Plus, Edit2, Trash2
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/useAuthStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatDateTime(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
}

function ScheduleBadge({ status, colors }) {
  const cfg = {
    cho_tap: { bg: colors.warningLight || '#fffbeb', color: colors.warning || '#d97706', label: 'Chờ tập', Icon: Clock },
    da_tap: { bg: colors.primaryLight || '#e6f4ea', color: colors.primary || '#1D9336', label: 'Đã tập', Icon: CheckCircle2 },
    da_huy: { bg: colors.dangerLight || '#fef2f2', color: colors.danger || '#dc2626', label: 'Đã hủy', Icon: XCircle },
  }[status] || { bg: colors.borderLight || '#f0f4f0', color: colors.textMuted || '#9cad9c', label: status, Icon: Clock };

  return (
    <View style={[sb.wrap, { backgroundColor: cfg.bg }]}>
      <cfg.Icon color={cfg.color} size={10} strokeWidth={2.5} />
      <Text style={[sb.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  text: { fontSize: 10, fontWeight: '700' },
});

// ── Avatar ────────────────────────────────────────────────
function Avatar({ name, size = 44 }) {
  const safeName = name || '?';
  const initials = safeName.split(' ').slice(-2).map(w => w[0] || '').join('').toUpperCase().slice(0, 2);
  const colors = ['#1D9336', '#1565c0', '#7c3aed', '#d97706', '#dc2626'];
  const charCode = safeName.charCodeAt(0) || 0;
  const color = colors[charCode % colors.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color, fontSize: size * 0.35, fontWeight: '800' }}>{initials}</Text>
    </View>
  );
}

// ── PT Card ───────────────────────────────────────────────
function PTCard({ item, onPress, expanded, onEdit, onDelete, colors, isAdmin }) {
  return (
    <TouchableOpacity
      style={[ptCard.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={ptCard.top}>
        <Avatar name={item.ho_ten} />
        <View style={ptCard.info}>
          <Text style={[ptCard.name, { color: colors.text }]} numberOfLines={1}>{item.ho_ten}</Text>
          <Text style={[ptCard.sub, { color: colors.primary }]}>{item.chuyen_mon || 'Gym / Fitness'}</Text>
          <Text style={[ptCard.sub2, { color: colors.textSecondary }]}>{item.ma_ho_so} • {item.so_dien_thoai || '—'} • {item.chi_nhanh || 'Chưa rõ'}</Text>
        </View>
        <View style={ptCard.stats}>
          <View style={[ptCard.statBadge, { backgroundColor: colors.primaryLight }]}>
            <Users color={colors.primary} size={12} strokeWidth={2} />
            <Text style={[ptCard.statText, { color: colors.primary }]}>{item.so_hoc_vien ?? 0} HV</Text>
          </View>
        </View>
      </View>

      {expanded && item.lich_hom_nay?.length > 0 && (
        <View style={[ptCard.schedules, { borderTopColor: colors.border }]}>
          <Text style={[ptCard.scheduleTitle, { color: colors.textSecondary }]}>Lịch hôm nay ({item.lich_hom_nay.length} buổi)</Text>
          {item.lich_hom_nay.map((s, idx) => (
            <View key={idx} style={[ptCard.scheduleRow, { borderBottomColor: colors.border }]}>
              <View style={ptCard.scheduleLeft}>
                <Text style={[ptCard.scheduleMember, { color: colors.text }]} numberOfLines={1}>{s.ten_hoi_vien || '—'}</Text>
                <Text style={[ptCard.scheduleTime, { color: colors.textSecondary }]}> {s.gio_bat_dau || '—'} – {s.gio_ket_thuc || '—'}</Text>
              </View>
              <ScheduleBadge status={s.trang_thai} colors={colors} />
            </View>
          ))}
        </View>
      )}
      {expanded && (!item.lich_hom_nay || item.lich_hom_nay.length === 0) && (
        <View style={[ptCard.emptySchedule, { borderTopColor: colors.border }]}>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>Không có lịch hôm nay</Text>
        </View>
      )}

      {/* Hành động sửa/xóa PT */}
      {expanded && (
        <View style={[ptCard.actions, { borderTopWidth: 1, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[ptCard.actionBtn, { borderColor: colors.primary }]}
            onPress={() => onEdit(item)}
            activeOpacity={0.7}
          >
            <Edit2 color={colors.primary} size={12} strokeWidth={2.5} />
            <Text style={[ptCard.actionText, { color: colors.primary }]}>Sửa hồ sơ</Text>
          </TouchableOpacity>
          {isAdmin && (
            <TouchableOpacity
              style={[ptCard.actionBtn, { borderColor: colors.danger }]}
              onPress={() => onDelete(item)}
              activeOpacity={0.7}
            >
              <Trash2 color={colors.danger} size={12} strokeWidth={2.5} />
              <Text style={[ptCard.actionText, { color: colors.danger }]}>Xóa PT</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const ptCard = StyleSheet.create({
  wrap: {
    borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 6, elevation: 1,
  },
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

// ── Màn hình chính ────────────────────────────────────────
export default function AdminPTScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { user, role, selectedBranch, setSelectedBranch } = useAuthStore();
  const isStaffWithBranch = user?.chi_nhanh && role !== 'admin' && role !== 'chu_phong_gym';
  const [branches, setBranches] = useState([]);
  const insets = useSafeAreaInsets();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [tab, setTab] = useState('list'); // 'list' | 'schedule'

  useEffect(() => {
    if (route?.params?.tab) {
      setTab(route.params.tab);
      // Clear route params so it doesn't get stuck on subsequent visits
      navigation.setParams({ tab: undefined });
    }
  }, [route?.params?.tab]);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const fetchBranches = useCallback(async () => {
    try {
      const res = await api.get('/branches');
      if (res.data?.success) {
        setBranches(res.data.data || []);
      }
    } catch (err) {
      console.error('[AdminPT] fetch branches error:', err?.message);
    }
  }, []);

  const fetchTrainers = useCallback(async () => {
    try {
      const q = selectedBranch ? `?chi_nhanh=${encodeURIComponent(selectedBranch)}` : '';
      const res = await api.get(`/trainers${q}`);
      if (res.data?.success) {
        const list = res.data.data?.trainers || res.data.data || [];
        // Fetch today schedules cho mỗi PT
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
      console.error('[AdminPT] fetch error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [today, selectedBranch]);

  const fetchTodaySchedules = useCallback(async () => {
    setScheduleLoading(true);
    try {
      const q = selectedBranch ? `?chi_nhanh=${encodeURIComponent(selectedBranch)}` : '';
      const res = await api.get(`/pt/schedules${q}`);
      setTodaySchedules(res.data?.data || []);
    } catch (err) {
      console.error('[AdminPT] schedules error:', err?.message);
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
    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a)); // Mới nhất lên trước
    return sortedDates.map(date => {
      const list = groups[date].sort((a, b) => (a.gio_bat_dau || '').localeCompare(b.gio_bat_dau || ''));
      return { date, list };
    });
  }, [todaySchedules]);

  useFocusEffect(useCallback(() => {
    fetchBranches();
    fetchTrainers();
    fetchTodaySchedules();
  }, [fetchBranches, fetchTrainers, fetchTodaySchedules]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrainers();
    fetchTodaySchedules();
  };

  const handleDeletePT = (item) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa huấn luyện viên ${item.ho_ten}? Tài khoản đăng nhập của PT này (nếu có) cũng sẽ bị khóa.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
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
              console.error('[AdminPT] delete error:', err?.message);
              Alert.alert('Lỗi', err?.response?.data?.message || 'Có lỗi xảy ra khi xóa PT.');
            }
          }
        }
      ]
    );
  };

  const filteredTrainers = trainers.filter(pt => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return pt.ho_ten?.toLowerCase().includes(q) || pt.chuyen_mon?.toLowerCase().includes(q) || pt.ma_ho_so?.toLowerCase().includes(q);
  });

  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.ceil(filteredTrainers.length / itemsPerPage) || 1;
  const paginatedPT = filteredTrainers.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const totalToday = trainers.reduce((sum, pt) => sum + (pt.lich_hom_nay?.length || 0), 0);
  const doneToday = trainers.reduce((sum, pt) => sum + (pt.lich_hom_nay?.filter(s => s.trang_thai === 'da_tap').length || 0), 0);

  return (

    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primaryDark, paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.headerTitle}>Huấn luyện viên</Text>
          <Text style={styles.headerSub}>{trainers.length} PT · {totalToday} lịch hôm nay · {doneToday} đã tập</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => navigation.navigate('AdminAddEditPT')}
          >
            <Plus color="#ffffff" size={20} />
          </TouchableOpacity>
          <View style={styles.headerBadge}>
            <Dumbbell color="#ffffff" size={18} strokeWidth={2} />
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

      {/* Tabs */}
      <View style={[styles.tabRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'list' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setTab('list')}
        >
          <Text style={[styles.tabText, { color: tab === 'list' ? colors.primary : colors.textSecondary, fontWeight: tab === 'list' ? '700' : '600' }]}>Danh sách PT</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'schedule' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setTab('schedule')}
        >
          <Text style={[styles.tabText, { color: tab === 'schedule' ? colors.primary : colors.textSecondary, fontWeight: tab === 'schedule' ? '700' : '600' }]}>
            Lịch tập PT {todaySchedules.length > 0 ? `(${todaySchedules.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'list' ? (
        <>
          {/* Search */}
          <View style={styles.searchWrap}>
            <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Search color={colors.textMuted} size={16} strokeWidth={2} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Tìm tên, chuyên môn, mã hồ sơ…"
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X color={colors.textMuted} size={14} strokeWidth={2} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingBox}><ActivityIndicator size="large" color={colors.primary} /></View>
          ) : (
            <View style={{ flex: 1 }}>
              <FlatList
                data={paginatedPT}
                keyExtractor={item => String(item.id)}
                renderItem={({ item }) => (
                  <PTCard
                    item={item}
                    expanded={expandedId === item.id}
                    onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    onEdit={(pt) => navigation.navigate('AdminAddEditPT', { ptId: pt.id })}
                    onDelete={handleDeletePT}
                    colors={colors}
                    isAdmin={role === 'admin'}
                  />
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
                ListEmptyComponent={
                  <View style={styles.emptyBox}>
                    <Dumbbell color={colors.textMuted} size={48} strokeWidth={1} />
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>Không tìm thấy PT</Text>
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
        </>
      ) : (

        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
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
                  <View key={s.id || idx} style={[scheduleCard.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={scheduleCard.left}>
                      <Text style={[scheduleCard.time, { color: colors.primary }]}>{s.gio_bat_dau || '—'} – {s.gio_ket_thuc || '—'}</Text>
                      <Text style={[scheduleCard.member, { color: colors.text }]} numberOfLines={1}>HV: {s.ten_hoi_vien || '—'}</Text>
                      <Text style={[scheduleCard.pt, { color: colors.textSecondary }]} numberOfLines={1}>PT: {s.ten_pt || '—'}</Text>
                      {s.ghi_chu ? <Text style={[scheduleCard.note, { color: colors.textSecondary }]} numberOfLines={2}>{s.ghi_chu}</Text> : null}
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
    </View>
  );
}

const scheduleCard = StyleSheet.create({
  wrap: {
    borderRadius: 14, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 6, elevation: 1,
  },
  left: { flex: 1 },
  time: { fontSize: 12, fontWeight: '600', marginBottom: 3 },
  member: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  pt: { fontSize: 12, fontWeight: '600' },
  note: { fontSize: 11, marginTop: 3 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center'
  },
  headerBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  tabRow: {
    flexDirection: 'row', borderBottomWidth: 1,
  },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 13 },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 12 : 6,
    shadowColor: '#000', shadowOpacity: 0.01, shadowRadius: 6, elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  emptyBox: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '600' },
  dateGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  dateGroupText: {
    fontSize: 14,
    fontWeight: '800',
  },
  dateGroupCount: {
    fontSize: 12,
    fontWeight: '600',
  },
});
