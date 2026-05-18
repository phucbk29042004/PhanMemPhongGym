import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView,
  StatusBar, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import {
  Award, Calendar, Dumbbell, Package, Tag, Users,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';

const G = {
  primary: '#1D9336',
  primaryDark: '#155f27',
  primaryLight: '#e6f4ea',
  primaryMid: '#4db870',
  white: '#ffffff',
  gray50: '#f8faf8',
  gray100: '#f0f4f0',
  gray200: '#e4ebe4',
  gray400: '#9cad9c',
  gray500: '#6b7c6b',
  gray700: '#2d3c2d',
  gray900: '#141c14',
  blue: '#1565c0',
  blueLight: '#e3f2fd',
  purple: '#7c3aed',
  purpleLight: '#f3e8ff',
  warning: '#d97706',
  warningLight: '#fffbeb',
};

function formatPrice(val) {
  if (val == null) return '—';
  return Number(val).toLocaleString('vi-VN') + 'đ';
}

// ── Package Card — Gym ────────────────────────────────────
function GymPackageCard({ item, index }) {
  const palette = [
    { bg: G.primaryLight, accent: G.primary },
    { bg: G.blueLight, accent: G.blue },
    { bg: G.purpleLight, accent: G.purple },
    { bg: G.warningLight, accent: G.warning },
  ];
  const c = palette[index % palette.length];

  return (
    <View style={[gpCard.wrap, { borderLeftColor: c.accent, borderLeftWidth: 4 }]}>
      <View style={gpCard.top}>
        <View style={[gpCard.iconBox, { backgroundColor: c.bg }]}>
          <Award color={c.accent} size={20} strokeWidth={2} />
        </View>
        <View style={gpCard.info}>
          <Text style={gpCard.name} numberOfLines={1}>{item.ten_goi}</Text>
          <Text style={[gpCard.price, { color: c.accent }]}>{formatPrice(item.gia)}</Text>
        </View>
        {item.so_dang_ky != null && (
          <View style={[gpCard.badge, { backgroundColor: c.bg }]}>
            <Users color={c.accent} size={12} strokeWidth={2} />
            <Text style={[gpCard.badgeText, { color: c.accent }]}>{item.so_dang_ky}</Text>
          </View>
        )}
      </View>

      <View style={gpCard.detailRow}>
        {item.so_thang ? (
          <View style={gpCard.detail}>
            <Calendar color={G.gray400} size={12} strokeWidth={2} />
            <Text style={gpCard.detailText}>{item.so_thang} tháng{item.so_ngay_them > 0 ? ` +${item.so_ngay_them} ngày` : ''}</Text>
          </View>
        ) : null}
        {item.mo_ta ? (
          <Text style={gpCard.desc} numberOfLines={2}>{item.mo_ta}</Text>
        ) : null}
      </View>
    </View>
  );
}

const gpCard = StyleSheet.create({
  wrap: {
    backgroundColor: G.white, borderRadius: 14,
    padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 2,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: G.gray900, marginBottom: 2 },
  price: { fontSize: 16, fontWeight: '800' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  detailRow: { gap: 4 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 12, color: G.gray500, fontWeight: '600' },
  desc: { fontSize: 12, color: G.gray400, lineHeight: 16 },
});

// ── Package Card — PT ─────────────────────────────────────
function PTPackageCard({ item, index }) {
  const palette = [
    { bg: G.primaryLight, accent: G.primary },
    { bg: '#fff7ed', accent: '#ea580c' },
    { bg: G.blueLight, accent: G.blue },
    { bg: G.purpleLight, accent: G.purple },
  ];
  const c = palette[index % palette.length];

  return (
    <View style={[ptPkgCard.wrap, { borderLeftColor: c.accent, borderLeftWidth: 4 }]}>
      <View style={ptPkgCard.top}>
        <View style={[ptPkgCard.iconBox, { backgroundColor: c.bg }]}>
          <Dumbbell color={c.accent} size={20} strokeWidth={2} />
        </View>
        <View style={ptPkgCard.info}>
          <Text style={ptPkgCard.name} numberOfLines={1}>{item.ten_goi_pt || item.ten_goi}</Text>
          <Text style={[ptPkgCard.price, { color: c.accent }]}>{formatPrice(item.gia)}</Text>
        </View>
        {item.so_dang_ky != null && (
          <View style={[ptPkgCard.badge, { backgroundColor: c.bg }]}>
            <Users color={c.accent} size={12} strokeWidth={2} />
            <Text style={[ptPkgCard.badgeText, { color: c.accent }]}>{item.so_dang_ky}</Text>
          </View>
        )}
      </View>

      <View style={ptPkgCard.chips}>
        {item.so_buoi ? (
          <View style={ptPkgCard.chip}>
            <Tag color={G.gray500} size={11} strokeWidth={2} />
            <Text style={ptPkgCard.chipText}>{item.so_buoi} buổi</Text>
          </View>
        ) : null}
        {item.gia_moi_buoi ? (
          <View style={ptPkgCard.chip}>
            <Text style={ptPkgCard.chipText}>{formatPrice(item.gia_moi_buoi)}/buổi</Text>
          </View>
        ) : null}
      </View>

      {item.mo_ta ? <Text style={ptPkgCard.desc} numberOfLines={2}>{item.mo_ta}</Text> : null}
    </View>
  );
}

const ptPkgCard = StyleSheet.create({
  wrap: {
    backgroundColor: G.white, borderRadius: 14,
    padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 2,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: G.gray900, marginBottom: 2 },
  price: { fontSize: 16, fontWeight: '800' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: G.gray100, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  chipText: { fontSize: 11, color: G.gray700, fontWeight: '600' },
  desc: { fontSize: 12, color: G.gray400, lineHeight: 16 },
});

// ── Màn hình chính ────────────────────────────────────────
export default function AdminPackagesScreen() {
  const [gymPkgs, setGymPkgs] = useState([]);
  const [ptPkgs, setPtPkgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('gym'); // 'gym' | 'pt'

  const fetchPackages = useCallback(async () => {
    try {
      const [gymRes, ptRes] = await Promise.all([
        api.get('/packages'),
        api.get('/packages/pt'),
      ]);
      if (gymRes.data?.success) setGymPkgs(gymRes.data.data || []);
      if (ptRes.data?.success) setPtPkgs(ptRes.data.data || []);
    } catch (err) {
      console.error('[AdminPackages] fetch error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchPackages(); }, [fetchPackages]));
  const onRefresh = () => { setRefreshing(true); fetchPackages(); };

  const totalGymEnroll = gymPkgs.reduce((s, p) => s + (p.so_dang_ky || 0), 0);
  const totalPTEnroll = ptPkgs.reduce((s, p) => s + (p.so_dang_ky || 0), 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={G.primaryDark} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Gói tập</Text>
          <Text style={styles.headerSub}>
            {gymPkgs.length} gói Gym · {ptPkgs.length} gói PT
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <Package color={G.white} size={18} strokeWidth={2} />
        </View>
      </View>

      {/* Summary row */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryVal}>{gymPkgs.length}</Text>
          <Text style={styles.summaryLabel}>Gói Gym</Text>
          <Text style={styles.summarySub}>{totalGymEnroll} đăng ký</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#e3f2fd' }]}>
          <Text style={[styles.summaryVal, { color: G.blue }]}>{ptPkgs.length}</Text>
          <Text style={styles.summaryLabel}>Gói PT</Text>
          <Text style={styles.summarySub}>{totalPTEnroll} đăng ký</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'gym' && styles.tabBtnActive]} onPress={() => setTab('gym')}>
          <Award color={tab === 'gym' ? G.primary : G.gray400} size={16} strokeWidth={2} />
          <Text style={[styles.tabText, tab === 'gym' && styles.tabTextActive]}>Gói Gym ({gymPkgs.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'pt' && styles.tabBtnActive]} onPress={() => setTab('pt')}>
          <Dumbbell color={tab === 'pt' ? G.primary : G.gray400} size={16} strokeWidth={2} />
          <Text style={[styles.tabText, tab === 'pt' && styles.tabTextActive]}>Gói PT ({ptPkgs.length})</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}><ActivityIndicator size="large" color={G.primary} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[G.primary]} tintColor={G.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {tab === 'gym' ? (
            gymPkgs.length === 0 ? (
              <View style={styles.emptyBox}>
                <Package color={G.gray300} size={48} strokeWidth={1} />
                <Text style={styles.emptyText}>Chưa có gói gym nào</Text>
              </View>
            ) : (
              gymPkgs.map((item, idx) => <GymPackageCard key={item.id} item={item} index={idx} />)
            )
          ) : (
            ptPkgs.length === 0 ? (
              <View style={styles.emptyBox}>
                <Dumbbell color={G.gray300} size={48} strokeWidth={1} />
                <Text style={styles.emptyText}>Chưa có gói PT nào</Text>
              </View>
            ) : (
              ptPkgs.map((item, idx) => <PTPackageCard key={item.id} item={item} index={idx} />)
            )
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
}

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

  summaryRow: { flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 8 },
  summaryCard: {
    flex: 1, backgroundColor: G.primaryLight, borderRadius: 14,
    padding: 14, alignItems: 'center',
  },
  summaryVal: { fontSize: 28, fontWeight: '900', color: G.primary },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: G.gray700, marginTop: 2 },
  summarySub: { fontSize: 11, color: G.gray400, marginTop: 2 },

  tabRow: {
    flexDirection: 'row', backgroundColor: G.white,
    borderBottomWidth: 1, borderBottomColor: G.gray100,
  },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: G.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: G.gray400 },
  tabTextActive: { color: G.primary },

  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  emptyBox: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: G.gray400, fontWeight: '600' },
});
