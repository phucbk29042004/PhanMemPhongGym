import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, RefreshControl, ScrollView,
  StatusBar, StyleSheet, Text,
  TouchableOpacity, View, Platform
} from 'react-native';
import {
  Award, Calendar, Dumbbell, Package, Tag, Users, Plus, Edit2, Trash2
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

function formatPrice(val) {
  if (val == null) return '—';
  return Number(val).toLocaleString('vi-VN') + 'đ';
}

// ── Package Card — Gym ────────────────────────────────────
function GymPackageCard({ item, index, expanded, onPress, onEdit, onDelete, colors, isDark }) {
  const palette = isDark ? [
    { bg: 'rgba(29, 147, 54, 0.15)', accent: colors.primary },
    { bg: 'rgba(21, 101, 192, 0.15)', accent: '#1565c0' },
    { bg: 'rgba(124, 58, 237, 0.15)', accent: '#7c3aed' },
    { bg: 'rgba(217, 119, 6, 0.15)', accent: '#d97706' },
  ] : [
    { bg: colors.primaryLight || '#e6f4ea', accent: colors.primary || '#1D9336' },
    { bg: '#e3f2fd', accent: '#1565c0' },
    { bg: '#f3e8ff', accent: '#7c3aed' },
    { bg: '#fffbeb', accent: '#d97706' },
  ];
  const c = palette[index % palette.length];

  return (
    <TouchableOpacity 
      style={[gpCard.wrap, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: c.accent, borderLeftWidth: 4 }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={gpCard.top}>
        <View style={[gpCard.iconBox, { backgroundColor: c.bg }]}>
          <Award color={c.accent} size={20} strokeWidth={2} />
        </View>
        <View style={gpCard.info}>
          <Text style={[gpCard.name, { color: colors.text }]} numberOfLines={1}>{item.ten_goi}</Text>
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
            <Calendar color={colors.textMuted} size={12} strokeWidth={2} />
            <Text style={[gpCard.detailText, { color: colors.textSecondary }]}>{item.so_thang} tháng{item.so_ngay_them > 0 ? ` +${item.so_ngay_them} ngày` : ''}</Text>
          </View>
        ) : null}
        {item.mo_ta ? (
          <Text style={[gpCard.desc, { color: colors.textSecondary }]} numberOfLines={2}>{item.mo_ta}</Text>
        ) : null}
      </View>

      {/* Hành động sửa/xóa gói Gym */}
      {expanded && (
        <View style={[gpCard.actions, { borderTopWidth: 1, borderTopColor: colors.border }]}>
          <TouchableOpacity 
            style={[gpCard.actionBtn, { borderColor: colors.primary }]} 
            onPress={() => onEdit(item)}
            activeOpacity={0.7}
          >
            <Edit2 color={colors.primary} size={12} strokeWidth={2.5} />
            <Text style={[gpCard.actionText, { color: colors.primary }]}>Chỉnh sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[gpCard.actionBtn, { borderColor: colors.danger }]} 
            onPress={() => onDelete(item)}
            activeOpacity={0.7}
          >
            <Trash2 color={colors.danger} size={12} strokeWidth={2.5} />
            <Text style={[gpCard.actionText, { color: colors.danger }]}>Xóa gói</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const gpCard = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    padding: 14, marginBottom: 8,
    borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 6, elevation: 1,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  price: { fontSize: 16, fontWeight: '800' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  detailRow: { gap: 4 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 12, fontWeight: '600' },
  desc: { fontSize: 12, lineHeight: 16 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12, paddingTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  actionText: { fontSize: 12, fontWeight: '700' },
});

// ── Package Card — PT ─────────────────────────────────────
function PTPackageCard({ item, index, expanded, onPress, onEdit, onDelete, colors, isDark }) {
  const palette = isDark ? [
    { bg: 'rgba(29, 147, 54, 0.15)', accent: colors.primary },
    { bg: 'rgba(234, 88, 12, 0.15)', accent: '#ea580c' },
    { bg: 'rgba(21, 101, 192, 0.15)', accent: '#1565c0' },
    { bg: 'rgba(124, 58, 237, 0.15)', accent: '#7c3aed' },
  ] : [
    { bg: colors.primaryLight || '#e6f4ea', accent: colors.primary || '#1D9336' },
    { bg: '#fff7ed', accent: '#ea580c' },
    { bg: '#e3f2fd', accent: '#1565c0' },
    { bg: '#f3e8ff', accent: '#7c3aed' },
  ];
  const c = palette[index % palette.length];

  return (
    <TouchableOpacity 
      style={[ptPkgCard.wrap, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: c.accent, borderLeftWidth: 4 }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={ptPkgCard.top}>
        <View style={[ptPkgCard.iconBox, { backgroundColor: c.bg }]}>
          <Dumbbell color={c.accent} size={20} strokeWidth={2} />
        </View>
        <View style={ptPkgCard.info}>
          <Text style={[ptPkgCard.name, { color: colors.text }]} numberOfLines={1}>{item.ten_goi_pt || item.ten_goi}</Text>
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
          <View style={[ptPkgCard.chip, { backgroundColor: colors.surfaceVariant }]}>
            <Tag color={colors.textSecondary} size={11} strokeWidth={2} />
            <Text style={[ptPkgCard.chipText, { color: colors.textSecondary }]}>{item.so_buoi} buổi</Text>
          </View>
        ) : null}
        {item.gia_moi_buoi ? (
          <View style={[ptPkgCard.chip, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[ptPkgCard.chipText, { color: colors.textSecondary }]}>{formatPrice(item.gia_moi_buoi)}/buổi</Text>
          </View>
        ) : null}
      </View>

      {item.mo_ta ? <Text style={[ptPkgCard.desc, { color: colors.textSecondary }]} numberOfLines={2}>{item.mo_ta}</Text> : null}

      {/* Hành động sửa/xóa gói PT */}
      {expanded && (
        <View style={[ptPkgCard.actions, { borderTopWidth: 1, borderTopColor: colors.border }]}>
          <TouchableOpacity 
            style={[ptPkgCard.actionBtn, { borderColor: colors.primary }]} 
            onPress={() => onEdit(item)}
            activeOpacity={0.7}
          >
            <Edit2 color={colors.primary} size={12} strokeWidth={2.5} />
            <Text style={[ptPkgCard.actionText, { color: colors.primary }]}>Chỉnh sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[ptPkgCard.actionBtn, { borderColor: colors.danger }]} 
            onPress={() => onDelete(item)}
            activeOpacity={0.7}
          >
            <Trash2 color={colors.danger} size={12} strokeWidth={2.5} />
            <Text style={[ptPkgCard.actionText, { color: colors.danger }]}>Xóa gói</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const ptPkgCard = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    padding: 14, marginBottom: 8,
    borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 6, elevation: 1,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  price: { fontSize: 16, fontWeight: '800' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  chipText: { fontSize: 11, fontWeight: '600' },
  desc: { fontSize: 12, lineHeight: 16 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12, paddingTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  actionText: { fontSize: 12, fontWeight: '700' },
});

// ── Màn hình chính ────────────────────────────────────────
export default function AdminPackagesScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [gymPkgs, setGymPkgs] = useState([]);
  const [ptPkgs, setPtPkgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('gym'); // 'gym' | 'pt'
  const [expandedId, setExpandedId] = useState(null);

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

  const handleDeletePackage = (item, isPt) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa gói tập "${item.ten_goi || item.ten_goi_pt}"? Giao dịch cũ vẫn sẽ được lưu trữ, nhưng hội viên mới sẽ không thể đăng ký gói này nữa.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const url = isPt ? `/packages/pt/${item.id}` : `/packages/${item.id}`;
              const res = await api.delete(url);
              if (res.data?.success) {
                Alert.alert('Thành công', 'Đã xóa gói tập thành công.');
                fetchPackages();
              } else {
                Alert.alert('Lỗi', res.data?.message || 'Không thể xóa gói tập.');
              }
            } catch (err) {
              console.error('[AdminPackages] delete error:', err?.message);
              Alert.alert('Lỗi', err?.response?.data?.message || 'Có lỗi xảy ra khi xóa gói tập.');
            }
          }
        }
      ]
    );
  };

  const totalGymEnroll = gymPkgs.reduce((s, p) => s + (p.so_dang_ky || 0), 0);
  const totalPTEnroll = ptPkgs.reduce((s, p) => s + (p.so_dang_ky || 0), 0);

  const gymBg = isDark ? 'rgba(29, 147, 54, 0.15)' : colors.primaryLight;
  const ptBg = isDark ? 'rgba(21, 101, 192, 0.15)' : '#e3f2fd';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primaryDark }]}>
        <View>
          <Text style={styles.headerTitle}>Gói tập</Text>
          <Text style={styles.headerSub}>
            {gymPkgs.length} gói Gym · {ptPkgs.length} gói PT
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.addBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => navigation.navigate('AdminAddEditPackage', { isPtPackage: tab === 'pt' })}
          >
            <Plus color="#ffffff" size={20} />
          </TouchableOpacity>
          <View style={styles.headerBadge}>
            <Package color="#ffffff" size={18} strokeWidth={2} />
          </View>
        </View>
      </View>

      {/* Summary row */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: gymBg, borderColor: colors.border }]}>
          <Text style={[styles.summaryVal, { color: colors.primary }]}>{gymPkgs.length}</Text>
          <Text style={[styles.summaryLabel, { color: colors.text }]}>Gói Gym</Text>
          <Text style={[styles.summarySub, { color: colors.textSecondary }]}>{totalGymEnroll} đăng ký</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: ptBg, borderColor: colors.border }]}>
          <Text style={[styles.summaryVal, { color: '#1565c0' }]}>{ptPkgs.length}</Text>
          <Text style={[styles.summaryLabel, { color: colors.text }]}>Gói PT</Text>
          <Text style={[styles.summarySub, { color: colors.textSecondary }]}>{totalPTEnroll} đăng ký</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.tabBtn, tab === 'gym' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} 
          onPress={() => { setTab('gym'); setExpandedId(null); }}
        >
          <Award color={tab === 'gym' ? colors.primary : colors.textMuted} size={16} strokeWidth={2} />
          <Text style={[styles.tabText, { color: tab === 'gym' ? colors.primary : colors.textSecondary, fontWeight: tab === 'gym' ? '700' : '600' }]}>Gói Gym ({gymPkgs.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, tab === 'pt' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} 
          onPress={() => { setTab('pt'); setExpandedId(null); }}
        >
          <Dumbbell color={tab === 'pt' ? colors.primary : colors.textMuted} size={16} strokeWidth={2} />
          <Text style={[styles.tabText, { color: tab === 'pt' ? colors.primary : colors.textSecondary, fontWeight: tab === 'pt' ? '700' : '600' }]}>Gói PT ({ptPkgs.length})</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {tab === 'gym' ? (
            gymPkgs.length === 0 ? (
              <View style={styles.emptyBox}>
                <Package color={colors.textMuted} size={48} strokeWidth={1} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>Chưa có gói gym nào</Text>
              </View>
            ) : (
              gymPkgs.map((item, idx) => (
                <GymPackageCard 
                  key={item.id} 
                  item={item} 
                  index={idx} 
                  expanded={expandedId === item.id}
                  onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  onEdit={(pkg) => navigation.navigate('AdminAddEditPackage', { isPtPackage: false, packageId: pkg.id })}
                  onDelete={(pkg) => handleDeletePackage(pkg, false)}
                  colors={colors}
                  isDark={isDark}
                />
              ))
            )
          ) : (
            ptPkgs.length === 0 ? (
              <View style={styles.emptyBox}>
                <Dumbbell color={colors.textMuted} size={48} strokeWidth={1} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>Chưa có gói PT nào</Text>
              </View>
            ) : (
              ptPkgs.map((item, idx) => (
                <PTPackageCard 
                  key={item.id} 
                  item={item} 
                  index={idx} 
                  expanded={expandedId === item.id}
                  onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  onEdit={(pkg) => navigation.navigate('AdminAddEditPackage', { isPtPackage: true, packageId: pkg.id })}
                  onDelete={(pkg) => handleDeletePackage(pkg, true)}
                  colors={colors}
                  isDark={isDark}
                />
              ))
            )
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
}

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

  summaryRow: { flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 8 },
  summaryCard: {
    flex: 1, borderRadius: 14,
    padding: 14, alignItems: 'center',
    borderWidth: 1,
  },
  summaryVal: { fontSize: 28, fontWeight: '900' },
  summaryLabel: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  summarySub: { fontSize: 11, marginTop: 2 },

  tabRow: {
    flexDirection: 'row', borderBottomWidth: 1,
  },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  tabText: { fontSize: 13 },

  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  emptyBox: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '600' },
});
