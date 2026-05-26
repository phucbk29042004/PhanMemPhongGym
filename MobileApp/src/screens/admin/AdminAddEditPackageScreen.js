import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Save, Package, Award, Dumbbell } from 'lucide-react-native';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

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

export default function AdminAddEditPackageScreen({ route, navigation }) {
  const { isPtPackage, packageId } = route.params || {}; // isPtPackage: boolean, packageId: id (undefined if adding)
  const isEdit = packageId != null;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [pkgType, setPkgType] = useState(isPtPackage ? 'pt' : 'gym'); // 'gym' | 'pt'
  const [tenGoi, setTenGoi] = useState('');
  const [gia, setGia] = useState('');
  const [moTa, setMoTa] = useState('');

  // Gym package states
  const [soThang, setSoThang] = useState('1');
  const [soNgayThem, setSoNgayThem] = useState('0');

  // PT package states
  const [ptType, setPtType] = useState('theo_buoi'); // 'theo_buoi' | 'theo_thang'
  const [soBuoi, setSoBuoi] = useState('10');
  const [soThangPt, setSoThangPt] = useState('1');

  useEffect(() => {
    if (isEdit) {
      const loadPackage = async () => {
        setLoading(true);
        try {
          if (isPtPackage) {
            // Fetch PT packages to find the one we need since there's no direct GET /packages/pt/:id
            const res = await api.get('/packages/pt');
            if (res.data?.success) {
              const list = res.data.data || [];
              const item = list.find((p) => p.id === packageId);
              if (item) {
                setPkgType('pt');
                setTenGoi(item.ten_goi || '');
                setGia(String(item.gia || 0));
                setMoTa(item.mo_ta || '');
                setPtType(item.loai_goi || 'theo_buoi');
                setSoBuoi(String(item.so_buoi || 10));
                setSoThangPt(String(item.so_thang || 1));
              }
            }
          } else {
            // Fetch Gym package
            const res = await api.get(`/packages/${packageId}`);
            if (res.data?.success) {
              const item = res.data.data;
              setPkgType('gym');
              setTenGoi(item.ten_goi || '');
              setGia(String(item.gia || 0));
              setMoTa(item.mo_ta || '');
              setSoThang(String(item.so_thang || 1));
              setSoNgayThem(String(item.so_ngay_them || 0));
            }
          }
        } catch (err) {
          console.error('[AddEditPackage] fetch error:', err?.message);
        } finally {
          setLoading(false);
        }
      };
      loadPackage();
    }
  }, [isEdit, packageId, isPtPackage]);

  const handleSave = async () => {
    if (!tenGoi.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên gói tập.');
      return;
    }
    if (gia === '' || gia === null || gia === undefined) {
      Alert.alert('Lỗi', 'Vui lòng nhập giá gói.');
      return;
    }
    const giaVal = Number(gia);
    if (isNaN(giaVal) || giaVal <= 0) {
      Alert.alert('Lỗi', 'Giá gói tập phải là một số dương hợp lệ.');
      return;
    }

    if (pkgType === 'gym') {
      const soThangVal = Number(soThang);
      if (isNaN(soThangVal) || soThangVal <= 0) {
        Alert.alert('Lỗi', 'Thời hạn (số tháng) phải là số dương hợp lệ.');
        return;
      }
      const soNgayThemVal = Number(soNgayThem);
      if (isNaN(soNgayThemVal) || soNgayThemVal < 0) {
        Alert.alert('Lỗi', 'Số ngày tặng thêm phải là một số không âm.');
        return;
      }
    } else {
      if (ptType === 'theo_buoi') {
        const soBuoiVal = Number(soBuoi);
        if (isNaN(soBuoiVal) || soBuoiVal <= 0) {
          Alert.alert('Lỗi', 'Số buổi tập phải là số dương hợp lệ.');
          return;
        }
      } else {
        const soThangPtVal = Number(soThangPt);
        if (isNaN(soThangPtVal) || soThangPtVal <= 0) {
          Alert.alert('Lỗi', 'Thời hạn (số tháng) phải là số dương hợp lệ.');
          return;
        }
      }
    }

    setSaving(true);
    try {
      if (pkgType === 'gym') {
        const payload = {
          ten_goi: tenGoi.trim(),
          so_thang: Number(soThang),
          so_ngay_them: Number(soNgayThem),
          gia: giaVal,
          mo_ta: moTa.trim() || null
        };

        if (isEdit) {
          await api.put(`/packages/${packageId}`, payload);
        } else {
          await api.post('/packages', payload);
        }
      } else {
        const payload = {
          ten_goi: tenGoi.trim(),
          loai_goi: ptType,
          so_buoi: ptType === 'theo_buoi' ? Number(soBuoi) : null,
          so_thang: ptType === 'theo_thang' ? Number(soThangPt) : null,
          gia: giaVal,
          mo_ta: moTa.trim() || null
        };

        if (isEdit) {
          await api.put(`/packages/pt/${packageId}`, payload);
        } else {
          await api.post('/packages/pt', payload);
        }
      }

      Alert.alert('Thành công', isEdit ? 'Đã cập nhật gói tập.' : 'Đã tạo gói tập mới.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.error('[AddEditPackage] save error:', err?.response?.data || err?.message);
      Alert.alert('Lỗi', err?.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setSaving(false);
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
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: insets.top, height: 60 + insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <X color={colors.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isEdit ? 'Sửa Gói tập' : 'Thêm Gói tập Mới'}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.headerBtn}>
          {saving ? <ActivityIndicator size="small" color={colors.primary} /> : <Save color={colors.primary} size={20} />}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Chọn loại gói (chỉ khi thêm mới) */}
          {!isEdit && (
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tabBtn, pkgType === 'gym' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                onPress={() => setPkgType('gym')}
              >
                <Award color={pkgType === 'gym' ? colors.primary : colors.textMuted} size={16} />
                <Text style={[styles.tabText, { color: pkgType === 'gym' ? colors.primary : colors.textSecondary }]}>Gói Gym</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, pkgType === 'pt' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                onPress={() => setPkgType('pt')}
              >
                <Dumbbell color={pkgType === 'pt' ? colors.primary : colors.textMuted} size={16} />
                <Text style={[styles.tabText, { color: pkgType === 'pt' ? colors.primary : colors.textSecondary }]}>Gói PT</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Form */}
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Thông tin gói</Text>
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <FieldLabel label="Tên gói tập" required colors={colors} />
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
              value={tenGoi}
              onChangeText={setTenGoi}
              placeholder="VD: Gói Gym 3 tháng Premium"
              placeholderTextColor={colors.textMuted}
            />

            <FieldLabel label="Giá gói (đ)" required colors={colors} />
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
              value={gia}
              onChangeText={setGia}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />

            {/* Gym specific */}
            {pkgType === 'gym' && (
              <View style={{ gap: 8 }}>
                <FieldLabel label="Thời hạn (Số tháng)" colors={colors} />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
                  value={soThang}
                  onChangeText={setSoThang}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor={colors.textMuted}
                />

                <FieldLabel label="Số ngày tặng thêm" colors={colors} />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
                  value={soNgayThem}
                  onChangeText={setSoNgayThem}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            )}

            {/* PT specific */}
            {pkgType === 'pt' && (
              <View style={{ gap: 8 }}>
                <FieldLabel label="Loại gói PT" colors={colors} />
                <View style={styles.radioRow}>
                  {[
                    { key: 'theo_buoi', label: 'Theo buổi' },
                    { key: 'theo_thang', label: 'Theo tháng' }
                  ].map((t) => {
                    const active = ptType === t.key;
                    return (
                      <TouchableOpacity
                        key={t.key}
                        style={[
                          styles.radioBtn,
                          { borderColor: active ? colors.primary : colors.border },
                          active && { backgroundColor: colors.primaryLight }
                        ]}
                        onPress={() => setPtType(t.key)}
                      >
                        <Text style={{ color: active ? colors.primary : colors.textSecondary, fontWeight: active ? '700' : '500' }}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {ptType === 'theo_buoi' ? (
                  <View>
                    <FieldLabel label="Số buổi tập" colors={colors} />
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
                      value={soBuoi}
                      onChangeText={setSoBuoi}
                      keyboardType="numeric"
                      placeholder="10"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                ) : (
                  <View>
                    <FieldLabel label="Thời hạn (Số tháng)" colors={colors} />
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
                      value={soThangPt}
                      onChangeText={setSoThangPt}
                      keyboardType="numeric"
                      placeholder="1"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                )}
              </View>
            )}

            <FieldLabel label="Mô tả chi tiết" colors={colors} />
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
              value={moTa}
              onChangeText={setMoTa}
              multiline
              numberOfLines={3}
              placeholder="Nhập mô tả quyền lợi gói..."
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>{isEdit ? 'Lưu thay đổi' : 'Tạo gói tập'}</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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

  tabRow: { flexDirection: 'row', marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  tabText: { fontSize: 13, fontWeight: '600' },

  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 12, marginBottom: 8, paddingLeft: 4 },
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
  radioRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  radioBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
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
