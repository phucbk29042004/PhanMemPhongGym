import React, { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Calendar, Clock, Dumbbell, Save, ChevronDown } from 'lucide-react-native';
import { api } from '../../services/api';
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

function convertDMYToYMD(dmy) {
  if (!dmy) return '';
  const parts = dmy.split('/');
  if (parts.length !== 3) return '';
  const day = parts[0].trim();
  const month = parts[1].trim();
  const year = parts[2].trim();
  if (day.length !== 2 || month.length !== 2 || year.length !== 4) return '';
  return `${year}-${month}-${day}`;
}

function RequiredStar() {
  return <Text style={{ color: '#ba1a1a', fontWeight: '700' }}> *</Text>;
}

function FieldLabel({ label, required = false, colors }) {
  return (
    <Text style={[styles.label, { color: colors.textSecondary }]}>
      {label}{required && <RequiredStar />}
    </Text>
  );
}

// ── Custom Time Picker ──────────────────────────────────────────
function TimePickerModal({ visible, times, selected, onSelect, onClose, title, colors, checkDisabled }) {
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
                    {item} {isDisabled ? '' : ''}
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

// ── Custom Duration Picker ──────────────────────────────────────
function DurationPickerModal({ visible, selected, onSelect, onClose, colors }) {
  const options = [
    { label: '30 phút', value: '30' },
    { label: '1 giờ', value: '60' },
    { label: '1 giờ 30 phút', value: '90' },
    { label: '2 giờ', value: '120' }
  ];
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
            <Text style={[tp.title, { color: colors.text }]}>Chọn thời lượng</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(o) => o.value}
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 240 }}
            renderItem={({ item }) => {
              const isSelected = String(item.value) === String(selected);
              return (
                <TouchableOpacity
                  style={[
                    tp.item,
                    isSelected && { backgroundColor: colors.primaryLight }
                  ]}
                  onPress={() => {
                    onSelect(item.value);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Clock color={isSelected ? colors.primary : colors.textMuted} size={14} />
                  <Text style={[
                    tp.itemText,
                    { color: isSelected ? colors.primary : colors.text }
                  ]}>
                    {item.label}
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

const tp = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  sheet: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  title: { fontSize: 15, fontWeight: '800' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 16 },
  itemText: { fontSize: 15, fontWeight: '600', flex: 1 },
  check: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});

// ── TimeSelector Button ─────────────────────────────────────────
function TimeSelector({ label, value, onPress, colors, required }) {
  return (
    <View style={{ flex: 1 }}>
      <FieldLabel label={label} required={required} colors={colors} />
      <TouchableOpacity
        style={[styles.timeSelectorBtn, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Clock color={colors.textMuted} size={16} />
        <Text style={[styles.timeSelectorText, { color: colors.text }]}>{value}</Text>
        <ChevronDown color={colors.textMuted} size={16} />
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen ─────────────────────────────────────────────────
export default function AdminRegisterPTScheduleScreen({ route, navigation }) {
  const { member, activePT } = route.params || {};
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const contracts = member?.pt_hien_tai || (activePT ? [activePT] : []);
  const [selectedContract, setSelectedContract] = useState(activePT || contracts[0] || null);
  const [submitting, setSubmitting] = useState(false);

  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  });
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [note, setNote] = useState('');

  const [showStartPicker, setShowStartPicker] = useState(false);

  const [duration, setDuration] = useState('60'); // 60 phút = 1 giờ
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  const [ptSchedules, setPtSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // Helper tính giờ kết thúc động
  const calcEndTime = (start, dur) => {
    if (!start) return '';
    const [h, m] = start.split(':').map(Number);
    const totalMins = h * 60 + m + Number(dur);
    const endH = Math.floor(totalMins / 60) % 24;
    const endM = totalMins % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  // Helper check trùng giờ bắt đầu của ca mới
  const isTimeSlotDisabled = (time) => {
    // 1. Kiểm tra giờ trong quá khứ nếu là hôm nay
    const ymdDate = convertDMYToYMD(startDate);
    const today = new Date();
    const todayYMD = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (ymdDate === todayYMD) {
      const [h, m] = time.split(':').map(Number);
      const nowH = today.getHours();
      const nowM = today.getMinutes();
      if (h < nowH || (h === nowH && m <= nowM)) {
        return true;
      }
    }

    // 2. Kiểm tra trùng lịch PT
    if (ptSchedules && ptSchedules.length > 0) {
      const timeEnd = calcEndTime(time, duration);

      return ptSchedules.some(s => {
        if (s.trang_thai === 'da_huy') return false;
        return time < s.gio_ket_thuc && timeEnd > s.gio_bat_dau;
      });
    }

    return false;
  };



  // Tự động tính toán lại giờ kết thúc khi startTime hoặc duration thay đổi
  useEffect(() => {
    if (startTime) {
      setEndTime(calcEndTime(startTime, duration));
    }
  }, [startTime, duration]);

  // Fetch lịch tập của PT
  useEffect(() => {
    if (!selectedContract || !startDate) return;
    const ymd = convertDMYToYMD(startDate);
    if (!ymd) return;

    const fetchSchedules = async () => {
      setLoadingSchedules(true);
      try {
        const res = await api.get(`/trainers/${selectedContract.pt_id}/schedules`, {
          params: { date: ymd }
        });
        if (res.data?.success) {
          const list = res.data.data || [];
          setPtSchedules(list);

          // Sau khi lấy schedules, kiểm tra và tìm giờ bắt đầu hợp lệ đầu tiên
          const today = new Date();
          const todayYMD = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          const isToday = ymd === todayYMD;
          const nowH = today.getHours();
          const nowM = today.getMinutes();

          let foundStart = null;
          for (const t of START_TIMES) {
            // Check quá khứ
            if (isToday) {
              const [h, m] = t.split(':').map(Number);
              if (h < nowH || (h === nowH && m <= nowM)) continue;
            }
            // Check trùng lịch
            const tEnd = calcEndTime(t, duration);
            const overlapping = list.some(s => {
              if (s.trang_thai === 'da_huy') return false;
              return t < s.gio_ket_thuc && tEnd > s.gio_bat_dau;
            });
            if (overlapping) continue;

            foundStart = t;
            break;
          }

          if (foundStart) {
            setStartTime(foundStart);
            setEndTime(calcEndTime(foundStart, duration));
          } else {
            // PT kín lịch cả ngày hoặc quá giờ
            setStartTime('');
            setEndTime('');
          }
        }
      } catch (err) {
        console.error('Fetch PT schedules error:', err);
      } finally {
        setLoadingSchedules(false);
      }
    };

    fetchSchedules();
  }, [selectedContract, startDate, duration]);

  const handleSelectStart = (t) => {
    setStartTime(t);
    setEndTime(calcEndTime(t, duration));
  };

  const handleRegister = async () => {
    if (!selectedContract) {
      Alert.alert('Lỗi', 'Hội viên này chưa có hợp đồng PT đang hoạt động.');
      return;
    }
    const ymdDate = convertDMYToYMD(startDate);
    if (!ymdDate || !/^\d{4}-\d{2}-\d{2}$/.test(ymdDate)) {
      Alert.alert('Lỗi', 'Ngày tập phải đúng định dạng DD/MM/YYYY (VD: 25/05/2026).');
      return;
    }
    if (endTime <= startTime) {
      Alert.alert('Lỗi', 'Giờ kết thúc phải sau giờ bắt đầu.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        dang_ky_pt_id: selectedContract.id,
        ngay_tap: ymdDate,
        gio_bat_dau: startTime,
        gio_ket_thuc: endTime,
        loai_buoi: 'ca_nhan',
        ghi_chu: note.trim() || 'Đặt lịch qua di động'
      };
      const res = await api.post('/pt/schedules', payload);
      if (res.data?.success) {
        Alert.alert('Thành công', 'Đặt lịch tập PT thành công!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Lỗi', res.data?.message || 'Đặt lịch tập thất bại.');
      }
    } catch (err) {
      console.log('[RegisterPTSchedule] error:', err?.response?.data || err?.message);
      Alert.alert('Lỗi', err?.response?.data?.message || err?.message || 'Có lỗi xảy ra.');
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: insets.top, height: 60 + insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <X color={colors.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Đặt Lịch Tập PT</Text>
        <TouchableOpacity onPress={handleRegister} disabled={submitting} style={styles.headerBtn}>
          {submitting ? <ActivityIndicator size="small" color={colors.primary} /> : <Save color={colors.primary} size={20} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hội viên info banner */}
        <View style={[styles.memberInfo, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.memberLabel, { color: colors.textSecondary }]}>Đăng ký lịch tập cho:</Text>
          <Text style={[styles.memberName, { color: colors.text }]}>{member?.ho_ten} ({member?.ma_ho_so})</Text>
        </View>

        {/* Chọn hợp đồng PT */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Chọn Hợp đồng PT</Text>
        <View style={styles.contractList}>
          {contracts.map((item) => {
            const active = selectedContract?.id === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.contractItem,
                  { backgroundColor: colors.surface, borderColor: active ? colors.primary : colors.border },
                  active && { borderLeftWidth: 4, borderLeftColor: colors.primary }
                ]}
                onPress={() => setSelectedContract(item)}
                activeOpacity={0.8}
              >
                <Dumbbell color={active ? colors.primary : colors.textSecondary} size={20} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.contractTitle, { color: colors.text }]}>HLV: {item.ten_pt}</Text>
                  <Text style={[styles.contractDetails, { color: colors.textSecondary }]}>
                    Số buổi: {item.buoi_da_tap}/{item.buoi_dang_ky} buổi (Còn {item.buoi_dang_ky - item.buoi_da_tap} buổi)
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedContract && (
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Ngày tập */}
            <DatePickerField
              label="Ngày tập"
              required
              value={startDate}
              onChangeText={setStartDate}
              placeholder="Chọn ngày tập"
              colors={colors}
              returnFormat="DD/MM/YYYY"
              minDate={new Date()}
            />

            {/* Thời lượng buổi tập */}
            <View style={{ marginTop: 4 }}>
              <TimeSelector
                label="Thời lượng buổi tập"
                value={
                  duration === '30' ? '30 phút' :
                  duration === '60' ? '1 giờ' :
                  duration === '90' ? '1 giờ 30 phút' :
                  duration === '120' ? '2 giờ' : '1 giờ'
                }
                onPress={() => setShowDurationPicker(true)}
                colors={colors}
                required
              />
            </View>

            {/* Giờ bắt đầu / kết thúc */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TimeSelector
                label="Giờ bắt đầu"
                value={startTime || 'Chọn giờ'}
                onPress={() => setShowStartPicker(true)}
                colors={colors}
                required
              />
              <View style={{ flex: 1 }}>
                <FieldLabel label="Giờ kết thúc (Tự động)" colors={colors} />
                <View
                  style={[styles.timeSelectorBtn, { borderColor: colors.border, backgroundColor: colors.surfaceVariant, opacity: 0.7 }]}
                >
                  <Clock color={colors.textMuted} size={16} />
                  <Text style={[styles.timeSelectorText, { color: colors.textSecondary }]}>{endTime || '—'}</Text>
                </View>
              </View>
            </View>

            {/* Ghi chú */}
            <FieldLabel label="Ghi chú buổi tập" colors={colors} />
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              placeholder="VD: Tập cardio nhẹ, đo chỉ số BMI..."
              placeholderTextColor={colors.textMuted}
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: selectedContract ? 1 : 0.6 }]}
          onPress={handleRegister}
          disabled={submitting || !selectedContract}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>Xác nhận Đặt lịch</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Pickers */}
      <TimePickerModal
        visible={showStartPicker}
        times={START_TIMES}
        selected={startTime}
        onSelect={handleSelectStart}
        onClose={() => setShowStartPicker(false)}
        title="Chọn giờ bắt đầu"
        colors={colors}
        checkDisabled={isTimeSlotDisabled}
      />
      <DurationPickerModal
        visible={showDurationPicker}
        selected={duration}
        onSelect={setDuration}
        onClose={() => setShowDurationPicker(false)}
        colors={colors}
      />
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
  scroll: { padding: 16 },

  memberInfo: { padding: 12, borderRadius: 12, marginBottom: 16 },
  memberLabel: { fontSize: 11 },
  memberName: { fontSize: 14, fontWeight: '700', marginTop: 2 },

  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 12, marginBottom: 8, paddingLeft: 4 },
  contractList: { gap: 10, marginBottom: 16 },
  contractItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1
  },
  contractTitle: { fontSize: 14, fontWeight: '700' },
  contractDetails: { fontSize: 11, marginTop: 2 },

  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.01,
    shadowRadius: 6,
    elevation: 1
  },
  label: { fontSize: 12, fontWeight: '600', marginTop: 8, marginBottom: 4 },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  inputField: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    padding: 0
  },
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
  textArea: {
    height: 80,
    paddingTop: 10,
    textAlignVertical: 'top'
  },
  submitBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  submitBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '800' }
});
