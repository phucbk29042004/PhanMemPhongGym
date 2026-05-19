import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform,
  RefreshControl, ScrollView, StatusBar, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import {
  CalendarCheck, Clock, Dumbbell,
  Filter, Info, MapPin, X, Zap,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { formatDate, scheduleStatusLabel, unwrapData } from '../../utils/data';
import ProfileAvatar from '../../components/ProfileAvatar';

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

export default function PTScheduleScreen() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteEditingId, setNoteEditingId] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      fetchSchedules();
    }, [fetchSchedules])
  );

  const onRefresh = () => { setRefreshing(true); fetchSchedules(); };

  const confirmSchedule = (id) => {
    Alert.alert(
      'Xác nhận buổi tập',
      'Xác nhận học viên đã hoàn thành buổi tập này? Hệ thống sẽ trừ 1 buổi trong gói tập của học viên.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            setActionLoadingId(id);
            try {
              await api.put(`/pt/schedules/${id}/confirm`);
              await fetchSchedules();
            } catch (err) {
              Alert.alert('Lỗi', err.response?.data?.message || 'Không thể xác nhận buổi tập.');
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
    return new Date(b.ngay_tap) - new Date(a.ngay_tap);
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={G.white} />
      
      {/* ── Header ────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Lịch dạy cá nhân</Text>
          <Text style={styles.headerSubtitle}>Quản lý các buổi tập 1 kèm 1</Text>
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Filter color={G.primary} size={20} strokeWidth={2} />
        </TouchableOpacity>
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
              item.trang_thai === 'da_tap' && styles.cardCompleted,
              item.trang_thai === 'da_huy' && styles.cardCancelled,
            ]}>
              {/* Cột trái: Thời gian & Trạng thái */}
              <View style={[
                styles.cardAccent,
                { backgroundColor: item.trang_thai === 'da_tap' ? G.gray400 : item.trang_thai === 'da_huy' ? G.danger : G.primary }
              ]} />

              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={styles.timeBox}>
                    <Clock color={G.gray500} size={14} strokeWidth={2} />
                    <Text style={styles.timeText}>{item.gio_bat_dau} - {item.gio_ket_thuc}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    item.trang_thai === 'cho_tap' && styles.statusBadgePending,
                    item.trang_thai === 'da_tap' && styles.statusBadgeDone,
                    item.trang_thai === 'da_huy' && styles.statusBadgeFail,
                  ]}>
                    <Text style={[
                      styles.statusText,
                      item.trang_thai === 'cho_tap' && { color: G.warning },
                      item.trang_thai === 'da_tap' && { color: G.primary },
                      item.trang_thai === 'da_huy' && { color: G.danger },
                    ]}>{scheduleStatusLabel(item.trang_thai)}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardBody}>
                  <View style={styles.memberRow}>
                    <ProfileAvatar uri={item.avatar_hoi_vien} name={item.ten_hoi_vien} size={44} />
                    <View style={styles.memberText}>
                      <Text style={styles.memberName}>{item.ten_hoi_vien || 'Học viên'}</Text>
                      <View style={styles.metaRow}>
                        <Dumbbell color={G.gray400} size={12} strokeWidth={2} />
                        <Text style={styles.metaText}>
                          {item.loai_buoi === 'ca_nhan' ? 'Cá nhân' : 'Nhóm'} • Đã tập {item.so_buoi_da_tap ?? 0}/{item.so_buoi_dang_ky ?? '—'} • Còn {item.buoi_con_lai ?? '—'} buổi
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <CalendarCheck color={G.gray400} size={14} strokeWidth={2} />
                      <Text style={styles.infoVal}>{formatDate(item.ngay_tap)}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <MapPin color={G.gray400} size={14} strokeWidth={2} />
                      <Text style={styles.infoVal} numberOfLines={1}>{item.chi_nhanh || 'Paradise GYM'}</Text>
                    </View>
                  </View>

                  {item.ghi_chu ? (
                    <View style={styles.noteBox}>
                      <Info color={G.gray400} size={12} strokeWidth={2} />
                      <Text style={styles.noteText}>{item.ghi_chu}</Text>
                    </View>
                  ) : null}

                  {item.trang_thai === 'cho_tap' && (
                    <TouchableOpacity
                      style={styles.noteActionBtn}
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ghi chú buổi tập</Text>
            <TextInput
              style={styles.modalInput}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Nhập ghi chú buổi tập"
              multiline
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setNoteModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
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
