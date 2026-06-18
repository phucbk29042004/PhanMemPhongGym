import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { X, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';
import DatePickerField from './DatePickerField';

const BRAND = {
  primary: '#1D9336',
  primaryDark: '#155f27',
  primaryLight: '#e6f4ea',
  primaryMid: '#4db870',
};

export default function EditProfileModal({ visible, onClose, profile, onSaved, colors }) {
  const [hoTen, setHoTen] = useState('');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUri, setAvatarUri] = useState(null);
  const [saving, setSaving] = useState(false);
  const [gioiTinh, setGioiTinh] = useState('nam');
  const [ngaySinh, setNgaySinh] = useState('');
  const [cccd, setCccd] = useState('');
  const [queQuan, setQueQuan] = useState('');
  const [noiSinh, setNoiSinh] = useState('');
  const [tinhThanh, setTinhThanh] = useState('');
  const [quanHuyen, setQuanHuyen] = useState('');
  const [phuongXa, setPhuongXa] = useState('');
  const [diaChiTamTru, setDiaChiTamTru] = useState('');

  useEffect(() => {
    if (visible && profile) {
      setHoTen(profile.ho_ten || '');
      setSoDienThoai(profile.so_dien_thoai || '');
      setEmail(profile.email || '');
      setAvatarUri(profile.avatar_url || null);
      setGioiTinh(profile.gioi_tinh || 'nam');
      setNgaySinh(profile.ngay_sinh ? profile.ngay_sinh.split('T')[0] : '');
      setCccd(profile.cccd || '');
      setQueQuan(profile.que_quan || '');
      setNoiSinh(profile.noi_sinh || '');
      setTinhThanh(profile.tinh_thanh || '');
      setQuanHuyen(profile.quan_huyen || '');
      setPhuongXa(profile.phuong_xa || '');
      setDiaChiTamTru(profile.dia_chi_tam_tru || '');
    }
  }, [visible, profile]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh để đổi ảnh đại diện.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!hoTen.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập họ tên.');
    if (soDienThoai.trim() && !/^(03|05|07|08|09)\d{8}$/.test(soDienThoai.trim())) {
      return Alert.alert('Lỗi', 'Số điện thoại không hợp lệ (phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09).');
    }
    if (cccd.trim() && !/^\d{12}$/.test(cccd.trim())) {
      return Alert.alert('Lỗi', 'Số CCCD không hợp lệ (phải gồm đúng 12 chữ số).');
    }
    setSaving(true);
    try {
      // 1. Cập nhật thông tin (tên, sđt, email)
      await api.put('/auth/me', {
        ho_ten: hoTen,
        so_dien_thoai: soDienThoai,
        email: email,
        gioi_tinh: gioiTinh,
        ngay_sinh: ngaySinh || null,
        cccd: cccd || null,
        que_quan: queQuan || null,
        noi_sinh: noiSinh || null,
        tinh_thanh: tinhThanh || null,
        quan_huyen: quanHuyen || null,
        phuong_xa: phuongXa || null,
        dia_chi_tam_tru: diaChiTamTru || null
      });

      // 2. Cập nhật ảnh đại diện nếu có thay đổi và là ảnh local (không bắt đầu bằng http)
      if (avatarUri && avatarUri !== profile?.avatar_url && !avatarUri.startsWith('http')) {
        const formData = new FormData();
        formData.append('avatar', {
          uri: avatarUri,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        });
        await api.put('/auth/me/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      Alert.alert('Thành công', 'Đã cập nhật thông tin cá nhân.', [
        { 
          text: 'OK', 
          onPress: () => { 
            onClose(); 
            if (onSaved) onSaved(); 
          } 
        }
      ]);
    } catch (err) {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể lưu thông tin. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const C = colors || {};
  const inputBg = C.surfaceVariant || '#f0f4f0';
  const inputBorder = C.border || '#e4ebe4';
  const textColor = C.text || '#141c14';
  const labelColor = C.textSecondary || '#6b7c6b';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.sheet, { backgroundColor: C.surface || '#ffffff' }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: textColor }]}>Chỉnh sửa thông tin</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X color={C.textMuted || '#9cad9c'} size={22} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <TouchableOpacity style={styles.avatarWrap} onPress={handlePickImage} activeOpacity={0.8}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: C.primaryLight || BRAND.primaryLight }]}>
                    <Text style={[styles.avatarInitials, { color: C.primary || BRAND.primary }]}>
                      {hoTen ? hoTen.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </View>
                )}
                <View style={[styles.cameraBadge, { backgroundColor: BRAND.primary, borderColor: C.surface || '#ffffff' }]}>
                  <Camera color="#ffffff" size={14} strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
              <Text style={[styles.avatarHint, { color: C.textMuted || '#9cad9c' }]}>Chạm để thay đổi ảnh</Text>
            </View>

            {/* Fields */}
            {[
              { label: 'Họ và tên *', val: hoTen, set: setHoTen, placeholder: 'Nhập họ tên...' },
              { label: 'Số điện thoại', val: soDienThoai, set: setSoDienThoai, placeholder: 'Nhập số điện thoại...', kbType: 'phone-pad' },
              { label: 'Email', val: email, set: setEmail, placeholder: 'Nhập địa chỉ email...', kbType: 'email-address' },
            ].map(({ label, val, set, placeholder, kbType }) => (
              <View key={label} style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: labelColor }]}>{label}</Text>
                <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    value={val}
                    onChangeText={set}
                    placeholder={placeholder}
                    placeholderTextColor={C.textMuted || '#9cad9c'}
                    keyboardType={kbType || 'default'}
                  />
                </View>
              </View>
            ))}

            {/* Giới tính */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: labelColor }]}>Giới tính</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {['nam', 'nu'].map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderBtn,
                      { backgroundColor: inputBg, borderColor: inputBorder },
                      gioiTinh === g && { backgroundColor: BRAND.primary, borderColor: BRAND.primary }
                    ]}
                    onPress={() => setGioiTinh(g)}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: gioiTinh === g ? '#fff' : textColor }}>
                      {g === 'nam' ? 'Nam' : 'Nữ'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <DatePickerField
              label="Ngày sinh"
              value={ngaySinh}
              onChangeText={setNgaySinh}
              placeholder="Chọn ngày sinh"
              colors={C}
              returnFormat="YYYY-MM-DD"
            />

            {/* Số CCCD/CMND */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: labelColor }]}>Số CCCD / CMND</Text>
              <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  value={cccd}
                  onChangeText={setCccd}
                  placeholder="Nhập số CCCD..."
                  placeholderTextColor={C.textMuted || '#9cad9c'}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Nơi sinh & Quê quán */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: labelColor }]}>Nơi sinh</Text>
                <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    value={noiSinh}
                    onChangeText={setNoiSinh}
                    placeholder="Tỉnh/Thành..."
                    placeholderTextColor={C.textMuted || '#9cad9c'}
                  />
                </View>
              </View>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: labelColor }]}>Quê quán</Text>
                <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    value={queQuan}
                    onChangeText={setQueQuan}
                    placeholder="Quê quán..."
                    placeholderTextColor={C.textMuted || '#9cad9c'}
                  />
                </View>
              </View>
            </View>

            {/* Tỉnh thành, Quận huyện, Phường xã */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: labelColor }]}>Tỉnh / Thành phố</Text>
              <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  value={tinhThanh}
                  onChangeText={setTinhThanh}
                  placeholder="Tỉnh/Thành phố..."
                  placeholderTextColor={C.textMuted || '#9cad9c'}
                />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: labelColor }]}>Quận / Huyện</Text>
                <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    value={quanHuyen}
                    onChangeText={setQuanHuyen}
                    placeholder="Quận/Huyện..."
                    placeholderTextColor={C.textMuted || '#9cad9c'}
                  />
                </View>
              </View>
              <View style={[styles.fieldWrap, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: labelColor }]}>Phường / Xã</Text>
                <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    value={phuongXa}
                    onChangeText={setPhuongXa}
                    placeholder="Phường/Xã..."
                    placeholderTextColor={C.textMuted || '#9cad9c'}
                  />
                </View>
              </View>
            </View>

            {/* Địa chỉ tạm trú */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: labelColor }]}>Địa chỉ tạm trú</Text>
              <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  value={diaChiTamTru}
                  onChangeText={setDiaChiTamTru}
                  placeholder="Số nhà, tên đường..."
                  placeholderTextColor={C.textMuted || '#9cad9c'}
                />
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.btnCancel, { borderColor: inputBorder }]} onPress={onClose}>
                <Text style={[styles.btnCancelText, { color: labelColor }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSave, { opacity: saving ? 0.7 : 1 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.btnSaveText}>Lưu thay đổi</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarWrap: { position: 'relative' },
  avatarImg: { width: 84, height: 84, borderRadius: 42 },
  avatarPlaceholder: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 32, fontWeight: 'bold' },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  avatarHint: { fontSize: 12, marginTop: 8 },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 0,
    height: 50,
  },
  input: { flex: 1, fontSize: 15, height: 50 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  btnCancel: {
    flex: 1, height: 48, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  btnCancelText: { fontSize: 15, fontWeight: '700' },
  btnSave: {
    flex: 1, height: 48, borderRadius: 14,
    backgroundColor: BRAND.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  btnSaveText: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
  genderBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
