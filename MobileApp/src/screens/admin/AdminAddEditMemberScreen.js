import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronDown, X, Save, User, Phone, Mail, MapPin,
  Building2, Shield, CreditCard, Briefcase
} from 'lucide-react-native';
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

function InputField({
  label, required = false, value, onChangeText, placeholder,
  keyboardType = 'default', secureTextEntry = false,
  maxLength, multiline = false, colors, errorMsg = '',
  editable = true, numberOfLines = 1,
}) {
  return (
    <View style={styles.fieldContainer}>
      <FieldLabel label={label} required={required} colors={colors} />
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: editable ? colors.surfaceVariant : colors.surface,
            color: editable ? colors.text : colors.textMuted,
            borderColor: errorMsg ? '#ba1a1a' : colors.border,
            height: multiline ? 80 : 48,
            textAlignVertical: multiline ? 'top' : 'center',
          }
        ]}
        value={value}
        onChangeText={editable ? onChangeText : undefined}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        editable={editable}
      />
      {!!errorMsg && <Text style={styles.errorMsg}>{errorMsg}</Text>}
    </View>
  );
}

function SelectField({ label, required = false, value, options, onSelect, colors }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.v === value);
  return (
    <View style={styles.fieldContainer}>
      <FieldLabel label={label} required={required} colors={colors} />
      <TouchableOpacity
        style={[styles.input, styles.selectBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
        onPress={() => setOpen(!open)}
        activeOpacity={0.8}
      >
        <Text style={{ color: selected ? colors.text : colors.textMuted, fontSize: 14, fontWeight: '600', flex: 1 }}>
          {selected ? selected.t : `— ${label.replace('*', '').trim()} —`}
        </Text>
        <ChevronDown color={colors.textMuted} size={16} />
      </TouchableOpacity>
      {open && (
        <View style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {options.map((o) => (
            <TouchableOpacity
              key={o.v}
              style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
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

function SectionHeader({ title, colors }) {
  return (
    <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title}</Text>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────
export default function AdminAddEditMemberScreen({ route, navigation }) {
  const memberId = route.params?.memberId;
  const isEdit = memberId != null;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { selectedBranch } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Form: Thông tin cơ bản ──────────────────────────────────────────
  const [hoTen, setHoTen] = useState('');
  const [loaiHoSo, setLoaiHoSo] = useState(route.params?.defaultRole || 'hoi_vien');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [email, setEmail] = useState('');
  const [cccd, setCccd] = useState('');
  const [gioiTinh, setGioiTinh] = useState('nam');
  const [ngaySinh, setNgaySinh] = useState('');
  const [noiSinh, setNoiSinh] = useState('');

  // ── Form: Địa chỉ & Phòng tập ────────────────────────────────────────
  const [queQuan, setQueQuan] = useState('');
  const [diaChi, setDiaChi] = useState('');
  const [chiNhanh, setChiNhanh] = useState(isEdit ? '' : (selectedBranch || ''));
  const [loaiHv, setLoaiHv] = useState('standard');

  // ── Form: PT / NV đặc thù ────────────────────────────────────────────
  const [chuyenMon, setChuyenMon] = useState('');
  const [kinhNghiem, setKinhNghiem] = useState('');
  const [chucVu, setChucVu] = useState('');

  // ── Form: Tài khoản ──────────────────────────────────────────────────
  const [createAcc, setCreateAcc] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('123456');

  // ── Chi nhánh list ───────────────────────────────────────────────────
  const DEFAULT_BRANCHES = [
    { id: 'go-vap', ten: 'Chi nhánh Gò Vấp' },
    { id: 'binh-thanh', ten: 'Chi nhánh Bình Thạnh' },
    { id: 'tan-binh', ten: 'Chi nhánh Tân Bình' },
    { id: 'quan-1', ten: 'Chi nhánh Quận 1' },
  ];
  const [branches, setBranches] = useState(DEFAULT_BRANCHES);

  // ── Validation errors ─────────────────────────────────────────────────
  const [errSdt, setErrSdt] = useState('');
  const [errEmail, setErrEmail] = useState('');
  const [errCccd, setErrCccd] = useState('');

  // ── Fetch init data ────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const branchRes = await api.get('/branches');
        const arr = branchRes.data?.data;
        if (Array.isArray(arr) && arr.length > 0) setBranches(arr);

        if (isEdit) {
          const res = await api.get(`/members/${memberId}`);
          if (res.data?.success) {
            const d = res.data.data;
            setHoTen(d.ho_ten || '');
            setLoaiHoSo(d.loai_ho_so || 'hoi_vien');
            setSoDienThoai(d.so_dien_thoai || '');
            setEmail(d.email || '');
            setCccd(d.cccd || '');
            setGioiTinh(d.gioi_tinh || 'nam');
            setNgaySinh(d.ngay_sinh || '');
            setNoiSinh(d.noi_sinh || '');
            setQueQuan(d.que_quan || '');
            setDiaChi(d.dia_chi_tam_tru || '');
            setChiNhanh(d.chi_nhanh || '');
            setLoaiHv(d.loai_hv || 'standard');
            setChuyenMon(d.chuyen_mon || '');
            setKinhNghiem(d.kinh_nghiem ? String(d.kinh_nghiem) : '');
            setChucVu(d.chuc_vu || '');
          }
        }
      } catch (err) {
        console.error('[AddEditMember] init:', err?.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [isEdit, memberId]);

  // ── Validate ──────────────────────────────────────────────────────────
  const validate = () => {
    let ok = true;
    setErrSdt(''); setErrEmail(''); setErrCccd('');

    if (!hoTen.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ và tên.');
      return false;
    }
    if (!soDienThoai.trim()) {
      setErrSdt('Số điện thoại là bắt buộc');
      ok = false;
    } else if (!/^(0[3-9]\d{8})$/.test(soDienThoai.trim())) {
      setErrSdt('Số điện thoại phải có 10 chữ số, bắt đầu 03-09');
      ok = false;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrEmail('Email không hợp lệ (phải có @)');
      ok = false;
    }
    if (cccd.trim() && !/^\d{9}$|^\d{12}$/.test(cccd.trim())) {
      setErrCccd('CCCD phải có 12 chữ số (CMND 9 chữ số)');
      ok = false;
    }
    if (ngaySinh.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(ngaySinh.trim())) {
      Alert.alert('Lỗi', 'Ngày sinh phải đúng định dạng YYYY-MM-DD (VD: 1998-05-20).');
      return false;
    }
    if (loaiHoSo === 'pt' && !chuyenMon.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập chuyên môn PT.');
      return false;
    }
    if (loaiHoSo === 'nhan_vien' && !chucVu.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập chức vụ nhân viên.');
      return false;
    }
    if (!isEdit && createAcc) {
      if (!username.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập tên đăng nhập cho tài khoản mới.');
        return false;
      }
      if (!password || password.length < 6) {
        Alert.alert('Lỗi', 'Mật khẩu phải chứa ít nhất 6 ký tự.');
        return false;
      }
    }
    return ok;
  };

  // ── Save ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        ho_ten: hoTen.trim(),
        loai_ho_so: loaiHoSo,
        so_dien_thoai: soDienThoai.trim(),
        email: email.trim() || null,
        cccd: cccd.trim() || null,
        gioi_tinh: gioiTinh,
        ngay_sinh: ngaySinh.trim() || null,
        noi_sinh: noiSinh.trim() || null,
        que_quan: queQuan.trim() || null,
        dia_chi_tam_tru: diaChi.trim() || null,
        chi_nhanh: chiNhanh || null,
        loai_hv: loaiHv,
        chuyen_mon: chuyenMon.trim() || null,
        kinh_nghiem: kinhNghiem ? Number(kinhNghiem) : null,
        chuc_vu: chucVu.trim() || null,
      };

      let memberSavedId = memberId;
      if (isEdit) {
        const res = await api.put(`/members/${memberId}`, payload);
        if (!res.data?.success) throw new Error(res.data?.message || 'Không thể cập nhật.');
      } else {
        const res = await api.post('/members', payload);
        if (!res.data?.success) throw new Error(res.data?.message || 'Không thể tạo mới.');
        memberSavedId = res.data.data?.id;

        if (createAcc && username.trim() && memberSavedId) {
          try {
            await api.post(`/members/${memberSavedId}/create-account`, {
              ten_dang_nhap: username.trim(),
              mat_khau: password,
            });
          } catch (accErr) {
            Alert.alert('Cảnh báo', `Tạo hồ sơ thành công nhưng không thể cấp tài khoản: ${accErr?.response?.data?.message || accErr.message}`);
          }
        }
      }

      Alert.alert('Thành công', isEdit ? 'Đã cập nhật hồ sơ.' : 'Đã thêm hồ sơ mới.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('Lỗi', err?.response?.data?.message || err?.message || 'Đã có lỗi xảy ra.');
    } finally {
      setSaving(false);
    }
  };

  // ── Branch options ────────────────────────────────────────────────────
  const branchOptions = branches.map(b => ({ v: b.ten || b.id, t: b.ten || b.id }));

  // ── Render ────────────────────────────────────────────────────────────
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
          {isEdit ? 'Chỉnh sửa hồ sơ' : 'Thêm hồ sơ mới'}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.headerBtn}>
          {saving
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Save color={colors.primary} size={20} />}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Loại hồ sơ ── */}
          <SectionHeader title="Phân loại hồ sơ" colors={colors} />
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SelectField
              label="Loại hồ sơ"
              required
              value={loaiHoSo}
              options={[
                { v: 'hoi_vien', t: 'Hội viên' },
                { v: 'pt', t: 'Huấn luyện viên (PT)' },
                { v: 'nhan_vien', t: 'Nhân viên' },
              ]}
              onSelect={setLoaiHoSo}
              colors={colors}
            />
          </View>

          {/* ── Thông tin cơ bản ── */}
          <SectionHeader title="Thông tin cơ bản" colors={colors} />
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <InputField label="Họ và tên" required value={hoTen} onChangeText={setHoTen} placeholder="Nhập đầy đủ họ tên..." colors={colors} />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <SelectField
                  label="Giới tính"
                  value={gioiTinh}
                  options={[{ v: 'nam', t: 'Nam' }, { v: 'nu', t: 'Nữ' }, { v: 'khac', t: 'Khác' }]}
                  onSelect={setGioiTinh}
                  colors={colors}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <DatePickerField
                  label="Ngày sinh"
                  value={ngaySinh}
                  onChangeText={setNgaySinh}
                  placeholder="Chọn ngày sinh"
                  colors={colors}
                  returnFormat="YYYY-MM-DD"
                />
              </View>
            </View>

            <InputField
              label="Số điện thoại" required
              value={soDienThoai} onChangeText={t => { setSoDienThoai(t); setErrSdt(''); }}
              placeholder="0912345678" keyboardType="phone-pad" maxLength={10}
              errorMsg={errSdt} colors={colors}
            />
            <InputField
              label="Email"
              value={email} onChangeText={t => { setEmail(t); setErrEmail(''); }}
              placeholder="example@gmail.com" keyboardType="email-address"
              errorMsg={errEmail} colors={colors}
            />
            <InputField
              label="CCCD / CMND"
              value={cccd} onChangeText={t => { setCccd(t); setErrCccd(''); }}
              placeholder="012345678901" keyboardType="numeric" maxLength={12}
              errorMsg={errCccd} colors={colors}
            />
            <InputField label="Nơi sinh" value={noiSinh} onChangeText={setNoiSinh} placeholder="VD: Hà Nội" colors={colors} />
            <InputField label="Quê quán" value={queQuan} onChangeText={setQueQuan} placeholder="Chọn hoặc nhập tỉnh/thành..." colors={colors} />
          </View>

          {/* ── Địa chỉ & Phòng tập ── */}
          <SectionHeader title="Địa chỉ & Chi nhánh" colors={colors} />
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <InputField label="Số nhà / Đường / Phường / Quận" value={diaChi} onChangeText={setDiaChi} placeholder="123 Đường ABC, Phường X, Quận Y..." colors={colors} multiline numberOfLines={2} />
            <SelectField
              label="Chi nhánh trực thuộc"
              value={chiNhanh}
              options={branchOptions}
              onSelect={setChiNhanh}
              colors={colors}
            />
          </View>

          {/* ── Trường đặc thù theo loại hồ sơ ── */}
          {loaiHoSo === 'hoi_vien' && (
            <>
              <SectionHeader title="Thông tin Hội viên" colors={colors} />
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <SelectField
                  label="Hạng hội viên"
                  value={loaiHv}
                  options={[
                    { v: 'standard', t: 'Thường (Standard)' },
                    { v: 'premium', t: 'Premium' },
                    { v: 'vip', t: 'VIP' },
                    { v: 'student', t: 'Sinh viên' },
                  ]}
                  onSelect={setLoaiHv}
                  colors={colors}
                />
              </View>
            </>
          )}

          {loaiHoSo === 'pt' && (
            <>
              <SectionHeader title="Thông tin Huấn luyện viên PT" colors={colors} />
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <InputField
                  label="Chuyên môn PT" required
                  value={chuyenMon} onChangeText={setChuyenMon}
                  placeholder="VD: Gym, Yoga, Boxing, CrossFit..." colors={colors}
                />
                <InputField
                  label="Kinh nghiệm (năm)"
                  value={kinhNghiem} onChangeText={setKinhNghiem}
                  placeholder="VD: 3" keyboardType="numeric" colors={colors}
                />
              </View>
            </>
          )}

          {loaiHoSo === 'nhan_vien' && (
            <>
              <SectionHeader title="Thông tin Nhân viên" colors={colors} />
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <InputField
                  label="Chức vụ" required
                  value={chucVu} onChangeText={setChucVu}
                  placeholder="VD: Lễ tân, Quản lý..." colors={colors}
                />
              </View>
            </>
          )}

          {/* ── Tài khoản đăng nhập (chỉ khi thêm mới) ── */}
          {!isEdit && (
            <>
              <SectionHeader title="Tài khoản đăng nhập" colors={colors} />
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.checkboxRow]}
                  onPress={() => setCreateAcc(!createAcc)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, { borderColor: colors.primary, backgroundColor: createAcc ? colors.primary : 'transparent' }]}>
                    {createAcc && <View style={styles.checkboxInner} />}
                  </View>
                  <Text style={[styles.checkboxLabel, { color: colors.text }]}>Tạo tài khoản đăng nhập ngay</Text>
                </TouchableOpacity>

                {createAcc && (
                  <View style={{ marginTop: 12, gap: 8 }}>
                    <InputField
                      label="Tên đăng nhập" required
                      value={username} onChangeText={t => { setUsername(t); if (!t && soDienThoai) setUsername(soDienThoai); }}
                      placeholder="Số điện thoại hoặc tên đăng nhập" colors={colors}
                    />
                    <InputField
                      label="Mật khẩu" required
                      value={password} onChangeText={setPassword}
                      placeholder="Ít nhất 6 ký tự" secureTextEntry colors={colors}
                    />
                  </View>
                )}
              </View>
            </>
          )}

          {/* Submit button */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.submitBtnText}>{isEdit ? 'Cập nhật hồ sơ' : 'Thêm hồ sơ'}</Text>}
          </TouchableOpacity>

          <View style={{ height: 48 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    height: 60, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 10, borderBottomWidth: 1,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  scroll: { padding: 16 },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 0.8, marginTop: 16, marginBottom: 8, paddingLeft: 4,
  },
  card: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 4,
    gap: 4, shadowColor: '#000', shadowOpacity: 0.01, shadowRadius: 6, elevation: 1,
  },
  fieldContainer: { marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 4, marginTop: 6 },
  input: {
    height: 48, borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, fontSize: 14,
  },
  selectBtn: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 0,
  },
  dropdown: {
    borderWidth: 1, borderRadius: 12, marginTop: 4,
    overflow: 'hidden', zIndex: 100,
  },
  dropdownItem: {
    paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1,
  },
  row: { flexDirection: 'row', gap: 10 },
  errorMsg: { color: '#ba1a1a', fontSize: 11, marginTop: 3, marginLeft: 2 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxInner: { width: 10, height: 10, backgroundColor: '#fff', borderRadius: 2 },
  checkboxLabel: { fontSize: 13, fontWeight: '600' },
  submitBtn: {
    height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    marginTop: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
