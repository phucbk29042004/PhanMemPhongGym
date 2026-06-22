import React, { useCallback, useState, useEffect } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform,
  RefreshControl, ScrollView, StatusBar, StyleSheet, Text,
  TextInput, TouchableOpacity, View, FlatList,
} from 'react-native';
import {
  CalendarCheck, Clock, Dumbbell,
  Filter, Info, MapPin, Plus, X, Zap, ChevronDown,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { formatDate, scheduleStatusLabel, unwrapData } from '../../utils/data';
import ProfileAvatar from '../../components/ProfileAvatar';
import { useTheme } from '../../context/ThemeContext';
import DatePickerField from '../../components/DatePickerField';
import SwipePager from '../../components/SwipePager';

// ── Tạo danh sách giờ từ 06:00 đến 21:00 mỗi 30 phút ──────────
function buildTimeOptions(fromHour = 6, toHour = 21) {
  const times = [];
  for (let h = fromHour; h <= toHour; h++) {
    times.push(`${String(h).padStart(2, '0')}:00`);
    if (h < toHour) times.push(`${String(h).padStart(2, '0')}:30`);
  }
  return times;
}

const START_TIMES = buildTimeOptions(6, 21);
const END_TIMES   = buildTimeOptions(6, 22);

// ── Custom Time Picker ──────────────────────────────────────────
function TimePickerModal({ visible, times, selected, onSelect, onClose, title, colors, checkDisabled }) {
  const tp = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
    sheet: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', zIndex: 99999 },
    header: { flexDirection: 'row', alignItems: 'center', justifyBetween: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
    title: { fontSize: 15, fontWeight: '800' },
    item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 16, width: '100%' },
    itemText: { fontSize: 15, fontWeight: '600', flex: 1 },
    check: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={tp.overlay}>
        {/* Lớp nền bắt chạm ra ngoài để đóng modal */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        
        {/* Hộp thoại Modal thực tế */}
        <View style={[tp.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' }}>
            <Text style={[tp.title, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={times}
            keyExtractor={(t) => t}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 320 }}
            renderItem={({ item }) => {
              const isSelected = item === selected;
              const isDisabled = checkDisabled ? checkDisabled(item) : false;
              return (
                <TouchableOpacity
                  style={[
                    tp.item,
                    isSelected && { backgroundColor: colors.primaryLight },
                    isDisabled && { opacity: 0.4 }
                  ]}
                  onPress={() => {
                    if (isDisabled) return;
                    onSelect(item);
                    onClose();
                  }}
                  disabled={isDisabled}
                  activeOpacity={0.7}
                >
                  <Clock color={isSelected ? colors.primary : colors.textMuted} size={14} />
                  <Text style={[
                    tp.itemText,
                    { color: isSelected ? colors.primary : colors.text },
                    isDisabled && { color: colors.textMuted, textDecorationLine: 'line-through' }
                  ]}>
                    {item} {isDisabled ? '(K.dụng)' : ''}
                  </Text>
                  {isSelected && (
                    <View style={[tp.check, { backgroundColor: colors.primary }]}>
                      <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

// ── TimeSelector Button ─────────────────────────────────────────
function TimeSelector({ label, value, onPress, colors, required }) {
  const stylesLocal = StyleSheet.create({
    label: { fontSize: 12, fontWeight: '600', marginTop: 8, marginBottom: 4 },
    timeSelectorBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 12,
      gap: 8,
    },
    timeSelectorText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
    },
  });

  return (
    <View style={{ flex: 1 }}>
      <Text style={[stylesLocal.label, { color: colors.textSecondary }]}>
        {label}{required && <Text style={{ color: '#ba1a1a', fontWeight: '700' }}> *</Text>}
      </Text>
      <TouchableOpacity
        style={[stylesLocal.timeSelectorBtn, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Clock color={colors.textMuted} size={16} />
        <Text style={[stylesLocal.timeSelectorText, { color: colors.text }]}>{value}</Text>
        <ChevronDown color={colors.textMuted} size={16} />
      </TouchableOpacity>
    </View>
  );
}

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
  warning: '#f59e0b',
  warningLight: '#fffbeb',
};

const todayYMD = () => new Date().toISOString().slice(0, 10);

export default function PTScheduleScreen() {
  const { colors, isDark } = useTheme();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteEditingId, setNoteEditingId] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [members, setMembers] = useState([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [newDate, setNewDate] = useState(todayYMD());
  const [newStart, setNewStart] = useState('08:00');
  const [newEnd, setNewEnd] = useState('09:00');
  const [newNote, setNewNote] = useState('');
  const [creating, setCreating] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  // State phục vụ Bộ lọc & Phân trang vuốt ngang
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);

  const handleFilterPress = () => {
    Alert.alert(
      'Bộ lọc trạng thái',
      'Chọn trạng thái lịch dạy bạn muốn hiển thị:',
      [
        { text: 'Tất cả', onPress: () => { setStatusFilter('all'); setPage(0); } },
        { text: 'Chờ tập', onPress: () => { setStatusFilter('cho_tap'); setPage(0); } },
        { text: 'Đã tập', onPress: () => { setStatusFilter('da_tap'); setPage(0); } },
        { text: 'Đã hủy', onPress: () => { setStatusFilter('da_huy'); setPage(0); } },
        { text: 'Hủy bỏ', style: 'cancel' }
      ]
    );
  };

  const isTimeSlotDisabled = (time) => {
    const today = new Date();
    const todayYMD = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Chặn hoàn toàn nếu chọn ngày quá khứ
    if (newDate < todayYMD) {
      return true;
    }

    // Nếu chọn ngày hôm nay, chặn các mốc giờ trong quá khứ hoặc cách giờ hiện tại dưới 5 phút
    if (newDate === todayYMD) {
      const [h, m] = time.split(':').map(Number);
      const nowH = today.getHours();
      const nowM = today.getMinutes();
      if (h < nowH || (h === nowH && m <= nowM)) {
        return true;
      }
    }

    // Chặn trùng lịch của PT (hlv đang đăng nhập)
    if (schedules && schedules.length > 0) {
      const [h, m] = time.split(':').map(Number);
      let eh = h + 1;
      let em = m;
      const timeEnd = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;

      const conflictPT = schedules.some(s => {
        if (s.trang_thai === 'da_huy') return false;
        const sDateYMD = s.ngay_tap ? s.ngay_tap.split('T')[0] : '';
        if (sDateYMD !== newDate) return false;
        return time < s.gio_ket_thuc && timeEnd > s.gio_bat_dau;
      });
      if (conflictPT) return true;
    }

    return false;
  };

  const isEndTimeSlotDisabled = (time) => {
    if (time <= newStart) return true;
    
    // Chặn trùng lịch của PT trong khoảng từ newStart đến time
    if (schedules && schedules.length > 0) {
      const conflictPT = schedules.some(s => {
        if (s.trang_thai === 'da_huy') return false;
        const sDateYMD = s.ngay_tap ? s.ngay_tap.split('T')[0] : '';
        if (sDateYMD !== newDate) return false;
        return newStart < s.gio_ket_thuc && time > s.gio_bat_dau;
      });
      if (conflictPT) return true;
    }

    return false;
  };

  const handleSelectStart = (t) => {
    setNewStart(t);
    const [h, m] = t.split(':').map(Number);
    let nh = h + 1;
    const auto = `${String(nh).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    if (END_TIMES.includes(auto)) setNewEnd(auto);
  };

  // Tự động gán giờ bắt đầu hợp lệ đầu tiên khi PT thay đổi ngày đặt lịch
  useEffect(() => {
    if (!createModalVisible) return;
    const today = new Date();
    const todayYMD = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const isToday = newDate === todayYMD;
    const nowH = today.getHours();
    const nowM = today.getMinutes();

    let foundStart = null;
    for (const t of START_TIMES) {
      if (isToday) {
        const [h, m] = t.split(':').map(Number);
        if (h < nowH || (h === nowH && m <= nowM)) continue;
      }
      
      const [h, m] = t.split(':').map(Number);
      let eh = h + 1;
      const tEnd = `${String(eh).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      
      // Chỉ check trùng giờ với các buổi dạy CÓ THẬT và KHÔNG bị hủy
      const overlapping = schedules.some(s => {
        if (s.trang_thai === 'da_huy') return false;
        const sDateYMD = s.ngay_tap ? s.ngay_tap.split('T')[0] : '';
        if (sDateYMD !== newDate) return false;
        return t < s.gio_ket_thuc && tEnd > s.gio_bat_dau;
      });
      if (overlapping) continue;

      foundStart = t;
      break;
    }

    if (foundStart) {
      setNewStart(foundStart);
      const [h, m] = foundStart.split(':').map(Number);
      let nh = h + 1;
      setNewEnd(`${String(nh).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    } else {
      // Nếu không tìm thấy slot trống tự động thì đặt giá trị trống thay vì hardcode để tránh lỗi chặn picker
      setNewStart('');
      setNewEnd('');
    }
  }, [newDate, createModalVisible, schedules]);

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await api.get('/pt/schedules');
      setSchedules(unwrapData(res, []));
    } catch (err) {
      console.error('[PTScheduleScreen] fetch error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await api.get('/pt/schedules/my-members');
      if (res.data?.success) {
        setMembers(res.data.data || []);
      }
    } catch (err) {
      console.error('[PTScheduleScreen] fetchMembers error:', err?.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSchedules();
      fetchMembers();
    }, [fetchSchedules, fetchMembers])
  );

  const onRefresh = () => { setRefreshing(true); fetchSchedules(); };

  const confirmSchedule = (id) => {
    Alert.alert(
      'Xác nhận buổi tập',
      'Xác nhận học viên đã hoàn thành buổi tập này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            setActionLoadingId(id);
            try {
              const res = await api.put(`/pt/schedules/${id}/confirm`);
              if (res.data?.success) {
                const { bothConfirmed } = res.data.data;
                if (bothConfirmed) {
                  Alert.alert('Thành công', 'Buổi tập đã được cả 2 bên xác nhận hoàn thành!');
                } else {
                  Alert.alert('Đã ghi nhận', 'Đã ghi nhận xác nhận của bạn. Buổi tập sẽ hoàn thành khi học viên xác nhận.');
                }
              }
              await fetchSchedules();
            } catch (err) {
              Alert.alert('Lỗi', err?.displayMessage || 'Có lỗi xảy ra.');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const cancelSchedule = (id) => {
    Alert.alert(
      'Hủy buổi tập',
      'Bạn có chắc chắn muốn hủy buổi tập này? Học viên sẽ được thông báo và buổi sẽ được đánh dấu là đã hủy.',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy buổi tập',
          style: 'destructive',
          onPress: async () => {
            setActionLoadingId(id);
            try {
              await api.put(`/pt/schedules/${id}/cancel`);
              await fetchSchedules();
            } catch (err) {
              Alert.alert('Lỗi', err?.displayMessage || 'Có lỗi xảy ra.');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const openNoteEditor = (item) => {
    setNoteEditingId(item.id);
    setNoteText(item.ghi_chu || '');
    setNoteModalVisible(true);
  };

  const saveNote = async () => {
    if (!noteEditingId) return;
    setNoteSaving(true);
    try {
      await api.patch(`/pt/schedules/${noteEditingId}/note`, { ghi_chu: noteText });
      setSchedules((prev) => prev.map((s) => s.id === noteEditingId ? { ...s, ghi_chu: noteText } : s));
      setNoteModalVisible(false);
    } catch (err) {
      Alert.alert('Lỗi', err?.displayMessage || 'Có lỗi xảy ra.');
    } finally {
      setNoteSaving(false);
    }
  };

  // Nhóm lịch tập theo ngày và chia thành các cụm 3 ngày
  const paginatedDays = React.useMemo(() => {
    const filtered = schedules.filter(item => statusFilter === 'all' || item.trang_thai === statusFilter);
    const groups = {};
    filtered.forEach(s => {
      const d = s.ngay_tap ? s.ngay_tap.split('T')[0] : 'Chưa xác định';
      if (!groups[d]) groups[d] = [];
      groups[d].push(s);
    });

    const dayEntries = Object.entries(groups).sort((a, b) => {
      if (a[0] === 'Chưa xác định') return 1;
      if (b[0] === 'Chưa xác định') return -1;
      return new Date(b[0]) - new Date(a[0]);
    });

    const pages = [];
    for (let i = 0; i < dayEntries.length; i += 3) {
      pages.push(dayEntries.slice(i, i + 3));
    }
    return pages.length > 0 ? pages : [[]];
  }, [schedules, statusFilter]);

  React.useEffect(() => {
    if (page >= paginatedDays.length) {
      setPage(0);
    }
  }, [paginatedDays, page]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? colors.background : G.white} />
      
      {/* ── Header ────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Lịch dạy cá nhân</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            {statusFilter === 'all' ? 'Tất cả trạng thái' :
             statusFilter === 'cho_tap' ? 'Chỉ ca Chờ tập' :
             statusFilter === 'da_tap' ? 'Chỉ ca Đã tập' : 'Chỉ ca Đã hủy'} ({schedules.filter(item => statusFilter === 'all' || item.trang_thai === statusFilter).length} ca)
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.primaryLight }]} onPress={() => setCreateModalVisible(true)} activeOpacity={0.8}>
            <Plus color={colors.primary} size={18} strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.filterBtn, 
              { backgroundColor: statusFilter !== 'all' ? colors.primary : colors.primaryLight }
            ]} 
            onPress={handleFilterPress}
            activeOpacity={0.8}
          >
            <Filter color={statusFilter !== 'all' ? '#fff' : colors.primary} size={20} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={G.primary} size="large" />
        </View>
      ) : schedules.filter(item => statusFilter === 'all' || item.trang_thai === statusFilter).length === 0 ? (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[G.primary]} tintColor={G.primary} />}
          contentContainerStyle={[styles.scrollContent, { flexGrow: 1, justifyContent: 'center' }]}
        >
          <View style={styles.emptyBox}>
            <CalendarCheck color={G.gray300} size={64} strokeWidth={1} />
            <Text style={styles.emptyTitle}>Chưa có lịch dạy</Text>
            <Text style={styles.emptyDesc}>Không tìm thấy buổi tập nào khớp với bộ lọc của bạn.</Text>
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <SwipePager
            data={paginatedDays}
            pageSize={1}
            page={page}
            onPageChange={setPage}
            keyExtractor={(item, index) => String(index)}
            colors={colors}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[G.primary]} tintColor={G.primary} />
            }
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item: dayGroup }) => (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
                {dayGroup.map(([dateStr, items]) => {
                  const dayObj = dateStr !== 'Chưa xác định' ? new Date(dateStr) : null;
                  const weekday = dayObj ? dayObj.toLocaleDateString('vi-VN', { weekday: 'long' }) : '';
                  const formattedDate = dayObj ? dayObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : dateStr;

                  return (
                    <View key={dateStr} style={[styles.dayContainer, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 12, gap: 8 }]}>
                      {/* Tiêu đề ngày */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <View style={{ width: 4, height: 16, borderRadius: 2, backgroundColor: colors.primary }} />
                        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text, textTransform: 'capitalize' }}>
                          {weekday ? `${weekday}, ` : ''}{formattedDate}
                        </Text>
                        <View style={{ backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: colors.primary }}>{items.length} ca</Text>
                        </View>
                      </View>

                      {/* Scroll ngang các Card lịch */}
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
                        {items.sort((a, b) => (a.gio_bat_dau || '').localeCompare(b.gio_bat_dau || '')).map(item => (
                          <View key={item.id} style={[
                            styles.horizontalCard, 
                            { backgroundColor: colors.surfaceVariant, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 10, width: 280 },
                            item.trang_thai === 'da_tap' && { opacity: 0.8 },
                            item.trang_thai === 'da_huy' && { opacity: 0.6 }
                          ]}>
                            {/* Card Header */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Clock color={colors.textMuted} size={12} />
                                <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text }}>
                                  {item.gio_bat_dau} - {item.gio_ket_thuc}
                                </Text>
                              </View>
                              {/* Badge */}
                              <View style={[
                                styles.statusBadge,
                                item.trang_thai === 'cho_tap' && (item.pt_xac_nhan === 1 || item.hv_xac_nhan === 1) ? { backgroundColor: colors.warningLight } : (item.trang_thai === 'cho_tap' ? styles.statusBadgePending : {}),
                                item.trang_thai === 'da_tap' && styles.statusBadgeDone,
                                item.trang_thai === 'da_huy' && styles.statusBadgeFail,
                                { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6 }
                              ]}>
                                <Text style={[
                                  styles.statusText,
                                  { fontSize: 10 },
                                  item.trang_thai === 'cho_tap' && (item.pt_xac_nhan === 1 || item.hv_xac_nhan === 1) ? { color: colors.warning } : (item.trang_thai === 'cho_tap' ? { color: G.warning } : {}),
                                  item.trang_thai === 'da_tap' && { color: G.primary },
                                  item.trang_thai === 'da_huy' && { color: G.danger },
                                ]}>
                                  {item.trang_thai === 'cho_tap' ? (
                                    item.pt_xac_nhan === 1 && item.hv_xac_nhan === 0 ? 'Chờ HV' :
                                    item.hv_xac_nhan === 1 && item.pt_xac_nhan === 0 ? 'Chờ bạn' : 'Chờ tập'
                                  ) : scheduleStatusLabel(item.trang_thai)}
                                </Text>
                              </View>
                            </View>

                            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />

                            {/* Card Body */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <ProfileAvatar uri={item.avatar_hoi_vien} name={item.ten_hoi_vien} size={36} />
                              <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }} numberOfLines={1}>
                                  {item.ten_hoi_vien}
                                </Text>
                                <Text style={{ fontSize: 10, color: colors.textMuted }} numberOfLines={1}>
                                  {item.loai_buoi === 'ca_nhan' ? 'Cá nhân' : 'Nhóm'} • Còn {item.buoi_con_lai ?? '—'} buổi
                                </Text>
                              </View>
                            </View>

                            {item.ghi_chu ? (
                              <View style={{ marginTop: 8, padding: 6, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
                                <Text style={{ fontSize: 11, color: colors.textSecondary }} numberOfLines={2}>{item.ghi_chu}</Text>
                              </View>
                            ) : null}

                            {/* Card Actions */}
                            {item.trang_thai === 'cho_tap' && (
                              <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
                                <TouchableOpacity 
                                  style={[styles.smallActionBtn, { borderColor: G.danger, borderWidth: 1, borderRadius: 8, paddingVertical: 4, flex: 1, alignItems: 'center' }]} 
                                  onPress={() => cancelSchedule(item.id)}
                                  disabled={actionLoadingId === item.id}
                                >
                                  <Text style={{ color: G.danger, fontSize: 11, fontWeight: '700' }}>Hủy</Text>
                                </TouchableOpacity>
                                
                                {item.pt_xac_nhan === 0 ? (
                                  <TouchableOpacity 
                                    style={[styles.smallActionBtn, { backgroundColor: colors.primary, borderColor: colors.primary, borderWidth: 1, borderRadius: 8, paddingVertical: 4, flex: 1.5, alignItems: 'center' }]} 
                                    onPress={() => confirmSchedule(item.id)}
                                    disabled={actionLoadingId === item.id}
                                  >
                                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Xong</Text>
                                  </TouchableOpacity>
                                ) : (
                                  <View style={[styles.smallActionBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, borderWidth: 1, borderRadius: 8, paddingVertical: 4, flex: 1.5, alignItems: 'center', justifyContent: 'center' }]}>
                                    <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '600', textAlign: 'center' }}>Chờ HV</Text>
                                  </View>
                                )}

                                <TouchableOpacity 
                                  style={[styles.smallActionBtn, { borderColor: colors.primary, borderWidth: 1, borderRadius: 8, paddingVertical: 4, flex: 1, alignItems: 'center' }]} 
                                  onPress={() => openNoteEditor(item)}
                                >
                                  <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Note</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          />
          {/* Footer thông tin phân trang */}
          <View style={[styles.tableFooter, { borderTopColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 20, borderTopWidth: 1 }]}>
            <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
              Trang {page + 1}/{paginatedDays.length}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>
              Hiển thị {paginatedDays[page] ? paginatedDays[page].length : 0} ngày gần nhất
            </Text>
          </View>
        </View>
      )}

      <Modal
        visible={noteModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Ghi chú buổi tập</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Nhập ghi chú buổi tập"
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtnCancel, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setNoteModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalBtnCancelText, { color: colors.textSecondary }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnSave}
                onPress={saveNote}
                disabled={noteSaving}
                activeOpacity={0.8}
              >
                {noteSaving ? (
                  <ActivityIndicator color={G.white} size="small" />
                ) : (
                  <Text style={styles.modalBtnSaveText}>Lưu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Thêm lịch tập</Text>
            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Học viên</Text>
            <ScrollView style={styles.memberList} nestedScrollEnabled>
              {members.length === 0 ? (
                <Text style={[styles.memberEmpty, { color: colors.textMuted }]}>Không có học viên đang đăng ký PT</Text>
              ) : members.map((member) => (
                <TouchableOpacity
                  key={member.dang_ky_id}
                  style={[
                    styles.memberItem,
                    { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                    selectedRegistration === member.dang_ky_id && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => setSelectedRegistration(member.dang_ky_id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.memberName, { color: selectedRegistration === member.dang_ky_id ? colors.primary : colors.text }]}>{member.ho_ten}</Text>
                  <Text style={[styles.memberSub, { color: selectedRegistration === member.dang_ky_id ? colors.primary : colors.textMuted }]}>{member.ten_goi_pt || 'Gói PT'} • Còn {member.buoi_con_lai ?? '—'} buổi</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <DatePickerField
              label="Ngày"
              value={newDate}
              onChangeText={setNewDate}
              placeholder="Chọn ngày tập"
              colors={colors}
              minDate={todayYMD()}
              returnFormat="YYYY-MM-DD"
            />
            <View style={styles.rowInputs}>
              <TimeSelector
                label="Giờ bắt đầu"
                value={newStart}
                onPress={() => setShowStartPicker(true)}
                colors={colors}
                required
              />
              <TimeSelector
                label="Giờ kết thúc"
                value={newEnd}
                onPress={() => setShowEndPicker(true)}
                colors={colors}
                required
              />
            </View>
            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Ghi chú</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 60, backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
              value={newNote}
              onChangeText={setNewNote}
              placeholder="Ghi chú tùy chọn"
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtnCancel, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setCreateModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalBtnCancelText, { color: colors.textSecondary }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnSave, { opacity: creating || !selectedRegistration ? 0.7 : 1 }]}
                onPress={async () => {
                  if (!selectedRegistration) {
                    return;
                  }
                  setCreating(true);

                  // Kiểm tra trùng lịch học viên ở phía Client
                  if (schedules && schedules.length > 0) {
                    const selectedMemberName = members.find(m => m.dang_ky_id === selectedRegistration)?.ho_ten || 'Học viên';
                    const hasConflict = schedules.some(s => {
                      if (s.trang_thai === 'da_huy') return false;
                      const sDateYMD = s.ngay_tap ? s.ngay_tap.split('T')[0] : '';
                      if (sDateYMD !== newDate) return false;
                      if (s.hoi_vien_id === members.find(m => m.dang_ky_id === selectedRegistration)?.hoi_vien_id) {
                        return newStart < s.gio_ket_thuc && newEnd > s.gio_bat_dau;
                      }
                      return false;
                    });

                    if (hasConflict) {
                      Alert.alert('Trùng lịch tập', `${selectedMemberName} đã có lịch tập khác trong khung giờ này.`);
                      setCreating(false);
                      return;
                    }
                  }

                  try {
                    const res = await api.post('/pt/schedules', {
                      dang_ky_pt_id: selectedRegistration,
                      ngay_tap: newDate,
                      gio_bat_dau: newStart,
                      gio_ket_thuc: newEnd,
                      ghi_chu: newNote || null,
                    });
                    if (res.data?.success) {
                      setCreateModalVisible(false);
                      setSelectedRegistration(null);
                      setNewDate(todayYMD());
                      setNewStart('08:00');
                      setNewEnd('09:00');
                      setNewNote('');
                      fetchSchedules();
                      fetchMembers();
                    } else {
                      Alert.alert('Không thể tạo lịch', res.data?.message || 'Có lỗi xảy ra');
                    }
                  } catch (err) {
                    Alert.alert('Lỗi', err?.displayMessage || 'Có lỗi xảy ra.');
                  } finally {
                    setCreating(false);
                  }
                }}
                disabled={creating || !selectedRegistration}
                activeOpacity={0.8}
              >
                {creating ? (
                  <ActivityIndicator color={G.white} size="small" />
                ) : (
                  <Text style={styles.modalBtnSaveText}>Tạo lịch</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Đưa hai TimePickerModal vào bên trong createModal để tương thích zIndex hoàn hảo của iOS và Android */}
        <TimePickerModal
          visible={showStartPicker}
          times={START_TIMES}
          selected={newStart}
          onSelect={handleSelectStart}
          onClose={() => setShowStartPicker(false)}
          title="Chọn giờ bắt đầu"
          colors={colors}
          checkDisabled={isTimeSlotDisabled}
        />
        <TimePickerModal
          visible={showEndPicker}
          times={END_TIMES.filter(t => t > newStart)}
          selected={newEnd}
          onSelect={setNewEnd}
          onClose={() => setShowEndPicker(false)}
          title="Chọn giờ kết thúc"
          colors={colors}
          checkDisabled={isEndTimeSlotDisabled}
        />
      </Modal>
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
  headerActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: G.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: G.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: { padding: 16, gap: 14 },
  center: { paddingVertical: 100, alignItems: 'center' },

  emptyBox: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: G.gray900 },
  emptyDesc: { fontSize: 13, color: G.gray400, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },

  card: {
    backgroundColor: G.white,
    borderRadius: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardCompleted: { opacity: 0.8 },
  cardCancelled: { opacity: 0.6 },
  cardAccent: { width: 6 },
  cardContent: { flex: 1, padding: 16 },
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { fontSize: 13, fontWeight: '700', color: G.gray700 },
  
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: G.gray100,
  },
  statusBadgePending: { backgroundColor: G.warningLight },
  statusBadgeDone: { backgroundColor: G.primaryLight },
  statusBadgeFail: { backgroundColor: G.dangerLight },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

  divider: { height: 1, backgroundColor: G.gray100, marginBottom: 12 },

  cardBody: { gap: 12 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberText: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: '800', color: G.gray900 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText: { fontSize: 12, color: G.gray400, fontWeight: '500' },

  infoGrid: { flexDirection: 'row', gap: 20, marginTop: 4 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoVal: { fontSize: 12, color: G.gray700, fontWeight: '600' },

  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: G.gray50,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: G.gray100,
  },
  noteText: { fontSize: 11, color: G.gray500, fontStyle: 'italic', flex: 1 },
  noteActionBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: G.primary,
    backgroundColor: G.primaryLight,
    alignItems: 'center',
  },
  noteActionText: { color: G.primary, fontWeight: '700', fontSize: 13 },

  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: G.danger,
    backgroundColor: 'rgba(220,38,38,0.08)',
  },
  cancelBtnText: { color: G.danger, fontWeight: '800', fontSize: 14 },
  confirmBtn: {
    flex: 1,
    backgroundColor: G.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: G.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  confirmBtnText: { color: G.white, fontWeight: '800', fontSize: 14 },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalContent: {
    backgroundColor: G.white,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: G.gray900, marginBottom: 14 },
  modalInput: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: G.gray200,
    borderRadius: 16,
    padding: 14,
    backgroundColor: G.gray50,
    color: G.gray900,
    fontSize: 14,
    marginBottom: 18,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: G.gray200,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: G.gray50,
    color: G.gray900,
    fontSize: 14,
    marginBottom: 14,
  },
  modalLabel: { fontSize: 12, color: G.gray500, fontWeight: '700', marginBottom: 6 },
  rowInputs: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  memberList: { maxHeight: 160, marginBottom: 14 },
  memberItem: {
    borderWidth: 1,
    borderColor: G.gray200,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  memberItemActive: { borderColor: G.primary, backgroundColor: '#e6f4ea' },
  memberName: { fontSize: 14, fontWeight: '700', color: G.gray900 },
  memberSub: { fontSize: 12, color: G.gray500, marginTop: 4 },
  memberEmpty: { fontSize: 12, color: G.gray500, textAlign: 'center', paddingVertical: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtnCancel: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: G.gray300,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: G.white,
  },
  modalBtnCancelText: { color: G.gray700, fontWeight: '700' },
  modalBtnSave: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: G.primary,
  },
  modalBtnSaveText: { color: G.white, fontWeight: '800' },
});
