import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, RefreshControl, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import {
  CalendarCheck, ChevronRight, Search, TrendingUp, User, Users, X, Clock, Dumbbell,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { formatDate, unwrapData } from '../../utils/data';
import ProfileAvatar from '../../components/ProfileAvatar';
import { useTheme } from '../../context/ThemeContext';
import SwipePager from '../../components/SwipePager';

// ── Màu sắc ────────────────────────────────────────────────
const G = {
  primary: '#1D9336',
  primaryDark: '#155f27',
  primaryLight: '#e6f4ea',
  white: '#ffffff',
  gray50: '#f8faf8',
  gray100: '#f0f4f0',
  gray200: '#e4ebe4',
  gray400: '#9cad9c',
  gray900: '#1a221a',
  danger: '#dc3545',
};

export default function PTStudentsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await api.get('/pt/schedules/my-members');
      if (res.data?.success) {
        setStudents(res.data.data || []);
      }
    } catch (err) {
      console.error('[PTStudentsScreen] fetch error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStudents();
    }, [fetchStudents])
  );

  const onRefresh = () => { setRefreshing(true); fetchStudents(); };

  const handleFilterPress = () => {
    Alert.alert(
      'Bộ lọc trạng thái học viên',
      'Chọn điều kiện lọc học viên:',
      [
        { text: 'Tất cả', onPress: () => { setStatusFilter('all'); setPage(0); } },
        { text: 'Còn buổi tập', onPress: () => { setStatusFilter('active'); setPage(0); } },
        { text: 'Sắp hết buổi (≤ 3)', onPress: () => { setStatusFilter('warning'); setPage(0); } },
        { text: 'Hết buổi tập', onPress: () => { setStatusFilter('expired'); setPage(0); } },
        { text: 'Hủy bỏ', style: 'cancel' }
      ]
    );
  };

  // Lọc theo từ khóa tìm kiếm và trạng thái gói PT
  const filteredStudents = React.useMemo(() => {
    let result = students;
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim();
      result = result.filter(s => s.ho_ten?.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') {
      result = result.filter(s => {
        const left = s.buoi_con_lai ?? 0;
        if (statusFilter === 'active') return left > 0;
        if (statusFilter === 'warning') return left <= 3 && left > 0;
        if (statusFilter === 'expired') return left === 0;
        return true;
      });
    }
    return result.sort((a, b) => (a.ho_ten || '').localeCompare(b.ho_ten || ''));
  }, [students, searchText, statusFilter]);

  // Phân trang: mỗi trang 7 học viên
  const paginatedStudents = React.useMemo(() => {
    const pages = [];
    for (let i = 0; i < filteredStudents.length; i += 7) {
      pages.push(filteredStudents.slice(i, i + 7));
    }
    return pages.length > 0 ? pages : [[]];
  }, [filteredStudents]);

  React.useEffect(() => {
    if (page >= paginatedStudents.length) {
      setPage(0);
    }
  }, [paginatedStudents, page]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? colors.background : G.white} />

      {/* ── Header ────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Học viên của tôi</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            {statusFilter === 'all' ? 'Tất cả học viên' :
              statusFilter === 'active' ? 'Đang hoạt động' :
                statusFilter === 'warning' ? 'Sắp hết buổi' : 'Đã hết buổi'} ({filteredStudents.length})
          </Text>
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
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: statusFilter !== 'all' ? colors.primary : colors.primaryLight }]}
            onPress={handleFilterPress}
          >
            <Users color={statusFilter !== 'all' ? G.white : colors.primary} size={20} />
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

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : filteredStudents.length === 0 ? (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
          contentContainerStyle={[styles.scrollContent, { flexGrow: 1, justifyContent: 'center' }]}
        >
          <View style={styles.emptyBox}>
            <Users color={colors.textMuted} size={64} strokeWidth={1} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {searchText ? 'Không tìm thấy học viên' : 'Chưa có học viên'}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
              {searchText ? `Không có học viên nào khớp với “${searchText}”.` : 'Danh sách học viên đang hoạt động của bạn sẽ tự động hiển thị.'}
            </Text>
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <SwipePager
            data={paginatedStudents}
            pageSize={1}
            page={page}
            onPageChange={setPage}
            keyExtractor={(item, index) => String(index)}
            colors={colors}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
            }
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item: studentPage }) => (
              <View style={[styles.tableCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* Table Header */}
                <View style={[styles.tableHeaderRow, { backgroundColor: colors.surfaceVariant, borderBottomColor: colors.border }]}>
                  <Text style={[styles.thText, { flex: 2.2, color: colors.textSecondary }]}>Học viên</Text>
                  <Text style={[styles.thText, { flex: 1, color: colors.textSecondary, textAlign: 'center' }]}>Đã dạy</Text>
                  <Text style={[styles.thText, { flex: 1, color: colors.textSecondary, textAlign: 'center' }]}>Còn lại</Text>
                  <Text style={[styles.thText, { flex: 1.3, color: colors.textSecondary }]}>Tiếp theo</Text>
                </View>

                {/* Table Rows */}
                {studentPage.map((student, index) => {
                  const isWarning = student.buoi_con_lai <= 3 && student.buoi_con_lai > 0;
                  return (
                    <TouchableOpacity
                      key={student.dang_ky_id}
                      style={[styles.tableRow, { borderBottomColor: colors.border }]}
                      activeOpacity={0.7}
                      onPress={() => Alert.alert(
                        student.ho_ten || 'Học viên',
                        `Đã tập: ${student.so_buoi_da_tap}/${student.so_buoi_dang_ky} buổi\n⏰ Buổi tiếp theo: ${student.buoi_tap_sap_toi ? formatDate(student.buoi_tap_sap_toi) : 'Chưa xếp'}\n📊 Còn lại: ${student.buoi_con_lai ?? '—'} buổi`,
                        [{ text: 'Đóng', style: 'cancel' }]
                      )}
                    >
                      {/* Cột 1: Avatar + Tên */}
                      <View style={{ flex: 2.2, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <ProfileAvatar uri={student.avatar_url} name={student.ho_ten} size={32} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={[styles.rowTextBold, { color: colors.text }]} numberOfLines={1}>
                            {student.ho_ten}
                          </Text>
                          {isWarning ? (
                            <Text style={{ fontSize: 9, color: G.danger, fontWeight: '700' }}>Sắp hết hạn</Text>
                          ) : (
                            <Text style={{ fontSize: 9, color: colors.textMuted }} numberOfLines={1}>
                              {student.ten_goi_pt || 'Học viên'}
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Cột 2: Đã dạy */}
                      <Text style={[styles.rowText, { flex: 1, color: colors.text, textAlign: 'center' }]}>
                        {student.so_buoi_da_tap}
                      </Text>

                      {/* Cột 3: Còn lại */}
                      <Text style={[
                        styles.rowTextBold,
                        { flex: 1, color: student.buoi_con_lai <= 3 ? G.danger : colors.text, textAlign: 'center' }
                      ]}>
                        {student.buoi_con_lai ?? '—'}
                      </Text>

                      {/* Cột 4: Lịch tiếp theo */}
                      <View style={{ flex: 1.3, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        <Clock color={colors.textMuted} size={10} />
                        <Text style={[styles.rowText, { color: colors.text, fontSize: 11, flex: 1 }]} numberOfLines={1}>
                          {student.buoi_tap_sap_toi ? formatDate(student.buoi_tap_sap_toi).split(' ')[0] : 'Chưa xếp'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          />

          {/* Footer thông tin phân trang */}
          <View style={[styles.tableFooter, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
            <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
              Trang {page + 1}/{paginatedStudents.length}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>
              Đang hiển thị {Math.min((page + 1) * 7, filteredStudents.length)}/{filteredStudents.length} học viên
            </Text>
          </View>
        </View>
      )}
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

  tableCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  thText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  rowText: {
    fontSize: 13,
    fontWeight: '600',
  },
  rowTextBold: {
    fontSize: 13,
    fontWeight: '800',
  },
  tableFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
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
});
