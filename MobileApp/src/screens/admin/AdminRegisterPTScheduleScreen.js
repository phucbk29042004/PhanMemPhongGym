import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Calendar, Clock, Dumbbell, Save } from 'lucide-react-native';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

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

export default function AdminRegisterPTScheduleScreen({ route, navigation }) {
  const { member, activePT } = route.params || {};
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Find all active contracts
  const contracts = member?.pt_hien_tai || (activePT ? [activePT] : []);
  const [selectedContract, setSelectedContract] = useState(activePT || contracts[0] || null);

  const [submitting, setSubmitting] = useState(false);

  // Form inputs
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  }); // DD/MM/YYYY
  const [startTime, setStartTime] = useState('08:00'); // HH:MM
  const [endTime, setEndTime] = useState('09:30'); // HH:MM
  const [note, setNote] = useState('');

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

    if (!startTime.trim() || !/^\d{2}:\d{2}$/.test(startTime.trim())) {
      Alert.alert('Lỗi', 'Giờ bắt đầu phải đúng định dạng HH:MM (VD: 08:00).');
      return;
    }
    if (!endTime.trim() || !/^\d{2}:\d{2}$/.test(endTime.trim())) {
      Alert.alert('Lỗi', 'Giờ kết thúc phải đúng định dạng HH:MM (VD: 09:30).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        dang_ky_pt_id: selectedContract.id,
        ngay_tap: ymdDate,
        gio_bat_dau: startTime.trim(),
        gio_ket_thuc: endTime.trim(),
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
      console.error('[RegisterPTSchedule] error:', err?.response?.data || err?.message);
      Alert.alert('Lỗi', err?.response?.data?.message || 'Có lỗi xảy ra.');
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

        {/* Hợp đồng PT list */}
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
            <FieldLabel label="Ngày tập (DD/MM/YYYY)" required colors={colors} />
            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
              <Calendar color={colors.textMuted} size={18} style={{ marginRight: 10 }} />
              <TextInput
                style={[styles.inputField, { color: colors.text }]}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="VD: 25/05/2026"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <FieldLabel label="Giờ bắt đầu" required colors={colors} />
                <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
                  <Clock color={colors.textMuted} size={18} style={{ marginRight: 8 }} />
                  <select
                    style={{
                      flex: 1,
                      height: '100%',
                      backgroundColor: 'transparent',
                      color: colors.text,
                      borderWidth: 0,
                      fontSize: 14,
                      outline: 'none',
                      fontFamily: 'system-ui'
                    }}
                    value={startTime}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setStartTime(selected);
                      // Tự động set giờ kết thúc bằng giờ bắt đầu + 1.5 tiếng
                      const [h, m] = selected.split(':').map(Number);
                      let newH = h + 1;
                      let newM = m + 30;
                      if (newM >= 60) {
                        newH += 1;
                        newM -= 60;
                      }
                      const endStr = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
                      setEndTime(endStr);
                    }}
                  >
                    {Array.from({ length: 31 }, (_, i) => {
                      const hour = Math.floor(6 + i / 2);
                      const min = (i % 2) * 30;
                      const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
                      return (
                        <option key={timeStr} value={timeStr}>
                          {timeStr}
                        </option>
                      );
                    })}
                  </select>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel label="Giờ kết thúc" required colors={colors} />
                <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
                  <Clock color={colors.textMuted} size={18} style={{ marginRight: 8 }} />
                  <select
                    style={{
                      flex: 1,
                      height: '100%',
                      backgroundColor: 'transparent',
                      color: colors.text,
                      borderWidth: 0,
                      fontSize: 14,
                      outline: 'none',
                      fontFamily: 'system-ui'
                    }}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  >
                    {Array.from({ length: 31 }, (_, i) => {
                      const hour = Math.floor(7 + i / 2);
                      const min = (i % 2) * 30;
                      const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
                      return (
                        <option key={timeStr} value={timeStr} disabled={timeStr <= startTime}>
                          {timeStr}
                        </option>
                      );
                    })}
                  </select>
                </View>
              </View>
            </View>

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
  pickerWrap: {
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

