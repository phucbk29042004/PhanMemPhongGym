import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { X, Award, CreditCard, Building2, Calendar, Dumbbell, User, Save } from 'lucide-react-native';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

function formatPrice(val) {
  if (val == null) return '0đ';
  return Number(val).toLocaleString('vi-VN') + 'đ';
}

// ── Helpers ──────────────────────────────────────────────────────────
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

export default function AdminRegisterPTScreen({ route, navigation }) {
  const { member } = route.params;
  const { colors } = useTheme();

  // States
  const [trainers, setTrainers] = useState([]);
  const [ptPackages, setPtPackages] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form inputs
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [endDate, setEndDate] = useState(''); // YYYY-MM-DD
  const [actualPrice, setActualPrice] = useState('');
  const [sessionCount, setSessionCount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('tien_mat'); // 'tien_mat' | 'chuyen_khoan'
  const [note, setNote] = useState('');

  useEffect(() => {
    const loadInitData = async () => {
      try {
        const [trainerRes, pkgRes] = await Promise.all([
          api.get('/trainers'),
          api.get('/packages/pt')
        ]);
        if (trainerRes.data?.success) {
          setTrainers(trainerRes.data.data?.trainers || trainerRes.data.data || []);
        }
        if (pkgRes.data?.success) {
          setPtPackages(pkgRes.data.data || []);
        }
      } catch (err) {
        console.error('[RegisterPT] init error:', err?.message);
      } finally {
        setLoading(false);
      }
    };
    loadInitData();
  }, []);

  const handleSelectPackage = (pkg) => {
    setSelectedPkg(pkg);
    setActualPrice(String(pkg.gia));
    setSessionCount(String(pkg.so_buoi));
    
    // Automatically calculate den_ngay if applicable, e.g. packages usually last 1-3 months.
    // Gym usually has so_thang, but let's let the admin set it or compute a default of +3 months
    const start = new Date();
    start.setMonth(start.getMonth() + 3);
    setEndDate(start.toISOString().split('T')[0]);
  };

  const handleRegister = async () => {
    if (!selectedTrainer) {
      Alert.alert('Lỗi', 'Vui lòng chọn Huấn luyện viên (PT).');
      return;
    }
    if (!selectedPkg) {
      Alert.alert('Lỗi', 'Vui lòng chọn một gói PT.');
      return;
    }

    if (!startDate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(startDate.trim())) {
      Alert.alert('Lỗi', 'Ngày bắt đầu phải đúng định dạng YYYY-MM-DD.');
      return;
    }
    if (endDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(endDate.trim())) {
      Alert.alert('Lỗi', 'Ngày kết thúc phải đúng định dạng YYYY-MM-DD.');
      return;
    }

    const price = Number(actualPrice);
    const sessions = Number(sessionCount);

    if (isNaN(price) || price < 0) {
      Alert.alert('Lỗi', 'Giá thực tế không hợp lệ.');
      return;
    }
    if (isNaN(sessions) || sessions <= 0) {
      Alert.alert('Lỗi', 'Số buổi tập không hợp lệ.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        hoi_vien_id: member.id,
        pt_id: selectedTrainer.id,
        goi_pt_id: selectedPkg.id,
        so_buoi_dang_ky: sessions,
        tu_ngay: startDate,
        den_ngay: endDate || null,
        gia_thuc_te: price,
        phuong_thuc_tt: paymentMethod,
        ghi_chu_tt: note || 'Đăng ký PT qua di động'
      };

      const res = await api.post('/pt/registrations', payload);
      if (res.data?.success) {
        Alert.alert('Thành công', `Đăng ký gói PT thành công với HLV ${selectedTrainer.ho_ten}!`, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Lỗi', res.data?.message || 'Đăng ký PT thất bại.');
      }
    } catch (err) {
      console.error('[RegisterPT] error:', err?.response?.data || err?.message);
      Alert.alert('Lỗi', err?.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <X color={colors.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Đăng ký gói PT</Text>
        <TouchableOpacity onPress={handleRegister} disabled={submitting} style={styles.headerBtn}>
          {submitting ? <ActivityIndicator size="small" color={colors.primary} /> : <Save color={colors.primary} size={20} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hội viên */}
        <View style={[styles.memberInfo, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.memberLabel, { color: colors.textSecondary }]}>Đăng ký cho hội viên:</Text>
          <Text style={[styles.memberName, { color: colors.text }]}>{member.ho_ten} ({member.ma_ho_so})</Text>
        </View>

        {/* Danh sách HLV (PT) */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Chọn Huấn Luyện Viên (PT)</Text>
        <View style={styles.listContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {trainers.map((pt) => {
              const active = selectedTrainer?.id === pt.id;
              return (
                <TouchableOpacity
                  key={pt.id}
                  style={[
                    styles.trainerCard,
                    { backgroundColor: colors.surface, borderColor: active ? colors.primary : colors.border }
                  ]}
                  onPress={() => setSelectedTrainer(pt)}
                >
                  <User color={active ? colors.primary : colors.textSecondary} size={24} />
                  <Text style={[styles.trainerName, { color: colors.text }]} numberOfLines={1}>{pt.ho_ten}</Text>
                  <Text style={[styles.trainerSub, { color: colors.textSecondary }]} numberOfLines={1}>{pt.chuyen_mon || 'Gym/Fitness'}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Danh sách gói PT */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Chọn Gói tập PT</Text>
        <View style={styles.packageList}>
          {ptPackages.map((pkg) => {
            const active = selectedPkg?.id === pkg.id;
            return (
              <TouchableOpacity
                key={pkg.id}
                style={[
                  styles.packageItem,
                  { backgroundColor: colors.surface, borderColor: active ? colors.primary : colors.border },
                  active && { borderLeftWidth: 4, borderLeftColor: colors.primary }
                ]}
                onPress={() => handleSelectPackage(pkg)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.packageName, { color: colors.text }]}>{pkg.ten_goi}</Text>
                  <Text style={[styles.packageDetails, { color: colors.textSecondary }]}>
                    Số buổi dạy: {pkg.so_buoi} buổi
                  </Text>
                </View>
                <Text style={[styles.packagePrice, { color: active ? colors.primary : colors.text, fontWeight: '800' }]}>
                  {formatPrice(pkg.gia)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedPkg && selectedTrainer && (
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <FieldLabel label="Ngày bắt đầu (YYYY-MM-DD)" required colors={colors} />
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="VD: 2026-05-25"
              placeholderTextColor={colors.textMuted}
            />

            <FieldLabel label="Ngày kết thúc (YYYY-MM-DD)" colors={colors} />
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="VD: 2026-08-25"
              placeholderTextColor={colors.textMuted}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <FieldLabel label="Số buổi tập" required colors={colors} />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
                  value={sessionCount}
                  onChangeText={setSessionCount}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel label="Giá thanh toán (đ)" required colors={colors} />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
                  value={actualPrice}
                  onChangeText={setActualPrice}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <FieldLabel label="Phương thức thanh toán" required colors={colors} />
            <View style={styles.paymentMethodRow}>
              {[
                { key: 'tien_mat', label: 'Tiền mặt' },
                { key: 'chuyen_khoan', label: 'Chuyển khoản' }
              ].map((m) => {
                const active = paymentMethod === m.key;
                return (
                  <TouchableOpacity
                    key={m.key}
                    style={[
                      styles.paymentMethodBtn,
                      { borderColor: active ? colors.primary : colors.border },
                      active && { backgroundColor: colors.primaryLight }
                    ]}
                    onPress={() => setPaymentMethod(m.key)}
                  >
                    <Text style={{ color: active ? colors.primary : colors.textSecondary, fontWeight: active ? '700' : '500' }}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <FieldLabel label="Ghi chú" colors={colors} />
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              placeholder="Nhập ghi chú đăng ký..."
              placeholderTextColor={colors.textMuted}
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: (selectedPkg && selectedTrainer) ? 1 : 0.6 }]}
          onPress={handleRegister}
          disabled={submitting || !selectedPkg || !selectedTrainer}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>Đăng ký Gói PT</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  listContainer: { marginVertical: 6 },
  trainerCard: {
    width: 110,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 4
  },
  trainerName: { fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  trainerSub: { fontSize: 10, textAlign: 'center' },

  packageList: { gap: 10, marginBottom: 16, marginTop: 4 },
  packageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1
  },
  packageName: { fontSize: 14, fontWeight: '700' },
  packageDetails: { fontSize: 11, marginTop: 2 },
  packagePrice: { fontSize: 15 },

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
  textArea: {
    height: 80,
    paddingTop: 10,
    textAlignVertical: 'top'
  },
  paymentMethodRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  paymentMethodBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
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
