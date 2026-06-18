import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, RefreshControl, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import {
  CalendarCheck, ChevronRight, Search, TrendingUp, User, Users, X,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { formatDate, unwrapData } from '../../utils/data';
import ProfileAvatar from '../../components/ProfileAvatar';
import { useTheme } from '../../context/ThemeContext';

// ── Màu sắc ────────────────────────────────────────────────
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
};

export default function PTStudentsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await api.get('/pt/schedules');
      setSchedules(unwrapData(res, []));
    } catch (err) {
      console.error('[PTStudentsScreen] fetch error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSchedules();
    }, [fetchSchedules])
  );

  const onRefresh = () => { setRefreshing(true); fetchSchedules(); };

  // Nhóm dữ liệu theo học viên
  const students = React.useMemo(() => {
    const map = new Map();
    schedules.forEach((item) => {
      if (!item.hoi_vien_id) return;
      const current = map.get(item.hoi_vien_id) || {
        id: item.hoi_vien_id,
        name: item.ten_hoi_vien,
        avatar: item.avatar_hoi_vien,
        total: 0,
        completed: 0,
        nextDate: null,
        remaining: item.buoi_con_lai,
      };
      current.total += 1;
      if (item.trang_thai === 'da_tap') current.completed += 1;
      if (item.trang_thai === 'cho_tap' && (!current.nextDate || item.ngay_tap < current.nextDate)) {
        current.nextDate = item.ngay_tap;
      }
      // Lấy số buổi còn lại mới nhất
      current.remaining = item.buoi_con_lai;
      map.set(item.hoi_vien_id, current);
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [schedules]);

  // Lọc theo từ khóa tìm kiếm
  const filteredStudents = React.useMemo(() => {
    if (!searchText.trim()) return students;
    const q = searchText.toLowerCase().trim();
    return students.filter(s => s.name?.toLowerCase().includes(q));
  }, [students, searchText]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? colors.background : G.white} />

      {/* ── Header ────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Học viên của tôi</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Bạn đang hướng dẫn {students.length} học viên</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: showSearch ? colors.primary : colors.primaryLight }]}
            onPress={() => { setShowSearch(v => !v); setSearchText(''); }}
          >
            {showSearch
              ? <X color={G.white} size={20} />
              : <Search color={colors.primary} size={20} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search bar ──────────────────── */}
      {showSearch && (
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Search color={colors.textMuted} size={16} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Tìm theo tên học viên..."
            placeholderTextColor={colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            autoFocus
          />
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : filteredStudents.length === 0 ? (
          <View style={styles.emptyBox}>
            <Users color={colors.textMuted} size={64} strokeWidth={1} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {searchText ? 'Không tìm thấy học viên' : 'Chưa có học viên'}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
              {searchText ? `Không có học viên nào khớp với “${searchText}”.` : 'Danh sách học viên sẽ tự động hiển thị khi có ca dạy được phân công.'}
            </Text>
          </View>
        ) : (
          filteredStudents.map((student) => (
            <TouchableOpacity
              key={student.id}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.7}
              onPress={() => Alert.alert(
                student.name || 'Hội viên',
                `✅ Đã tập: ${student.completed}/${student.total} buổi\n⏰ Buổi tiếp theo: ${student.nextDate ? formatDate(student.nextDate) : 'Chưa xếp'}\n📊 Còn lại: ${student.remaining ?? '—'} buổi`,
                [{ text: 'Đóng', style: 'cancel' }]
              )}
            >
              <View style={styles.cardTop}>
                <View style={styles.avatarBox}>
                  <ProfileAvatar uri={student.avatar} name={student.name} size={54} />
                  <View style={[styles.statusDot, { borderColor: colors.surface }]} />
                </View>
                <View style={styles.infoBox}>
                  <Text style={[styles.name, { color: colors.text }]}>{student.name || 'Hội viên'}</Text>
                  <View style={styles.idRow}>
                    <User color={colors.primary} size={11} strokeWidth={2.5} />
                    <Text style={[styles.idText, { color: colors.primary }]}>Hội viên chính thức</Text>
                  </View>
                </View>
                <ChevronRight color={colors.textMuted} size={18} strokeWidth={2} />
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <TrendingUp color={colors.primary} size={14} strokeWidth={2} />
                  <Text style={[styles.statVal, { color: colors.text }]}>{student.completed}/{student.total}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Buổi dạy</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                  <CalendarCheck color={colors.primary} size={14} strokeWidth={2} />
                  <Text style={[styles.statVal, { color: colors.text }]}>{student.remaining ?? '—'}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Còn lại</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statVal, { color: colors.text }]}>
                    {student.nextDate ? formatDate(student.nextDate) : '—'}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Tiếp theo</Text>
                </View>
              </View>

              {student.completed / student.total >= 0.8 && student.total > 0 && (
                <View style={styles.alertBox}>
                  <Text style={styles.alertText}>Sắp hoàn thành gói tập ({Math.round(student.completed/student.total*100)}%)</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: G.gray50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: G.white,
    borderBottomWidth: 1,
    borderBottomColor: G.gray100,
  },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: G.gray900 },
  headerSubtitle: { fontSize: 12, color: G.gray400, fontWeight: '500', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: G.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: { padding: 16, gap: 14 },
  center: { paddingVertical: 100, alignItems: 'center' },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },

  emptyBox: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: G.gray900 },
  emptyDesc: { fontSize: 13, color: G.gray400, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },

  card: {
    backgroundColor: G.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarBox: { position: 'relative' },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: G.primary,
    borderWidth: 2,
    borderColor: G.white,
  },
  infoBox: { flex: 1 },
  name: { fontSize: 17, fontWeight: '800', color: G.gray900, marginBottom: 2 },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  idText: { fontSize: 11, fontWeight: '700', color: G.primary },
  
  divider: { height: 1, backgroundColor: G.gray100, marginVertical: 16 },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: G.gray100 },
  statVal: { fontSize: 13, fontWeight: '800', color: G.primary },
  statLabel: { fontSize: 10, color: G.gray400, fontWeight: '600' },

  alertBox: {
    marginTop: 14,
    backgroundColor: '#fffbeb',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  alertText: { fontSize: 10, fontWeight: '700', color: '#a16207' },
});
