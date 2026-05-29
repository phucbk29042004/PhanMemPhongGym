import React, { useState, useRef } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Calendar, Clock, Dumbbell, Save, ChevronDown } from 'lucide-react-native';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

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
function TimePickerModal({ visible, times, selected, onSelect, onClose, title, colors }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={tp.overlay} activeOpacity={1} onPress={onClose}>
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
              return (
                <TouchableOpacity
                  style={[tp.item, isSelected && { backgroundColor: colors.primaryLight }]}
                  onPress={() => { onSelect(item); onClose(); }}
                  activeOpacity={0.7}
                >
                  <Clock color={isSelected ? colors.primary : colors.textMuted} size={14} />
                  <Text style={[tp.itemText, { color: isSelected ? colors.primary : colors.text }]}>
                    {item}
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
      </TouchableOpacity>
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
  const [endTime, setEndTime]     = useState('09:30');
  const [note, setNote]           = useState('');

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker]     = useState(false);

  const handleSelectStart = (t) => {
    setStartTime(t);
    // Tự động tính giờ kết thúc = +1.5h
    const [h, m] = t.split(':').map(Number);
    let nh = h + 1, nm = m + 30;
    if (nm >= 60) { nh += 1; nm -= 60; }
    const auto = `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
    // Chỉ set nếu auto còn trong danh sách
    if (END_TIMES.includes(auto)) setEndTime(auto);
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
        ngay_tap:     ymdDate,
        gio_bat_dau:  startTime,
        gio_ket_thuc: endTime,
        loai_buoi:    'ca_nhan',
        ghi_chu:      note.trim() || 'Đặt lịch qua di động'
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
      console.error('[RegisterPTSchedule] error:', err?.response?.data || err?.message);
      Alert.alert('Lỗi', err?.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setSubmitting(false);
    }
  };

  // Lọc giờ kết thúc để chỉ lấy những giờ > startTime
  const validEndTimes = END_TIMES.filter(t => t > startTime);

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
            <FieldLabel label="Ngày tập (DD/MM/YYYY)" required colors={colors} />
            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
              <Calendar color={colors.textMuted} size={18} style={{ marginRight: 10 }} />
              <TextInput
                style={[styles.inputField, { color: colors.text }]}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="VD: 25/05/2026"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            {/* Giờ bắt đầu / kết thúc */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TimeSelector
                label="Giờ bắt đầu"
                value={startTime}
                onPress={() => setShowStartPicker(true)}
                colors={colors}
                required
              />
              <TimeSelector
                label="Giờ kết thúc"
                value={endTime}
                onPress={() => setShowEndPicker(true)}
                colors={colors}
                required
              />
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
      />
      <TimePickerModal
        visible={showEndPicker}
        times={validEndTimes}
        selected={endTime}
        onSelect={setEndTime}
        onClose={() => setShowEndPicker(false)}
        title="Chọn giờ kết thúc"
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
