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
    sheet: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
    title: { fontSize: 15, fontWeight: '800' },
    item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 16 },
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
          <View style={tp.header}>
            <Text style={[tp.title, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={times}
            keyExtractor={(t) => t}
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

  const isTimeSlotDisabled = (time) => {
    const today = new Date();
    const todayYMD = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    if (newDate === todayYMD) {
      const [h, m] = time.split(':').map(Number);
      const nowH = today.getHours();
      const nowM = today.getMinutes();
      if (h < nowH || (h === nowH && m <= nowM)) {
        return true;
      }
    }

    if (schedules && schedules.length > 0) {
      const [h, m] = time.split(':').map(Number);
      let eh = h + 1;
      let em = m;
      const timeEnd = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;

      return schedules.some(s => {
        if (s.trang_thai === 'da_huy') return false;
        const sDateYMD = s.ngay_tap ? s.ngay_tap.split('T')[0] : '';
        if (sDateYMD !== newDate) return false;
        return time < s.gio_ket_thuc && timeEnd > s.gio_bat_dau;
      });
    }
    return false;
  };

  const isEndTimeSlotDisabled = (time) => {
    if (time <= newStart) return true;
    if (schedules && schedules.length > 0) {
      return schedules.some(s => {
        if (s.trang_thai === 'da_huy') return false;
        const sDateYMD = s.ngay_tap ? s.ngay_tap.split('T')[0] : '';
        if (sDateYMD !== newDate) return false;
        return newStart < s.gio_ket_thuc && time > s.gio_bat_dau;
      });
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
              Alert.alert('Lỗi', err.response?.data?.message || err?.message || 'Không thể xác nhận buổi tập.');
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
              Alert.alert('Lỗi', err.response?.data?.message || 'Không thể hủy buổi tập.');
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
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể lưu ghi chú.');
    } finally {
      setNoteSaving(false);
    }
  };

  // Sắp xếp: Cho tập (sắp tới) lên đầu, rồi tới đã tập, rồi tới đã hủy
  const sortedSchedules = [...schedules].sort((a, b) => {
    const order = { 'cho_tap': 0, 'da_tap': 1, 'da_huy': 2 };
    if (order[a.trang_thai] !== order[b.trang_thai]) {
      return order[a.trang_thai] - order[b.trang_thai];
    }
    if (a.ngay_tap !== b.ngay_tap) {
      return new Date(b.ngay_tap) - new Date(a.ngay_tap);
    }
    return (a.gio_bat_dau || '').localeCompare(b.gio_bat_dau || '');
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? colors.background : G.white} />
      
      {/* ── Header ────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Lịch dạy cá nhân</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Quản lý các buổi tập 1 kèm 1</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.primaryLight }]} onPress={() => setCreateModalVisible(true)} activeOpacity={0.8}>
            <Plus color={colors.primary} size={18} strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterBtn, { backgroundColor: colors.primaryLight }]}>
            <Filter color={colors.primary} size={20} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[G.primary]} tintColor={G.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={G.primary} size="large" />
          </View>
        ) : sortedSchedules.length === 0 ? (
          <View style={styles.emptyBox}>
            <CalendarCheck color={G.gray300} size={64} strokeWidth={1} />
            <Text style={styles.emptyTitle}>Chưa có lịch dạy</Text>
            <Text style={styles.emptyDesc}>Mọi buổi tập của bạn với học viên sẽ được hiển thị tại đây.</Text>
          </View>
        ) : (
          sortedSchedules.map((item) => (
            <View key={item.id} style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
              item.trang_thai === 'da_tap' && styles.cardCompleted,
              item.trang_thai === 'da_huy' && styles.cardCancelled,
            ]}>
              {/* Cột trái: Thời gian & Trạng thái */}
              <View style={[
                styles.cardAccent,
                { backgroundColor: item.trang_thai === 'da_tap' ? G.gray400 : item.trang_thai === 'da_huy' ? G.danger : colors.primary }
              ]} />

              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={styles.timeBox}>
                    <Clock color={colors.textMuted} size={14} strokeWidth={2} />
                    <Text style={[styles.timeText, { color: colors.textSecondary }]}>{item.gio_bat_dau} - {item.gio_ket_thuc}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    item.trang_thai === 'cho_tap' && (item.pt_xac_nhan === 1 || item.hv_xac_nhan === 1) ? { backgroundColor: colors.warningLight } : (item.trang_thai === 'cho_tap' ? styles.statusBadgePending : {}),
                    item.trang_thai === 'da_tap' && styles.statusBadgeDone,
                    item.trang_thai === 'da_huy' && styles.statusBadgeFail,
                  ]}>
                    <Text style={[
                      styles.statusText,
                      item.trang_thai === 'cho_tap' && (item.pt_xac_nhan === 1 || item.hv_xac_nhan === 1) ? { color: colors.warning } : (item.trang_thai === 'cho_tap' ? { color: G.warning } : {}),
                      item.trang_thai === 'da_tap' && { color: G.primary },
                      item.trang_thai === 'da_huy' && { color: G.danger },
                    ]}>
                      {item.trang_thai === 'cho_tap' ? (
                        item.pt_xac_nhan === 1 && item.hv_xac_nhan === 0 ? 'Chờ HV xác nhận' :
                        item.hv_xac_nhan === 1 && item.pt_xac_nhan === 0 ? 'Chờ bạn xác nhận' : 'Chờ tập'
                      ) : scheduleStatusLabel(item.trang_thai)}
                    </Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.cardBody}>
                  <View style={styles.memberRow}>
                    <ProfileAvatar uri={item.avatar_hoi_vien} name={item.ten_hoi_vien} size={44} />
                    <View style={styles.memberText}>
                      <Text style={[styles.memberName, { color: colors.text }]}>{item.ten_hoi_vien || 'Học viên'}</Text>
                      <View style={styles.metaRow}>
                        <Dumbbell color={colors.textMuted} size={12} strokeWidth={2} />
                        <Text style={[styles.metaText, { color: colors.textMuted }]}>
                          {item.loai_buoi === 'ca_nhan' ? 'Cá nhân' : 'Nhóm'} • Đã tập {item.so_buoi_da_tap ?? 0}/{item.so_buoi_dang_ky ?? '—'} • Còn {item.buoi_con_lai ?? '—'} buổi
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <CalendarCheck color={colors.textMuted} size={14} strokeWidth={2} />
                      <Text style={[styles.infoVal, { color: colors.textSecondary }]}>{formatDate(item.ngay_tap)}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <MapPin color={colors.textMuted} size={14} strokeWidth={2} />
                      <Text style={[styles.infoVal, { color: colors.textSecondary }]} numberOfLines={1}>{item.chi_nhanh_tap || 'Paradise GYM'}</Text>
                    </View>
                  </View>

                  {item.ghi_chu ? (
                    <View style={[styles.noteBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                      <Info color={colors.textMuted} size={12} strokeWidth={2} />
                      <Text style={[styles.noteText, { color: colors.textSecondary }]}>{item.ghi_chu}</Text>
                    </View>
                  ) : null}

                  {item.trang_thai === 'cho_tap' && (
                    <TouchableOpacity
                      style={[styles.noteActionBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                      onPress={() => openNoteEditor(item)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.noteActionText}>{item.ghi_chu ? 'Sửa ghi chú' : 'Thêm ghi chú'}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {item.trang_thai === 'cho_tap' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => cancelSchedule(item.id)}
                      disabled={actionLoadingId === item.id}
                      activeOpacity={0.8}
                    >
                      {actionLoadingId === item.id ? (
                        <ActivityIndicator color={G.danger} size="small" />
                      ) : (
                        <>
                          <X color={G.danger} size={16} strokeWidth={2.5} />
                          <Text style={styles.cancelBtnText}>Hủy lịch</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    {item.pt_xac_nhan === 0 ? (
                      <TouchableOpacity
                        style={styles.confirmBtn}
                        onPress={() => confirmSchedule(item.id)}
                        disabled={actionLoadingId === item.id}
                        activeOpacity={0.8}
                      >
                        {actionLoadingId === item.id ? (
                          <ActivityIndicator color={G.white} size="small" />
                        ) : (
                          <>
                            <Zap color={G.white} size={16} strokeWidth={2.5} />
                            <Text style={styles.confirmBtnText}>Hoàn thành</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.confirmBtn, { backgroundColor: colors.surfaceVariant, borderWidth: 1, borderColor: colors.border }]}>
                        <Clock color={colors.textMuted} size={14} strokeWidth={2} />
                        <Text style={[styles.confirmBtnText, { color: colors.textMuted, marginLeft: 4 }]}>Chờ học viên</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

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
              style={[styles.modalInput, { minHeight: 80, backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
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
                      alert(res.data?.message || 'Không thể tạo lịch mới');
                    }
                  } catch (err) {
                    alert(err.response?.data?.message || 'Lỗi kết nối khi tạo lịch.');
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
      </Modal>

      {/* Pickers */}
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
