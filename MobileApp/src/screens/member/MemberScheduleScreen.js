import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, RefreshControl, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View,
  KeyboardAvoidingView, Platform
} from 'react-native';
import {
  CalendarDays, ChevronLeft, ChevronRight,
  Clock, Dumbbell, MapPin, Star, X,
} from 'lucide-react-native';
import { api } from '../../services/api';
import { formatDate } from '../../utils/data';
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
  warning: '#f59e0b',
  warningLight: '#fffbeb',
};

// ── Helpers ────────────────────────────────────────────────
const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTH_NAMES = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

function getFirstDayOfWeek(year, month) {
  // Ngày đầu tháng là thứ mấy trong tuần (T2=0, CN=6)
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Chuyển từ Sun=0 về T2=0
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function toYMD(d) {
  if (!d) return '';
  const dd = new Date(d);
  if (isNaN(dd)) return d;
  return `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}-${String(dd.getDate()).padStart(2, '0')}`;
}

function todayYMD() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Badge trạng thái ───────────────────────────────────────
function StatusBadge({ item }) {
  const { colors } = useTheme();
  const status = item.trang_thai;
  const pt_xac_nhan = item.pt_xac_nhan;
  const hv_xac_nhan = item.hv_xac_nhan;

  let cfg = {
    cho_tap: { bg: colors.warningLight, color: colors.warning, label: 'Chờ tập' },
    da_tap: { bg: colors.primaryLight, color: colors.primary, label: 'Đã hoàn thành' },
    da_xac_nhan: { bg: colors.primaryLight, color: colors.primary, label: 'Đã xác nhận' },
    da_huy: { bg: colors.dangerLight, color: colors.danger, label: 'Đã hủy' },
    vang: { bg: colors.isDark ? 'rgba(124,58,237,0.15)' : '#faf5ff', color: colors.isDark ? '#a78bfa' : '#7c3aed', label: 'Vắng' },
  }[status] || { bg: colors.surfaceVariant, color: colors.textMuted, label: status || 'Chưa rõ' };

  if (status === 'cho_tap') {
    if (pt_xac_nhan === 1 && hv_xac_nhan === 0) {
      cfg = { bg: colors.warningLight, color: colors.warning, label: 'Chờ bạn xác nhận' };
    } else if (hv_xac_nhan === 1 && pt_xac_nhan === 0) {
      cfg = { bg: colors.warningLight, color: colors.warning, label: 'Chờ PT xác nhận' };
    }
  }

  return (
    <View style={[badgeStyles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[badgeStyles.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}
const badgeStyles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  text: { fontSize: 11, fontWeight: '700' },
});

// ── Component Lịch Lưới Mini Calendar ─────────────────────
function MiniCalendar({ year, month, trainedDays, today, onPrevMonth, onNextMonth }) {
  const { colors } = useTheme();
  const firstDay = getFirstDayOfWeek(year, month);
  const totalDays = getDaysInMonth(year, month);
  // Ngày của tháng trước để fill ô trống
  const prevMonthDays = getDaysInMonth(year, month - 1 < 0 ? 11 : month - 1);

  const cells = [];
  // Ô trống đầu tháng
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: prevMonthDays - firstDay + 1 + i, type: 'prev' });
  }
  // Ngày trong tháng
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, type: 'current', dateStr, trained: trainedDays.has(dateStr) });
  }
  // Điền nốt cuối
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    cells.push({ day: i, type: 'next' });
  }

  return (
    <View>
      {/* Header điều hướng tháng */}
      <View style={calStyles.navRow}>
        <TouchableOpacity onPress={onPrevMonth} style={[calStyles.navBtn, { backgroundColor: colors.surfaceVariant }]} activeOpacity={0.7}>
          <ChevronLeft color={colors.text} size={20} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[calStyles.monthLabel, { color: colors.text }]}>
          {String(month + 1).padStart(2, '0')}/{year}
        </Text>
        <TouchableOpacity onPress={onNextMonth} style={[calStyles.navBtn, { backgroundColor: colors.surfaceVariant }]} activeOpacity={0.7}>
          <ChevronRight color={colors.text} size={20} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Tiêu đề ngày trong tuần */}
      <View style={calStyles.weekRow}>
        {WEEKDAYS.map(wd => (
          <View key={wd} style={calStyles.weekCell}>
            <Text style={[calStyles.weekText, { color: colors.textMuted }]}>{wd}</Text>
          </View>
        ))}
      </View>

      {/* Lưới ngày */}
      <View style={calStyles.daysGrid}>
        {cells.map((cell, idx) => {
          const isToday = cell.type === 'current' && cell.dateStr === todayYMD();
          const isTrained = cell.trained;
          return (
            <View key={idx} style={calStyles.dayCell}>
              <View style={[
                calStyles.dayInner,
                isTrained && { backgroundColor: colors.primary },
                isToday && !isTrained && { borderWidth: 1.5, borderColor: colors.primary },
              ]}>
                <Text style={[
                  calStyles.dayText,
                  { color: colors.text },
                  cell.type !== 'current' && { color: colors.textMuted, opacity: 0.4 },
                  isTrained && { color: G.white, fontWeight: '800' },
                  isToday && !isTrained && { color: colors.primary, fontWeight: '800' },
                ]}>
                  {cell.day}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const calStyles = StyleSheet.create({
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 15, fontWeight: '800' },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  weekText: { fontSize: 11, fontWeight: '700' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, alignItems: 'center', marginBottom: 4 },
  dayInner: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 13, fontWeight: '600' },
});

// ── Card Lịch Tập Chi Tiết ─────────────────────────────────
function ScheduleCard({ item, onConfirm, onRate, isConfirming }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.schedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.schedDateBox, { backgroundColor: colors.primaryLight }]}>
        <Text style={[styles.schedDay, { color: colors.primary }]}>
          {item.ngay_tap ? new Date(item.ngay_tap + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit' }) : '—'}
        </Text>
        <Text style={[styles.schedMonth, { color: colors.primary }]}>
          {item.ngay_tap ? `Th.${String(new Date(item.ngay_tap + 'T00:00:00').getMonth() + 1).padStart(2, '0')}` : ''}
        </Text>
      </View>
      <View style={styles.schedInfo}>
        <View style={styles.schedRow}>
          <Clock color={colors.textMuted} size={13} strokeWidth={2} />
          <Text style={[styles.schedTime, { color: colors.text }]}>
            {item.gio_bat_dau || '—'} – {item.gio_ket_thuc || '—'}
          </Text>
        </View>
        {item.ten_pt ? (
          <View style={styles.schedRow}>
            <Dumbbell color={colors.primary} size={13} strokeWidth={2} />
            <Text style={[styles.schedPt, { color: colors.primary }]}>HLV: {item.ten_pt}</Text>
          </View>
        ) : null}
        {item.chi_nhanh ? (
          <View style={styles.schedRow}>
            <MapPin color={colors.textMuted} size={13} strokeWidth={2} />
            <Text style={[styles.schedLocation, { color: colors.textMuted }]} numberOfLines={1}>{item.chi_nhanh}</Text>
          </View>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <StatusBadge item={item} />
        {item.trang_thai === 'cho_tap' && item.hv_xac_nhan === 0 && (
          <TouchableOpacity 
            style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
            onPress={() => onConfirm && onConfirm(item.id)}
            disabled={isConfirming}
          >
            {isConfirming ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.confirmText}>Xác nhận</Text>}
          </TouchableOpacity>
        )}
        {item.trang_thai === 'da_tap' && (
          <TouchableOpacity
            style={[styles.rateBtn, { backgroundColor: colors.warningLight, borderColor: colors.warning }]}
            onPress={() => onRate && onRate(item)}
          >
            <Star color={colors.warning} size={13} fill={colors.warning} />
            <Text style={[styles.rateText, { color: colors.warning }]}>{item.danh_gia_sao ? `${item.danh_gia_sao}/5` : 'Đánh giá'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Màn hình Tập luyện ─────────────────────────────────────
export default function MemberScheduleScreen() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [ratingModal, setRatingModal] = useState(null);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingNote, setRatingNote] = useState('');
  const [savingRating, setSavingRating] = useState(false);

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await api.get('/pt/schedules');
      if (res.data?.success) setSchedules(res.data.data || []);
    } catch (err) {
      console.error('[ScheduleScreen] fetch error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleConfirm = async (id) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xác nhận đã hoàn thành buổi tập này không?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đồng ý', onPress: async () => {
          setConfirmingId(id);
          try {
            const res = await api.put(`/pt/schedules/${id}/confirm`);
            if (res.data?.success) {
              const { bothConfirmed } = res.data.data;
              if (bothConfirmed) {
                Alert.alert('Thành công', 'Buổi tập đã được cả 2 bên xác nhận hoàn thành!');
              } else {
                Alert.alert('Đã ghi nhận', 'Đã ghi nhận xác nhận của bạn. Buổi tập sẽ hoàn thành khi PT xác nhận.');
              }
              fetchSchedules();
            }
          } catch (err) {
            Alert.alert('Lỗi', err.response?.data?.message || err?.message || 'Không thể xác nhận buổi tập.');
          } finally {
            setConfirmingId(null);
          }
        }
      }
    ]);
  };

  const openRating = (item) => {
    setRatingModal(item);
    setRatingStars(Number(item.danh_gia_sao) || 0);
    setRatingNote(item.danh_gia_noi_dung || '');
  };

  const submitRating = async () => {
    if (!ratingModal || !ratingStars) return Alert.alert('Thiếu đánh giá', 'Vui lòng chọn số sao.');
    setSavingRating(true);
    try {
      const tags = ratingStars === 5 ? ['Tận tâm', 'Bài tập phù hợp'] : ratingStars < 3 ? ['Cần hỗ trợ', 'Cần Admin theo dõi'] : [];
      const res = await api.post(`/pt/schedules/${ratingModal.id}/rating`, {
        so_sao: ratingStars,
        tags,
        tieu_chi: ratingStars < 3 ? { 'Chuyên môn': 3, 'Thái độ': 3, 'Đúng giờ': 3 } : {},
        noi_dung: ratingNote,
      });
      if (res.data?.success) {
        setRatingModal(null);
        await fetchSchedules();
      }
    } catch (err) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể gửi đánh giá.');
    } finally {
      setSavingRating(false);
    }
  };

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  // ── Tính toán thống kê từ dữ liệu thực tế ─────────────────
  const { trainedDays, monthStats, historyList } = useMemo(() => {
    const trainedSet = new Set();
    let daTap = 0;
    let chuaTap = 0;

    schedules.forEach(s => {
      const dateStr = toYMD(s.ngay_tap || s.ngay_tap);
      if (!dateStr) return;
      const [sy, sm] = dateStr.split('-').map(Number);
      if (sy === year && sm - 1 === month) {
        if (s.trang_thai === 'da_tap' || s.trang_thai === 'da_xac_nhan') {
          trainedSet.add(dateStr);
          daTap++;
        } else if (s.trang_thai === 'cho_tap') {
          chuaTap++;
        }
      }
    });

    // Số ngày làm việc trong tháng không tập (chỉ ngày trong tuần)
    const daysInMonth = getDaysInMonth(year, month);
    let workDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(year, month, d).getDay();
      if (dow !== 0 && dow !== 6) workDays++;
    }
    const chuaTapCount = Math.max(0, workDays - daTap);

    // Lịch sử: tất cả buổi đã hoàn thành hoặc sắp tới, sắp xếp mới nhất
    const history = [...schedules]
      .sort((a, b) => {
        const da = `${a.ngay_tap} ${a.gio_bat_dau}`;
        const db = `${b.ngay_tap} ${b.gio_bat_dau}`;
        return db.localeCompare(da);
      });

    return {
      trainedDays: trainedSet,
      monthStats: { daTap, chuaTap: chuaTapCount },
      historyList: history,
    };
  }, [schedules, year, month]);

  const goPrevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const goNextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.isDark ? colors.statusBarBg : G.gray50} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.headerIcon, { backgroundColor: colors.primaryLight }]}>
          <CalendarDays color={colors.primary} size={20} strokeWidth={2} />
        </View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Tập luyện</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSchedules(); }} colors={[colors.primary]} tintColor={colors.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Đang tải lịch tập...</Text>
          </View>
        ) : (
          <>
            {/* ── Thống Kê Tháng ──────────────────────────── */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={styles.cardHeaderRow}>
                <Dumbbell color={colors.primary} size={16} strokeWidth={2} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>Tập luyện tháng này</Text>
              </View>

              <View style={styles.statsRow}>
                <View style={[styles.statBox, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Không tập luyện</Text>
                  <Text style={[styles.statValue, { color: colors.textMuted }]}>{monthStats.chuaTap}</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.8)' }]}>Đã tập luyện</Text>
                  <Text style={[styles.statValue, { color: G.white }]}>{monthStats.daTap}</Text>
                </View>
              </View>

              {/* Mini Calendar */}
              <MiniCalendar
                year={year}
                month={month}
                trainedDays={trainedDays}
                today={todayYMD()}
                onPrevMonth={goPrevMonth}
                onNextMonth={goNextMonth}
              />
            </View>

            {/* ── Lịch Sự Tập Luyện ──────────────────────── */}
            <View style={styles.historySection}>
              <Text style={[styles.historyTitle, { color: colors.text }]}>Lịch sử tập luyện</Text>
              {historyList.length === 0 ? (
                <View style={[styles.emptyBox, { backgroundColor: colors.surface }]}>
                  <CalendarDays color={colors.textMuted} size={36} strokeWidth={1.5} />
                  <Text style={[styles.emptyText, { color: colors.text }]}>Chưa có lịch tập nào</Text>
                  <Text style={[styles.emptySubText, { color: colors.textMuted }]}>Liên hệ lễ tân để đặt lịch với HLV</Text>
                </View>
              ) : (
                historyList.map((item) => (
                  <ScheduleCard 
                    key={item.id} 
                    item={item} 
                    onConfirm={handleConfirm} 
                    onRate={openRating}
                    isConfirming={confirmingId === item.id} 
                  />
                ))
              )}
            </View>
          </>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
      <Modal visible={!!ratingModal} transparent animationType="slide" onRequestClose={() => setRatingModal(null)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.modalOverlay}
        >
          <View style={[styles.ratingSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Đánh giá PT</Text>
              <TouchableOpacity onPress={() => setRatingModal(null)}><X color={colors.textMuted} size={22} /></TouchableOpacity>
            </View>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n} onPress={() => setRatingStars(n)}>
                  <Star color="#f59e0b" fill={n <= ratingStars ? '#f59e0b' : 'transparent'} size={38} />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.ratingInput, { color: colors.text, borderColor: colors.border }]}
              placeholder={ratingStars > 0 && ratingStars < 3 ? 'Nhập lý do để Admin hỗ trợ xử lý...' : 'Chia sẻ thêm cảm nhận...'}
              placeholderTextColor={colors.textMuted}
              multiline
              value={ratingNote}
              onChangeText={setRatingNote}
            />
            <TouchableOpacity style={[styles.ratingSubmit, { backgroundColor: colors.primary }]} onPress={submitRating} disabled={savingRating}>
              {savingRating ? <ActivityIndicator color="#fff" /> : <Text style={styles.ratingSubmitText}>Gửi đánh giá</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── StyleSheet ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: G.gray50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 20,
    gap: 10,
    backgroundColor: G.white,
    borderBottomWidth: 1,
    borderBottomColor: G.gray200,
  },
  headerIcon: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: G.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  rateBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  rateText: { fontSize: 11, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  ratingSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  ratingInput: { minHeight: 96, borderWidth: 1, borderRadius: 14, padding: 12, textAlignVertical: 'top' },
  ratingSubmit: { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ratingSubmitText: { color: '#fff', fontWeight: '900' },

  scrollContent: { padding: 16, paddingBottom: 24 },
  loadingCenter: { paddingTop: 80, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: G.gray400, fontWeight: '500' },

  // Card container
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '800' },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: {
    flex: 1, padding: 12, borderRadius: 14, gap: 4,
  },
  statLabel: { fontSize: 11, fontWeight: '600' },
  statValue: { fontSize: 28, fontWeight: '800', lineHeight: 34 },

  // History
  historySection: { gap: 10 },
  historyTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  emptyBox: {
    borderRadius: 18, padding: 32,
    alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  emptyText: { fontSize: 15, fontWeight: '700' },
  emptySubText: { fontSize: 12 },

  // Schedule card
  schedCard: {
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
  },
  schedDateBox: {
    width: 44, height: 52, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  schedDay: { fontSize: 18, fontWeight: '800', lineHeight: 22 },
  schedMonth: { fontSize: 10, fontWeight: '600' },
  schedInfo: { flex: 1, gap: 4 },
  schedRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  schedTime: { fontSize: 13, fontWeight: '700' },
  schedPt: { fontSize: 12, fontWeight: '600' },
  schedLocation: { fontSize: 11, flex: 1 },
  confirmBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 4, minWidth: 70, alignItems: 'center' },
  confirmText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});
