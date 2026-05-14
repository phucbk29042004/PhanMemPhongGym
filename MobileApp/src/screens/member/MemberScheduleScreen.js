import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView,
  StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import {
  CalendarDays, ChevronLeft, ChevronRight,
  Clock, Dumbbell, MapPin,
} from 'lucide-react-native';
import { api } from '../../services/api';
import { formatDate } from '../../utils/data';

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
function StatusBadge({ status }) {
  const cfg = {
    cho_tap: { bg: G.warningLight, color: G.warning, label: 'Chờ tập' },
    da_tap: { bg: G.primaryLight, color: G.primary, label: 'Đã hoàn thành' },
    da_xac_nhan: { bg: G.primaryLight, color: G.primary, label: 'Đã xác nhận' },
    da_huy: { bg: '#fef2f2', color: G.danger, label: 'Đã hủy' },
    vang: { bg: '#faf5ff', color: '#7c3aed', label: 'Vắng' },
  }[status] || { bg: G.gray100, color: G.gray500, label: status || 'Chưa rõ' };

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

  const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

  return (
    <View>
      {/* Header điều hướng tháng */}
      <View style={calStyles.navRow}>
        <TouchableOpacity onPress={onPrevMonth} style={calStyles.navBtn} activeOpacity={0.7}>
          <ChevronLeft color={G.gray700} size={20} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={calStyles.monthLabel}>
          {String(month + 1).padStart(2, '0')}/{year}
        </Text>
        <TouchableOpacity onPress={onNextMonth} style={calStyles.navBtn} activeOpacity={0.7}>
          <ChevronRight color={G.gray700} size={20} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Tiêu đề ngày trong tuần */}
      <View style={calStyles.weekRow}>
        {WEEKDAYS.map(wd => (
          <View key={wd} style={calStyles.weekCell}>
            <Text style={calStyles.weekText}>{wd}</Text>
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
                isTrained && calStyles.dayTrained,
                isToday && !isTrained && calStyles.dayToday,
              ]}>
                <Text style={[
                  calStyles.dayText,
                  cell.type !== 'current' && calStyles.dayTextOther,
                  isTrained && calStyles.dayTextTrained,
                  isToday && !isTrained && calStyles.dayTextToday,
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
  navBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: G.gray100, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 15, fontWeight: '800', color: G.gray900 },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  weekText: { fontSize: 11, fontWeight: '700', color: G.gray400 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, alignItems: 'center', marginBottom: 4 },
  dayInner: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dayTrained: { backgroundColor: G.primary },
  dayToday: { borderWidth: 1.5, borderColor: G.primary },
  dayText: { fontSize: 13, fontWeight: '600', color: G.gray700 },
  dayTextOther: { color: G.gray300 },
  dayTextTrained: { color: G.white, fontWeight: '800' },
  dayTextToday: { color: G.primary, fontWeight: '800' },
});

// ── Card Lịch Tập Chi Tiết ─────────────────────────────────
function ScheduleCard({ item }) {
  return (
    <View style={styles.schedCard}>
      <View style={styles.schedDateBox}>
        <Text style={styles.schedDay}>
          {item.ngay_tap ? new Date(item.ngay_tap + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit' }) : '—'}
        </Text>
        <Text style={styles.schedMonth}>
          {item.ngay_tap ? `Th.${String(new Date(item.ngay_tap + 'T00:00:00').getMonth() + 1).padStart(2, '0')}` : ''}
        </Text>
      </View>
      <View style={styles.schedInfo}>
        <View style={styles.schedRow}>
          <Clock color={G.gray400} size={13} strokeWidth={2} />
          <Text style={styles.schedTime}>
            {item.gio_bat_dau || '—'} – {item.gio_ket_thuc || '—'}
          </Text>
        </View>
        {item.ten_pt ? (
          <View style={styles.schedRow}>
            <Dumbbell color={G.primary} size={13} strokeWidth={2} />
            <Text style={styles.schedPt}>HLV: {item.ten_pt}</Text>
          </View>
        ) : null}
        {item.chi_nhanh ? (
          <View style={styles.schedRow}>
            <MapPin color={G.gray400} size={13} strokeWidth={2} />
            <Text style={styles.schedLocation} numberOfLines={1}>{item.chi_nhanh}</Text>
          </View>
        ) : null}
      </View>
      <StatusBadge status={item.trang_thai} />
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={G.gray50} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <CalendarDays color={G.primary} size={20} strokeWidth={2} />
        </View>
        <Text style={styles.headerTitle}>Tập luyện</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSchedules(); }} colors={[G.primary]} tintColor={G.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color={G.primary} />
            <Text style={styles.loadingText}>Đang tải lịch tập...</Text>
          </View>
        ) : (
          <>
            {/* ── Thống Kê Tháng ──────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Dumbbell color={G.primary} size={16} strokeWidth={2} />
                <Text style={styles.cardTitle}>Tập luyện tháng này</Text>
              </View>

              <View style={styles.statsRow}>
                <View style={[styles.statBox, { backgroundColor: G.gray100 }]}>
                  <Text style={styles.statLabel}>Không tập luyện</Text>
                  <Text style={[styles.statValue, { color: G.gray500 }]}>{monthStats.chuaTap}</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: G.primary }]}>
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

            {/* ── Lịch Sử Tập Luyện ──────────────────────── */}
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>Lịch sử tập luyện</Text>
              {historyList.length === 0 ? (
                <View style={styles.emptyBox}>
                  <CalendarDays color={G.gray300} size={36} strokeWidth={1.5} />
                  <Text style={styles.emptyText}>Chưa có lịch tập nào</Text>
                  <Text style={styles.emptySubText}>Liên hệ lễ tân để đặt lịch với HLV</Text>
                </View>
              ) : (
                historyList.map((item) => (
                  <ScheduleCard key={item.id} item={item} />
                ))
              )}
            </View>
          </>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: G.gray900 },

  scrollContent: { padding: 16, paddingBottom: 24 },
  loadingCenter: { paddingTop: 80, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: G.gray400, fontWeight: '500' },

  // Card container
  card: {
    backgroundColor: G.white,
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
  cardTitle: { fontSize: 15, fontWeight: '800', color: G.gray900 },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: {
    flex: 1, padding: 12, borderRadius: 14, gap: 4,
  },
  statLabel: { fontSize: 11, fontWeight: '600', color: G.gray500 },
  statValue: { fontSize: 28, fontWeight: '800', lineHeight: 34 },

  // History
  historySection: { gap: 10 },
  historyTitle: { fontSize: 16, fontWeight: '800', color: G.gray900, marginBottom: 4 },
  emptyBox: {
    backgroundColor: G.white, borderRadius: 18, padding: 32,
    alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  emptyText: { fontSize: 15, fontWeight: '700', color: G.gray500 },
  emptySubText: { fontSize: 12, color: G.gray400 },

  // Schedule card
  schedCard: {
    backgroundColor: G.white,
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
  },
  schedDateBox: {
    width: 44, height: 52, borderRadius: 12,
    backgroundColor: G.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  schedDay: { fontSize: 18, fontWeight: '800', color: G.primary, lineHeight: 22 },
  schedMonth: { fontSize: 10, fontWeight: '600', color: G.primary },
  schedInfo: { flex: 1, gap: 4 },
  schedRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  schedTime: { fontSize: 13, fontWeight: '700', color: G.gray900 },
  schedPt: { fontSize: 12, fontWeight: '600', color: G.primary },
  schedLocation: { fontSize: 11, color: G.gray400, flex: 1 },
});
