import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView,
  StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import {
  ArrowDownLeft, ArrowUpRight, CalendarClock,
  Clock, FileText, Filter, ScanLine, ArrowLeft
} from 'lucide-react-native';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

// ── Màu sắc ────────────────────────────────────────────────
const G = {
  primary: '#1D9336',
  primaryLight: '#e6f4ea',
  primaryDark: '#155f27',
  white: '#ffffff',
  gray50: '#f8faf8',
  gray100: '#f0f4f0',
  gray200: '#e4ebe4',
  gray300: '#cdd8cd',
  gray400: '#9cad9c',
  gray500: '#6b7c6b',
  gray700: '#2d3c2d',
  gray900: '#141c14',
  blue: '#1565c0',
  blueLight: '#e3f2fd',
};

// ── Helper ─────────────────────────────────────────────────
function formatDateTime(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatTimeOnly(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatDateOnly(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function methodLabel(method) {
  return {
    the_tu: 'Thẻ từ',
    qr_code: 'QR Code',
    khuon_mat: 'Khuôn mặt',
    thu_cong: 'Thủ công',
  }[method] || (method || 'Chưa rõ');
}

// ── Card lượt vào/ra ───────────────────────────────────────
function CheckinCard({ item }) {
  const { colors } = useTheme();
  const isVao = item.loai === 'vao';
  const blueLight = colors.isDark ? 'rgba(33,150,243,0.15)' : G.blueLight;
  const blueColor = colors.isDark ? '#64b5f6' : G.blue;

  return (
    <View style={[cardStyles.wrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Icon loại */}
      <View style={[cardStyles.iconBox, { backgroundColor: isVao ? colors.primaryLight : blueLight }]}>
        {isVao
          ? <ArrowUpRight color={colors.primary} size={20} strokeWidth={2.5} />
          : <ArrowDownLeft color={blueColor} size={20} strokeWidth={2.5} />
        }
      </View>

      {/* Thông tin */}
      <View style={cardStyles.info}>
        <Text style={[cardStyles.typeLabel, { color: isVao ? colors.primary : blueColor }]}>
          {isVao ? 'Vào phòng tập' : 'Ra khỏi phòng tập'}
        </Text>
        <View style={cardStyles.row}>
          <Clock color={colors.textMuted} size={12} strokeWidth={2} />
          <Text style={[cardStyles.time, { color: colors.text }]}>
            {item.gio_hien_thi || formatTimeOnly(item.thoi_diem)}
          </Text>
          <Text style={[cardStyles.date, { color: colors.textMuted }]}>
            {formatDateOnly(item.thoi_diem?.split?.('T')?.[0] || item.thoi_diem)}
          </Text>
        </View>
        <View style={cardStyles.row}>
          <ScanLine color={colors.textMuted} size={12} strokeWidth={2} />
          <Text style={[cardStyles.method, { color: colors.textMuted }]}>{methodLabel(item.phuong_thuc)}</Text>
        </View>
      </View>

      {/* Dot chỉ thị */}
      <View style={[cardStyles.dot, { backgroundColor: isVao ? colors.primary : blueColor }]} />
    </View>
  );
}

const cardStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: G.white, borderRadius: 16,
    padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  info: { flex: 1, gap: 3 },
  typeLabel: { fontSize: 14, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  time: { fontSize: 13, fontWeight: '700', color: G.gray900 },
  date: { fontSize: 12, color: G.gray400, fontWeight: '500' },
  method: { fontSize: 11, color: G.gray400 },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
});

// ── Màn hình Vào/Ra ─────────────────────────────────────────
export default function MemberCheckinsScreen({ navigation }) {
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState(''); // '' | 'vao' | 'ra'

  const fetchCheckins = useCallback(async () => {
    try {
      const res = await api.get('/checkins/me?limit=50');
      if (res.data?.success) {
        const data = res.data.data?.data || res.data.data || [];
        setCheckins(data);
      }
    } catch (err) {
      console.error('[CheckinsScreen] fetch error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCheckins(); }, [fetchCheckins]);

  const onRefresh = () => { setRefreshing(true); fetchCheckins(); };

  const safeCheckins = Array.isArray(checkins) ? checkins : [];
  const filtered = filterType ? safeCheckins.filter(c => c.loai === filterType) : safeCheckins;
  const totalVao = safeCheckins.filter(c => c.loai === 'vao').length;
  const totalRa = safeCheckins.filter(c => c.loai === 'ra').length;

  const { colors } = useTheme();
  const blueLight = colors.isDark ? 'rgba(33,150,243,0.15)' : G.blueLight;
  const blueColor = colors.isDark ? '#64b5f6' : G.blue;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.isDark ? colors.statusBarBg : G.white} />

      {/* ── Header ───────────────────────── */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 8, padding: 4 }}>
            <ArrowLeft color={colors.text} size={22} />
          </TouchableOpacity>
          <View style={[styles.headerIconBox, { backgroundColor: colors.primaryLight }]}>
            <CalendarClock color={colors.primary} size={18} strokeWidth={2} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Lịch sử Vào / Ra</Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]}>{safeCheckins.length} lượt gần nhất</Text>
          </View>
        </View>
      </View>

      {/* ── Summary cards ────────────────── */}
      {!loading && (
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.primaryLight }]}>
            <ArrowUpRight color={colors.primary} size={18} strokeWidth={2.5} />
            <Text style={[styles.summaryVal, { color: colors.primary }]}>{totalVao}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Lượt vào</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: blueLight }]}>
            <ArrowDownLeft color={blueColor} size={18} strokeWidth={2.5} />
            <Text style={[styles.summaryVal, { color: blueColor }]}>{totalRa}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Lượt ra</Text>
          </View>
        </View>
      )}

      {/* ── Bộ lọc ───────────────────────── */}
      {!loading && (
        <View style={styles.filterRow}>
          <Filter color={colors.textMuted} size={14} strokeWidth={2} />
          {[
            { label: 'Tất cả', val: '' },
            { label: 'Vào', val: 'vao' },
            { label: 'Ra', val: 'ra' },
          ].map(opt => (
            <TouchableOpacity
              key={opt.val}
              style={[
                styles.filterChip, 
                { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                filterType === opt.val && { backgroundColor: colors.primaryLight, borderColor: colors.primary }
              ]}
              onPress={() => setFilterType(opt.val)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterChipText, 
                { color: colors.textMuted },
                filterType === opt.val && { color: colors.primary, fontWeight: '700' }
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Danh sách ────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Đang tải dữ liệu...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <FileText color={colors.textMuted} size={48} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Chưa có dữ liệu</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              {filterType ? 'Thử bỏ bộ lọc để xem tất cả' : 'Chưa có lịch sử vào/ra nào'}
            </Text>
          </View>
        ) : (
          filtered.map((item, i) => <CheckinCard key={item.id || i} item={item} />)
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: G.gray50 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20,
    backgroundColor: G.white, borderBottomWidth: 1, borderBottomColor: G.gray200,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconBox: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: G.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: G.gray900 },
  headerSub: { fontSize: 11, color: G.gray400, fontWeight: '500' },

  // Summary
  summaryRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  summaryCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 14,
  },
  summaryVal: { fontSize: 20, fontWeight: '800' },
  summaryLabel: { fontSize: 11, color: G.gray500, fontWeight: '500' },

  // Filter
  filterRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, backgroundColor: G.gray100,
    borderWidth: 1, borderColor: G.gray200,
  },
  filterChipActive: {
    backgroundColor: G.primaryLight, borderColor: G.primary,
  },
  filterChipText: { fontSize: 12, fontWeight: '600', color: G.gray500 },
  filterChipTextActive: { color: G.primary },

  // Scroll
  scrollContent: { padding: 16, paddingBottom: 24 },
  loadingCenter: { paddingTop: 80, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: G.gray400, fontWeight: '500' },

  // Empty
  emptyBox: { paddingTop: 60, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: G.gray500 },
  emptySub: { fontSize: 13, color: G.gray400, textAlign: 'center' },
});
