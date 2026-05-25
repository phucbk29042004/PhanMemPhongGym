import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { X, Award, CreditCard, Building2, Calendar, Save } from 'lucide-react-native';
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

export default function AdminRegisterPackageScreen({ route, navigation }) {
  const { member } = route.params;
  const { colors } = useTheme();

  // States
  const [packages, setPackages] = useState([]);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form inputs
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [actualPrice, setActualPrice] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('tien_mat'); // 'tien_mat' | 'chuyen_khoan'
  const [branch, setBranch] = useState(member.chi_nhanh || 'go-vap');
  const [note, setNote] = useState('');

  const DEFAULT_BRANCHES = [
    { id: 'go-vap', ten: 'Chi nhánh Gò Vấp' },
    { id: 'binh-thanh', ten: 'Chi nhánh Bình Thạnh' },
    { id: 'tan-binh', ten: 'Chi nhánh Tân Bình' },
    { id: 'quan-1', ten: 'Chi nhánh Quận 1' }
  ];
  const [branches, setBranches] = useState(DEFAULT_BRANCHES);

  useEffect(() => {
    const loadInitData = async () => {
      try {
        const [pkgRes, branchRes] = await Promise.all([
          api.get('/packages'),
          api.get('/branches')
        ]);
        if (pkgRes.data?.success) {
          setPackages(pkgRes.data.data || []);
        }
        // API trả về { success, data: [...] } — phải đọc .data.data
        const branchArr = branchRes.data?.data;
        if (Array.isArray(branchArr) && branchArr.length > 0) {
          setBranches(branchArr);
        }
      } catch (err) {
        console.error('[RegisterPackage] init error:', err?.message);
      } finally {
        setLoading(false);
      }
    };
    loadInitData();
  }, []);

  const handleSelectPackage = (pkg) => {
    setSelectedPkg(pkg);
    setActualPrice(String(pkg.gia));
    setPaidAmount(String(pkg.gia));
  };

  const handleRegister = async () => {
    if (!selectedPkg) {
      Alert.alert('Lỗi', 'Vui lòng chọn một gói tập Gym.');
      return;
    }

    if (!startDate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(startDate.trim())) {
      Alert.alert('Lỗi', 'Ngày bắt đầu phải đúng định dạng YYYY-MM-DD.');
      return;
    }

    const price = Number(actualPrice);
    const paid = Number(paidAmount);

    if (isNaN(price) || price < 0) {
      Alert.alert('Lỗi', 'Giá thực tế không hợp lệ.');
      return;
    }
    if (isNaN(paid) || paid < 0) {
      Alert.alert('Lỗi', 'Số tiền thu thực tế không hợp lệ.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        goi_tap_id: selectedPkg.id,
        tu_ngay: startDate,
        gia_thuc_te: price,
        so_tien_da_thu: paid,
        phuong_thuc_tt: paymentMethod,
        ghi_chu_tt: note || 'Đăng ký trực tiếp qua di động',
        chi_nhanh_mua: branch
      };

      const res = await api.post(`/members/${member.id}/package`, payload);
      if (res.data?.success) {
        Alert.alert('Thành công', `Đăng ký gói ${selectedPkg.ten_goi} thành công!`, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Lỗi', res.data?.message || 'Đăng ký thất bại.');
      }
    } catch (err) {
      console.error('[RegisterPackage] error:', err?.response?.data || err?.message);
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Đăng ký Gói Gym</Text>
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

        {/* Danh sách gói Gym */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Chọn gói tập Gym</Text>
        <View style={styles.packageList}>
          {packages.map((pkg) => {
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
                    Thời hạn: {pkg.so_thang} tháng {pkg.so_ngay_them > 0 ? `+ ${pkg.so_ngay_them} ngày` : ''}
                  </Text>
                </View>
                <Text style={[styles.packagePrice, { color: active ? colors.primary : colors.text, fontWeight: '800' }]}>
                  {formatPrice(pkg.gia)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedPkg && (
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <FieldLabel label="Ngày bắt đầu (YYYY-MM-DD)" required colors={colors} />
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="VD: 2026-05-25"
              placeholderTextColor={colors.textMuted}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <FieldLabel label="Giá thực tế (đ)" required colors={colors} />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
                  value={actualPrice}
                  onChangeText={setActualPrice}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel label="Số tiền thu thực tế (đ)" required colors={colors} />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
                  value={paidAmount}
                  onChangeText={setPaidAmount}
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

            <FieldLabel label="Chi nhánh thanh toán" required colors={colors} />
            <View style={styles.branchSelectRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {branches.map((b) => {
                  const active = branch === b.ten || branch === b.id;
                  return (
                    <TouchableOpacity
                      key={b.id}
                      style={[
                        styles.branchBtn,
                        { borderColor: active ? colors.primary : colors.border },
                        active && { backgroundColor: colors.primaryLight }
                      ]}
                      onPress={() => setBranch(b.ten || b.id)}
                    >
                      <Text style={{ color: active ? colors.primary : colors.textSecondary, fontSize: 12, fontWeight: active ? '700' : '500' }}>
                        {b.ten}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <FieldLabel label="Ghi chú" colors={colors} />
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              placeholder="VD: Duyệt tại quầy, KM giảm giá..."
              placeholderTextColor={colors.textMuted}
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: selectedPkg ? 1 : 0.6 }]}
          onPress={handleRegister}
          disabled={submitting || !selectedPkg}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>Đăng ký Gói tập</Text>
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
  packageList: { gap: 10, marginBottom: 16 },
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
  branchSelectRow: { marginVertical: 6 },
  branchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
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
