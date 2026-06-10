import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, Shield, X, Save, User, Phone, Mail, Award, Dumbbell } from 'lucide-react-native';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import DatePickerField from '../../components/DatePickerField';
import { useAuthStore } from '../../store/useAuthStore';

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

function SelectField({ label, required = false, value, options, onSelect, colors, disabled = false }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.v === value);
  return (
    <View style={{ marginBottom: 12 }}>
      <FieldLabel label={label} required={required} colors={colors} />
      <TouchableOpacity
        style={[styles.input, { backgroundColor: disabled ? colors.border : colors.surfaceVariant, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, opacity: disabled ? 0.7 : 1 }]}
        onPress={() => { if (!disabled) setOpen(!open); }}
        activeOpacity={disabled ? 1 : 0.8}
      >
        <Text style={{ color: selected ? colors.text : colors.textMuted, fontSize: 14, fontWeight: '600', flex: 1 }}>
          {selected ? selected.t : `— ${label.replace('*', '').trim()} —`}
        </Text>
        {!disabled && <ChevronDown color={colors.textMuted} size={16} />}
      </TouchableOpacity>
      {open && !disabled && (
        <View style={{ borderWidth: 1, borderRadius: 12, marginTop: 4, overflow: 'hidden', zIndex: 100, backgroundColor: colors.surface, borderColor: colors.border }}>
          {options.map((o) => (
            <TouchableOpacity
              key={o.v}
              style={{ paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}
              onPress={() => { onSelect(o.v); setOpen(false); }}
            >
              <Text style={{ color: o.v === value ? colors.primary : colors.text, fontWeight: o.v === value ? '700' : '500', fontSize: 14 }}>
                {o.t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function AdminAddEditPTScreen({ route, navigation }) {
  const ptId = route.params?.ptId; // undefined if adding new
  const isEdit = ptId != null;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, selectedBranch } = useAuthStore();
  const isStaffWithBranch = !isEdit && user?.chi_nhanh && user?.vai_tro !== 'admin' && user?.vai_tro !== 'chu_phong_gym';

  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [hoTen, setHoTen] = useState('');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [email, setEmail] = useState('');
  const [gioiTinh, setGioiTinh] = useState('nam'); // 'nam' | 'nu'
  const [ngaySinh, setNgaySinh] = useState(''); // YYYY-MM-DD
  const [chuyenMon, setChuyenMon] = useState('Fitness');
  const [kinhNghiem, setKinhNghiem] = useState('1');
  const [chiNhanh, setChiNhanh] = useState(isEdit ? '' : (selectedBranch || ''));
  const [ghiChu, setGhiChu] = useState('');

  // Branches list
  const [branches, setBranches] = useState([
    { id: 'go-vap', ten: 'Chi nhánh Gò Vấp' },
    { id: 'binh-thanh', ten: 'Chi nhánh Bình Thạnh' },
    { id: 'tan-binh', ten: 'Chi nhánh Tân Bình' },
    { id: 'quan-1', ten: 'Chi nhánh Quận 1' },
  ]);

  // Account creation states (only when adding new or no account exists yet)
  const [taiKhoanId, setTaiKhoanId] = useState(null);
  const [createAcc, setCreateAcc] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('123456');

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const branchRes = await api.get('/branches');
        if (branchRes.data?.success && Array.isArray(branchRes.data.data)) {
          setBranches(branchRes.data.data);
        }
      } catch (err) {
        console.log('[AdminAddEditPTScreen] branches load error:', err.message);
      }
    };
    loadBranches();
  }, []);

  useEffect(() => {
    if (isEdit) {
      const loadPT = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/trainers/${ptId}`);
          if (res.data?.success) {
            const data = res.data.data;
            setHoTen(data.ho_ten || '');
            setSoDienThoai(data.so_dien_thoai || '');
            setEmail(data.email || '');
            setGioiTinh(data.gioi_tinh || 'nam');
            setNgaySinh(data.ngay_sinh || '');
            setChuyenMon(data.chuyen_mon || 'Fitness');
            setKinhNghiem(String(data.kinh_nghiem || 0));
            setChiNhanh(data.chi_nhanh || '');
            setGhiChu(data.ghi_chu || '');
            setTaiKhoanId(data.tai_khoan_id || null);
          }
        } catch (err) {
          console.error('[AddEditPT] fetch error:', err?.message);
        } finally {
          setLoading(false);
        }
      };
      loadPT();
    }
  }, [isEdit, ptId]);

  const handleSave = async () => {
    if (!hoTen.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên PT.');
      return;
    }

    if (!soDienThoai.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại PT.');
      return;
    }

    const phoneRegex = /^(03|04|05|07|08|09)\d{8}$/;
    if (!phoneRegex.test(soDienThoai.trim())) {
      Alert.alert('Lỗi', 'Số điện thoại không hợp lệ (phải gồm 10 chữ số và bắt đầu bằng 03, 04, 05, 07, 08 hoặc 09).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.trim() && !emailRegex.test(email.trim())) {
      Alert.alert('Lỗi', 'Địa chỉ email không đúng định dạng.');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (ngaySinh.trim() && !dateRegex.test(ngaySinh.trim())) {
      Alert.alert('Lỗi', 'Ngày sinh phải đúng định dạng YYYY-MM-DD (VD: 1995-10-12).');
      return;
    }

    if (!chiNhanh) {
      Alert.alert('Lỗi', 'Vui lòng chọn chi nhánh cho PT.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ho_ten: hoTen.trim(),
        so_dien_thoai: soDienThoai.trim(),
        email: email.trim(),
        gioi_tinh: gioiTinh,
        ngay_sinh: ngaySinh.trim() || null,
        chuyen_mon: chuyenMon.trim(),
        kinh_nghiem: parseInt(kinhNghiem) || 0,
        chi_nhanh: chiNhanh || null,
        ghi_chu: ghiChu.trim() || null,
        loai_ho_so: 'pt'
      };

      let ptSavedId = ptId;

      if (isEdit) {
        // Edit Trainer API
        const res = await api.put(`/trainers/${ptId}`, payload);
        if (!res.data?.success) throw new Error(res.data?.message || 'Không thể cập nhật.');

        // Account creation for edit mode (if PT doesn't have an account and createAcc is checked)
        if (!taiKhoanId && createAcc && username.trim() && ptId) {
          try {
            await api.post(`/members/${ptId}/create-account`, {
              ten_dang_nhap: username.trim(),
              mat_khau: password
            });
          } catch (accErr) {
            Alert.alert('Cảnh báo', `Cập nhật PT thành công nhưng không thể cấp tài khoản: ${accErr?.response?.data?.message || accErr.message}`);
          }
        }
      } else {
        // Add Trainer API
        const res = await api.post('/trainers', payload);
        if (!res.data?.success) throw new Error(res.data?.message || 'Không thể tạo mới.');
        ptSavedId = res.data.data?.id;

        // If create account is checked
        if (createAcc && username.trim() && ptSavedId) {
          try {
            await api.post(`/members/${ptSavedId}/create-account`, {
              ten_dang_nhap: username.trim(),
              mat_khau: password
            });
          } catch (accErr) {
            Alert.alert('Cảnh báo', `Tạo hồ sơ PT thành công nhưng không thể cấp tài khoản: ${accErr?.response?.data?.message || accErr.message}`);
          }
        }
      }

      Alert.alert('Thành công', isEdit ? 'Đã cập nhật hồ sơ PT.' : 'Đã thêm PT mới thành công.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.error('[AddEditPT] save error:', err?.response?.data || err?.message);
      Alert.alert('Lỗi', err?.response?.data?.message || 'Đã có lỗi xảy ra.');
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>{isEdit ? 'Chỉnh sửa PT' : 'Thêm PT Mới'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.headerBtn}>
          {saving ? <ActivityIndicator size="small" color={colors.primary} /> : <Save color={colors.primary} size={20} />}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Section 1: Thông tin cơ bản */}
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Thông tin cá nhân</Text>
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>

            <FieldLabel label="Họ và tên" required colors={colors} />
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
              value={hoTen}
              onChangeText={setHoTen}
              placeholder="Nhập họ tên PT..."
              placeholderTextColor={colors.textMuted}
            />

            <FieldLabel label="Số điện thoại" required colors={colors} />
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
              value={soDienThoai}
              onChangeText={setSoDienThoai}
              keyboardType="phone-pad"
              placeholder="Nhập SĐT..."
              placeholderTextColor={colors.textMuted}
            />

            <FieldLabel label="Email" colors={colors} />
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="pt.example@gmail.com"
              placeholderTextColor={colors.textMuted}
            />

            <FieldLabel label="Giới tính" colors={colors} />
            <View style={styles.radioRow}>
              {[
                { key: 'nam', label: 'Nam' },
                { key: 'nu', label: 'Nữ' }
              ].map((g) => {
                const active = gioiTinh === g.key;
                return (
                  <TouchableOpacity
                    key={g.key}
                    style={[
                      styles.radioBtn,
                      { borderColor: active ? colors.primary : colors.border },
                      active && { backgroundColor: colors.primaryLight }
                    ]}
                    onPress={() => setGioiTinh(g.key)}
                  >
                    <Text style={{ color: active ? colors.primary : colors.textSecondary, fontWeight: active ? '700' : '500' }}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <DatePickerField
              label="Ngày sinh"
              value={ngaySinh}
              onChangeText={setNgaySinh}
              placeholder="Chọn ngày sinh"
              colors={colors}
              returnFormat="dd/mm/yyyy"
            />

            <SelectField
              label="Chi nhánh trực thuộc"
              required
              value={chiNhanh}
              options={branches.map(b => ({ v: b.ten || b.id, t: b.ten || b.id }))}
              onSelect={setChiNhanh}
              colors={colors}
              disabled={isStaffWithBranch}
            />
          </View>

          {/* Section 2: Chuyên môn */}
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Chuyên môn & Kinh nghiệm</Text>
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>

            <FieldLabel label="Chuyên môn" colors={colors} />
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
              value={chuyenMon}
              onChangeText={setChuyenMon}
              placeholder="VD: Gym / Fitness / Yoga / Powerlifting"
              placeholderTextColor={colors.textMuted}
            />

            <FieldLabel label="Kinh nghiệm (Năm)" colors={colors} />
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
              value={kinhNghiem}
              onChangeText={setKinhNghiem}
              keyboardType="numeric"
              placeholder="VD: 3"
              placeholderTextColor={colors.textMuted}
            />

            <FieldLabel label="Ghi chú thêm" colors={colors} />
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
              value={ghiChu}
              onChangeText={setGhiChu}
              multiline
              numberOfLines={3}
              placeholder="Nhập ghi chú giới thiệu..."
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Section 3: Cấp tài khoản (khi thêm mới hoặc chưa có tài khoản) */}
          {(!isEdit || !taiKhoanId) && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Tài khoản đăng nhập</Text>
              <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>

                <TouchableOpacity
                  style={styles.toggleRow}
                  onPress={() => setCreateAcc(!createAcc)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, { borderColor: colors.primary, backgroundColor: createAcc ? colors.primary : 'transparent' }]}>
                    {createAcc && <View style={styles.checkboxInner} />}
                  </View>
                  <Text style={[styles.toggleLabel, { color: colors.text }]}>Tạo tài khoản đăng nhập PT</Text>
                </TouchableOpacity>

                {createAcc && (
                  <View style={{ marginTop: 12, gap: 12 }}>
                    <View>
                      <FieldLabel label="Tên đăng nhập" required colors={colors} />
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        placeholder="Nhập tên đăng nhập..."
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                    <View>
                      <FieldLabel label="Mật khẩu" required colors={colors} />
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholder="••••••"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                  </View>
                )}
              </View>
            </>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>{isEdit ? 'Cập nhật hồ sơ' : 'Thêm PT mới'}</Text>
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
  textArea: {
    height: 80,
    paddingTop: 10,
    textAlignVertical: 'top'
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
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: '#ffffff',
    borderRadius: 2
  },
  toggleLabel: { fontSize: 13, fontWeight: '600' },
  submitBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  submitBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '800' }
});
