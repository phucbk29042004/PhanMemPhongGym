import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl, ScrollView,
  StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import {
  Award, CalendarCheck, CheckCircle2, Clock,
  Dumbbell, Search, Users, X, XCircle,
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
  gray400: '#9cad9c',
  gray500: '#6b7c6b',
  gray700: '#2d3c2d',
  gray900: '#141c14',
  danger: '#dc2626',
  dangerLight: '#fef2f2',
  warning: '#d97706',
  warningLight: '#fffbeb',
  blue: '#1565c0',
  blueLight: '#e3f2fd',
  purple: '#7c3aed',
};

function formatDateTime(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
}

function ScheduleBadge({ status }) {
  const cfg = {
    cho_tap:  { bg: G.warningLight, color: G.warning,  label: 'Chờ tập',  Icon: Clock },
    da_tap:   { bg: G.primaryLight, color: G.primary,  label: 'Đã tập',   Icon: CheckCircle2 },
    da_huy:   { bg: G.dangerLight,  color: G.danger,   label: 'Đã hủy',   Icon: XCircle },
  }[status] || { bg: G.gray100, color: G.gray400, label: status, Icon: Clock };

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
function PTCard({ item, onPress, expanded }) {
  return (
    <TouchableOpacity style={ptCard.wrap} onPress={onPress} activeOpacity={0.8}>
      <View style={ptCard.top}>
        <Avatar name={item.ho_ten} />
        <View style={ptCard.info}>
          <Text style={ptCard.name} numberOfLines={1}>{item.ho_ten}</Text>
          <Text style={ptCard.sub}>{item.chuyen_mon || 'Gym / Fitness'}</Text>
          <Text style={ptCard.sub2}>{item.ma_ho_so} • {item.so_dien_thoai || '—'}</Text>
        </View>
        <View style={ptCard.stats}>
          <View style={[ptCard.statBadge, { backgroundColor: G.primaryLight }]}>
            <Users color={G.primary} size={12} strokeWidth={2} />
            <Text style={[ptCard.statText, { color: G.primary }]}>{item.so_hoc_vien ?? 0} HV</Text>
          </View>
        </View>
      </View>

      {expanded && item.lich_hom_nay?.length > 0 && (
        <View style={ptCard.schedules}>
          <Text style={ptCard.scheduleTitle}>Lịch hôm nay ({item.lich_hom_nay.length} buổi)</Text>
          {item.lich_hom_nay.map((s, idx) => (
            <View key={idx} style={ptCard.scheduleRow}>
              <View style={ptCard.scheduleLeft}>
                <Text style={ptCard.scheduleMember} numberOfLines={1}>{s.ten_hoi_vien || '—'}</Text>
                <Text style={ptCard.scheduleTime}>{formatDateTime(s.thoi_gian_bat_dau)}</Text>
              </View>
              <ScheduleBadge status={s.trang_thai} />
            </View>
          ))}
        </View>
      )}
      {expanded && (!item.lich_hom_nay || item.lich_hom_nay.length === 0) && (
        <View style={ptCard.emptySchedule}>
          <Text style={{ fontSize: 12, color: G.gray400 }}>Không có lịch hôm nay</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const ptCard = StyleSheet.create({
  wrap: {
    backgroundColor: G.white, borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 2,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: G.gray900, marginBottom: 2 },
  sub: { fontSize: 11, color: G.primary, fontWeight: '600', marginBottom: 1 },
  sub2: { fontSize: 11, color: G.gray400 },
  stats: { alignItems: 'flex-end', gap: 4 },
  statBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statText: { fontSize: 10, fontWeight: '700' },
  schedules: { marginTop: 12, borderTopWidth: 1, borderTopColor: G.gray100, paddingTop: 10 },
  scheduleTitle: { fontSize: 11, fontWeight: '700', color: G.gray400, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: G.gray100 },
  scheduleLeft: { flex: 1, marginRight: 8 },
  scheduleMember: { fontSize: 13, fontWeight: '600', color: G.gray900 },
  scheduleTime: { fontSize: 11, color: G.gray400, marginTop: 1 },
  emptySchedule: { marginTop: 10, paddingVertical: 10, alignItems: 'center', borderTopWidth: 1, borderTopColor: G.gray100 },
});

// ── Màn hình chính ────────────────────────────────────────
export default function AdminPTScreen() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [tab, setTab] = useState('list'); // 'list' | 'schedule'
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const fetchTrainers = useCallback(async () => {
    try {
      const res = await api.get('/trainers');
      if (res.data?.success) {
        const list = res.data.data?.trainers || res.data.data || [];
        // Fetch today schedules cho mỗi PT
        const withSchedules = await Promise.all(
          list.map(async (pt) => {
            try {
              const s = await api.get(`/trainers/${pt.id}/schedules?ngay=${today}`);
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
  }, [today]);

  const fetchTodaySchedules = useCallback(async () => {
    setScheduleLoading(true);
    try {
      const res = await api.get(`/pt/schedules?ngay=${today}`);
      setTodaySchedules(res.data?.data || []);
    } catch (err) {
      console.error('[AdminPT] schedules error:', err?.message);
    } finally {
      setScheduleLoading(false);
    }
  }, [today]);

  useFocusEffect(useCallback(() => {
    fetchTrainers();
    fetchTodaySchedules();
  }, [fetchTrainers, fetchTodaySchedules]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrainers();
    fetchTodaySchedules();
  };

  const filteredTrainers = trainers.filter(pt => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return pt.ho_ten?.toLowerCase().includes(q) || pt.chuyen_mon?.toLowerCase().includes(q) || pt.ma_ho_so?.toLowerCase().includes(q);
  });

  const totalToday = trainers.reduce((sum, pt) => sum + (pt.lich_hom_nay?.length || 0), 0);
  const doneToday = trainers.reduce((sum, pt) => sum + (pt.lich_hom_nay?.filter(s => s.trang_thai === 'da_tap').length || 0), 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={G.primaryDark} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Huấn luyện viên</Text>
          <Text style={styles.headerSub}>{trainers.length} PT · {totalToday} lịch hôm nay · {doneToday} đã tập</Text>
        </View>
        <View style={styles.headerBadge}>
          <Dumbbell color={G.white} size={18} strokeWidth={2} />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'list' && styles.tabBtnActive]} onPress={() => setTab('list')}>
          <Text style={[styles.tabText, tab === 'list' && styles.tabTextActive]}>Danh sách PT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'schedule' && styles.tabBtnActive]} onPress={() => setTab('schedule')}>
          <Text style={[styles.tabText, tab === 'schedule' && styles.tabTextActive]}>
            Lịch hôm nay {totalToday > 0 ? `(${totalToday})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'list' ? (
        <>
          {/* Search */}
          <View style={styles.searchWrap}>
            <View style={styles.searchBox}>
              <Search color={G.gray400} size={16} strokeWidth={2} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm tên, chuyên môn, mã hồ sơ…"
                placeholderTextColor={G.gray400}
                value={search}
                onChangeText={setSearch}
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X color={G.gray400} size={14} strokeWidth={2} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingBox}><ActivityIndicator size="large" color={G.primary} /></View>
          ) : (
            <FlatList
              data={filteredTrainers}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => (
                <PTCard
                  item={item}
                  expanded={expandedId === item.id}
                  onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
                />
              )}
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[G.primary]} tintColor={G.primary} />}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Dumbbell color={G.gray300} size={48} strokeWidth={1} />
                  <Text style={styles.emptyText}>Không tìm thấy PT</Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[G.primary]} tintColor={G.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {scheduleLoading ? (
            <View style={styles.loadingBox}><ActivityIndicator size="large" color={G.primary} /></View>
          ) : todaySchedules.length === 0 ? (
            <View style={styles.emptyBox}>
              <CalendarCheck color={G.gray300} size={48} strokeWidth={1} />
              <Text style={styles.emptyText}>Chưa có lịch tập hôm nay</Text>
            </View>
          ) : (
            todaySchedules.map((s, idx) => (
              <View key={idx} style={scheduleCard.wrap}>
                <View style={scheduleCard.left}>
                  <Text style={scheduleCard.time}>{formatDateTime(s.thoi_gian_bat_dau)}</Text>
                  <Text style={scheduleCard.member} numberOfLines={1}>HV: {s.ten_hoi_vien || '—'}</Text>
                  <Text style={scheduleCard.pt} numberOfLines={1}>PT: {s.ten_pt || '—'}</Text>
                  {s.ghi_chu ? <Text style={scheduleCard.note} numberOfLines={1}>📝 {s.ghi_chu}</Text> : null}
                </View>
                <ScheduleBadge status={s.trang_thai} />
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
    backgroundColor: G.white, borderRadius: 14, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 2,
  },
  left: { flex: 1 },
  time: { fontSize: 12, color: G.gray400, fontWeight: '600', marginBottom: 3 },
  member: { fontSize: 14, fontWeight: '700', color: G.gray900, marginBottom: 2 },
  pt: { fontSize: 12, color: G.primary, fontWeight: '600' },
  note: { fontSize: 11, color: G.gray500, marginTop: 3 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: G.gray50 },
  header: {
    backgroundColor: G.primaryDark,
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: G.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  tabRow: {
    flexDirection: 'row', backgroundColor: G.white,
    borderBottomWidth: 1, borderBottomColor: G.gray100,
  },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: G.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: G.gray400 },
  tabTextActive: { color: G.primary },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: G.white, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: G.gray900 },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  emptyBox: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: G.gray400, fontWeight: '600' },
});
