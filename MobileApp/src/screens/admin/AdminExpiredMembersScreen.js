import React, { useCallback, useState, useEffect } from 'react';
import {
  ActivityIndicator, Alert, FlatList, RefreshControl,
  StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View, Platform
} from 'react-native';
import {
  AlertCircle, CheckCircle2, Clock, Search, User, X, Bell, Award, ArrowLeft
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

function formatDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysDiff(den_ngay) {
  if (!den_ngay) return 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const end = new Date(den_ngay); end.setHours(0, 0, 0, 0);
  return Math.round((end - today) / 86400000);
}

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

export default function AdminExpiredMembersScreen({ navigation, route }) {
  const defaultTab = route.params?.filter === 'expiring' ? 'expiring' : 'expired';
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [activeTab, setActiveTab] = useState(defaultTab); // 'expired' | 'expiring'
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [sendingNotifId, setSendingNotifId] = useState(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'expired' ? '/members/expired' : '/members/expiring?days=7';
      const res = await api.get(endpoint);
      if (res.data?.success) {
        setMembers(res.data.data || []);
      }
    } catch (err) {
      console.error('[ExpiredMembers] fetch error:', err?.message);
      Alert.alert('Lỗi', 'Không thể tải danh sách hội viên.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMembers();
  };

  const handleSendNotification = async (item) => {
    setSendingNotifId(item.id);
    const isExpired = activeTab === 'expired';
    const title = isExpired ? 'Gói tập của bạn đã hết hạn' : 'Gói tập của bạn sắp hết hạn';
    const body = isExpired
      ? `Xin chào ${item.ho_ten}, gói tập Gym của bạn đã hết hạn. Hãy ghé thăm phòng tập để gia hạn ngay hôm nay!`
      : `Xin chào ${item.ho_ten}, gói tập Gym của bạn sắp hết hạn. Hãy gia hạn để không bị gián đoạn lịch tập!`;

    try {
      const res = await api.post(`/members/${item.id}/notify`, { title, body });
      if (res.data?.success) {
        Alert.alert('Thành công', `Đã gửi thông báo nhắc gia hạn đến hội viên ${item.ho_ten}.`);
      } else {
        Alert.alert('Lỗi', res.data?.message || 'Không thể gửi thông báo.');
      }
    } catch (err) {
      console.error('[ExpiredMembers] notify error:', err?.message);
      Alert.alert('Lỗi', err.response?.data?.message || 'Có lỗi khi gửi thông báo.');
    } finally {
      setSendingNotifId(null);
    }
  };

  const handleRenew = (item) => {
    // Navigate to AdminRegisterPackage with member and basic activePkg mock
    const activePkgMock = item.ten_goi_tap ? {
      ten_goi: item.ten_goi_tap,
      den_ngay: item.ngay_het_han,
      gia_thuc_te: 0 // Will fallback
    } : null;

    navigation.navigate('AdminRegisterPackage', {
      member: {
        id: item.id,
        ho_ten: item.ho_ten,
        ma_ho_so: item.ma_ho_so,
        so_dien_thoai: item.so_dien_thoai
      },
      activePkg: activePkgMock
    });
  };

  const filtered = members.filter(m => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      m.ho_ten?.toLowerCase().includes(q) ||
      m.so_dien_thoai?.includes(q) ||
      m.ma_ho_so?.toLowerCase().includes(q)
    );
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: insets.top, height: 60 + insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <ArrowLeft color={colors.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Hết hạn & Sắp hết hạn</Text>
        <View style={styles.headerBtn} />
      </View>

      {/* Tab Selectors */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expired' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
          onPress={() => setActiveTab('expired')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'expired' ? colors.primary : colors.textSecondary }]}>Đã hết hạn</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expiring' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
          onPress={() => setActiveTab('expiring')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'expiring' ? colors.primary : colors.textSecondary }]}>Sắp hết hạn (7 ngày)</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
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
            <TouchableOpacity onPress={() => setSearch('')}>
              <X color={colors.textMuted} size={14} strokeWidth={2} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Members List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          renderItem={({ item }) => {
            const diff = daysDiff(item.ngay_het_han);
            return (
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <Avatar name={item.ho_ten} />
                  <View style={styles.cardInfo}>
                    <Text style={[styles.name, { color: colors.text }]}>{item.ho_ten}</Text>
                    <Text style={[styles.sub, { color: colors.textSecondary }]}>{item.ma_ho_so} • {item.so_dien_thoai || '—'}</Text>
                  </View>
                  <View style={styles.badgeWrapper}>
                    {activeTab === 'expired' ? (
                      <View style={[styles.badge, { backgroundColor: colors.dangerLight }]}>
                        <AlertCircle color={colors.danger} size={12} />
                        <Text style={[styles.badgeText, { color: colors.danger }]}>Trễ {-diff}N</Text>
                      </View>
                    ) : (
                      <View style={[styles.badge, { backgroundColor: '#fffbeb' }]}>
                        <Clock color="#d97706" size={12} />
                        <Text style={[styles.badgeText, { color: '#d97706' }]}>Còn {diff}N</Text>
                      </View>
                    )}
                  </View>
                </View>

                {item.ten_goi_tap && (
                  <View style={[styles.packageDetails, { backgroundColor: colors.background }]}>
                    <Award size={14} color={colors.primary} />
                    <Text style={[styles.packageText, { color: colors.textSecondary }]}>
                      Gói: <Text style={{ color: colors.text, fontWeight: '700' }}>{item.ten_goi_tap}</Text> (Hết hạn: {formatDate(item.ngay_het_han)})
                    </Text>
                  </View>
                )}

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.primaryLight, flex: 1 }]}
                    onPress={() => handleSendNotification(item)}
                    disabled={sendingNotifId === item.id}
                  >
                    {sendingNotifId === item.id ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <Bell size={14} color={colors.primary} />
                        <Text style={[styles.actionBtnText, { color: colors.primary }]}>Gửi thông báo</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.primary, flex: 1 }]}
                    onPress={() => handleRenew(item)}
                  >
                    <Text style={[styles.actionBtnText, { color: '#ffffff', fontWeight: '800' }]}>Gia hạn ngay</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <User color={colors.textMuted} size={48} strokeWidth={1} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Không tìm thấy hội viên nào</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  tabContainer: {
    flexDirection: 'row',
    height: 50,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 6,
  },
  searchInput: { flex: 1, fontSize: 14 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '600' },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.01,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardInfo: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
  },
  sub: {
    fontSize: 11,
    marginTop: 2,
  },
  badgeWrapper: {
    alignItems: 'flex-end',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  packageDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  packageText: {
    fontSize: 11,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    height: 38,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
