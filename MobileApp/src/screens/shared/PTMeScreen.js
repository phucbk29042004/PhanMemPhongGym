import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, RefreshControl, ScrollView, StatusBar,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Send, UserRound, ArrowLeft } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';

export default function PTMeScreen({ navigation }) {
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isPT = user?.vai_tro === 'pt';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState(null);
  const [thread, setThread] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [form, setForm] = useState({ cam_nhan_tap: '', khau_phan_an: '', so_phut_tap: '', noi_dung_tap: '', loi_dan: '' });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (memberId = selectedMemberId) => {
    try {
      const calls = [api.get('/pt-me/overview')];
      if (isPT) calls.push(api.get('/pt/schedules/my-members'));
      const [overviewRes, studentsRes] = await Promise.all(calls);
      if (overviewRes.data?.success) setOverview(overviewRes.data.data);
      if (studentsRes?.data?.success) {
        setStudents(studentsRes.data.data || []);
        if (!memberId && studentsRes.data.data?.[0]?.hoi_vien_id) memberId = studentsRes.data.data[0].hoi_vien_id;
      }
      const endpoint = isPT ? `/pt-me/thread?hoi_vien_id=${memberId}` : '/pt-me/thread';
      if (!isPT || memberId) {
        const threadRes = await api.get(endpoint);
        if (threadRes.data?.success) setThread(threadRes.data.data);
        if (memberId) setSelectedMemberId(memberId);
      }
    } catch (err) {
      console.error('[PTMeScreen] load error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isPT, selectedMemberId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const submit = async () => {
    if (isPT && !selectedMemberId) return Alert.alert('Thiếu học viên', 'Vui lòng chọn học viên.');
    setSaving(true);
    try {
      const payload = {
        ...form,
        so_phut_tap: form.so_phut_tap ? Number(form.so_phut_tap) : null,
        ...(isPT ? { hoi_vien_id: selectedMemberId } : {}),
      };
      const res = editingId ? await api.put(`/pt-me/thread/${editingId}`, payload) : await api.post('/pt-me/thread', payload);
      if (res.data?.success) {
        setForm({ cam_nhan_tap: '', khau_phan_an: '', so_phut_tap: '', noi_dung_tap: '', loi_dan: '' });
        setEditingId(null);
        await load(selectedMemberId);
        Alert.alert('Thành công', editingId ? 'Đã cập nhật và thông báo cho bên liên quan.' : (isPT ? 'Đã gửi lời dặn cho hội viên.' : 'Đã gửi cập nhật cho PT.'));
      }
    } catch (err) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể gửi cập nhật.');
    } finally {
      setSaving(false);
    }
  };

  const entries = thread?.entries || overview?.latest || [];
  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      cam_nhan_tap: item.cam_nhan_tap || '',
      khau_phan_an: item.khau_phan_an || '',
      so_phut_tap: item.so_phut_tap != null ? String(item.so_phut_tap) : '',
      noi_dung_tap: item.noi_dung_tap || '',
      loi_dan: item.loi_dan || '',
    });
  };

  // Lock screen for members without an assigned PT
  if (!isPT && !loading && thread && !thread.pair) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />
        
        {/* Header Bar */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: insets.top }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft color={colors.text} size={22} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>PT & Tôi</Text>
          <View style={styles.placeholderButton} />
        </View>

        <View style={styles.lockContainer}>
          <View style={[styles.lockIconBox, { backgroundColor: colors.warningLight }]}>
            <UserRound color={colors.warning} size={48} strokeWidth={1.5} />
          </View>
          <Text style={[styles.lockTitle, { color: colors.text }]}>Tính Năng Giới Hạn</Text>
          <Text style={[styles.lockText, { color: colors.textSecondary }]}>
            Chức năng này chỉ dành cho Hội viên có đăng ký tập luyện cùng Huấn luyện viên cá nhân (PT). Vui lòng đăng ký gói PT để sử dụng!
          </Text>
          <TouchableOpacity
            style={[styles.lockButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.lockButtonText}>Quay lại Trang chủ</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      {/* Header Bar */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>PT & Tôi</Text>
        <View style={styles.placeholderButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} />}
      >
        <Text style={[styles.sub, { color: colors.textMuted, marginTop: 4 }]}>
          {isPT ? 'Xem cập nhật của hội viên và gửi lời dặn.' : (thread?.pair?.ten_pt ? `Trao đổi với HLV ${thread.pair.ten_pt}` : 'Luồng trao đổi với PT của bạn.')}
        </Text>

        {isPT && students.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
            {students.map(s => (
              <TouchableOpacity key={s.hoi_vien_id} style={[styles.chip, selectedMemberId === s.hoi_vien_id && { backgroundColor: colors.primary }]} onPress={() => load(s.hoi_vien_id)}>
                <Text style={[styles.chipText, { color: selectedMemberId === s.hoi_vien_id ? '#fff' : colors.text }]}>{s.ho_ten || s.ten_hoi_vien}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} placeholder={isPT ? 'Hôm nay/tới buổi sau tập gì?' : 'Hôm nay bạn tập luyện như thế nào?'} placeholderTextColor={colors.textMuted} value={isPT ? form.noi_dung_tap : form.cam_nhan_tap} onChangeText={v => setForm(f => isPT ? { ...f, noi_dung_tap: v } : { ...f, cam_nhan_tap: v })} multiline />
          <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} placeholder={isPT ? 'Cần ăn gì, lưu ý khẩu phần?' : 'Khẩu phần ăn hôm nay, bạn đã ăn gì?'} placeholderTextColor={colors.textMuted} value={form.khau_phan_an} onChangeText={v => setForm(f => ({ ...f, khau_phan_an: v }))} multiline />
          <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} placeholder="Số phút tập" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={form.so_phut_tap} onChangeText={v => setForm(f => ({ ...f, so_phut_tap: v }))} />
          {isPT ? <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} placeholder="Lời dặn thêm" placeholderTextColor={colors.textMuted} value={form.loi_dan} onChangeText={v => setForm(f => ({ ...f, loi_dan: v }))} multiline /> : null}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {editingId ? (
              <TouchableOpacity
                style={[styles.cancelEditBtn, { borderColor: colors.border }]}
                onPress={() => {
                  setEditingId(null);
                  setForm({ cam_nhan_tap: '', khau_phan_an: '', so_phut_tap: '', noi_dung_tap: '', loi_dan: '' });
                }}
              >
                <Text style={[styles.cancelEditText, { color: colors.textMuted }]}>Hủy</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={[styles.submit, { backgroundColor: colors.primary, flex: 1 }]} onPress={submit} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <><Send color="#fff" size={18} /><Text style={styles.submitText}>{editingId ? 'Cập nhật' : (isPT ? 'Gửi lời dặn' : 'Gửi cho PT')}</Text></>}
            </TouchableOpacity>
          </View>
        </View>

        {loading ? <ActivityIndicator color={colors.primary} /> : entries.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>Chưa có trao đổi nào.</Text>
        ) : entries.map(item => {
          // Tin nhắn của Hội viên → bên PHẢI, tin nhắn của PT → bên TRÁI
          // (bất kể ai đang đăng nhập)
          const isMemberMsg = item.vai_tro_gui !== 'pt';
          const isMe = item.nguoi_gui_id === user?.id; // để hiện nút Sửa đúng người
          return (
            <View
              key={item.id}
              style={[
                styles.entry,
                isMemberMsg ? styles.entryMe : styles.entryOther,
                {
                  backgroundColor: isMemberMsg ? (colors.isDark ? colors.primary : '#e6f4ea') : colors.surface,
                  borderColor: isMemberMsg ? colors.primary : colors.border
                }
              ]}
            >
              <View style={styles.entryHead}>
                <UserRound color={isMemberMsg ? (colors.isDark ? '#fff' : colors.primary) : colors.primary} size={14} />
                <Text style={[styles.entryTitle, { color: isMemberMsg ? (colors.isDark ? '#fff' : colors.primary) : colors.text }]}>
                  {item.vai_tro_gui === 'pt' ? 'PT dặn dò' : (isPT ? item.ten_hoi_vien || 'Hội viên' : 'Bạn cập nhật')}
                </Text>
                {isMe ? (
                  <TouchableOpacity style={styles.editBtn} onPress={() => startEdit(item)}>
                    <Text style={[styles.editText, { color: colors.isDark ? '#fff' : colors.primary }]}>Sửa</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {item.vai_tro_gui === 'pt' ? (
                <>
                  {item.noi_dung_tap ? <Text style={[styles.bubbleField, { color: isMemberMsg ? (colors.isDark ? '#fff' : '#141c14') : colors.text }]}><Text style={styles.boldLabel}>Nội dung tập: </Text>{item.noi_dung_tap}</Text> : null}
                  {item.khau_phan_an ? <Text style={[styles.bubbleField, { color: isMemberMsg ? (colors.isDark ? '#fff' : '#141c14') : colors.text }]}><Text style={styles.boldLabel}>Dinh dưỡng: </Text>{item.khau_phan_an}</Text> : null}
                  {item.so_phut_tap ? <Text style={[styles.bubbleField, { color: isMemberMsg ? (colors.isDark ? '#fff' : '#141c14') : colors.text }]}><Text style={styles.boldLabel}>Thời gian: </Text>{item.so_phut_tap} phút</Text> : null}
                  {item.loi_dan ? <Text style={[styles.bubbleField, { color: isMemberMsg ? (colors.isDark ? '#fff' : '#141c14') : colors.text }]}><Text style={styles.boldLabel}>Lời dặn: </Text>{item.loi_dan}</Text> : null}
                </>
              ) : (
                <>
                  {item.cam_nhan_tap ? <Text style={[styles.bubbleField, { color: isMemberMsg ? (colors.isDark ? '#fff' : '#141c14') : colors.text }]}><Text style={styles.boldLabel}>Cảm nhận: </Text>{item.cam_nhan_tap}</Text> : null}
                  {item.khau_phan_an ? <Text style={[styles.bubbleField, { color: isMemberMsg ? (colors.isDark ? '#fff' : '#141c14') : colors.text }]}><Text style={styles.boldLabel}>Khẩu phần ăn: </Text>{item.khau_phan_an}</Text> : null}
                  {item.so_phut_tap ? <Text style={[styles.bubbleField, { color: isMemberMsg ? (colors.isDark ? '#fff' : '#141c14') : colors.text }]}><Text style={styles.boldLabel}>Thời gian tập: </Text>{item.so_phut_tap} phút</Text> : null}
                </>
              )}
              {item.ghi_chu ? <Text style={[styles.bubbleField, { color: isMemberMsg ? (colors.isDark ? '#fff' : '#141c14') : colors.text }]}><Text style={styles.boldLabel}>Ghi chú: </Text>{item.ghi_chu}</Text> : null}

              <Text style={[styles.bubbleTime, { color: isMemberMsg ? (colors.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(20,28,20,0.6)') : colors.textMuted }]}>
                {item.ngay_tao ? new Date(item.ngay_tao).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'}) : ''}
                {item.da_chinh_sua ? ' • Đã sửa' : ''}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  placeholderButton: {
    width: 40,
  },
  lockContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  lockIconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  lockTitle: {
    fontSize: 20,
    fontWeight: '850',
    textAlign: 'center',
  },
  lockText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  lockButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#1D9336',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  lockButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  content: { padding: 18, paddingBottom: 32 },
  chips: { marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: '#eef3ee', marginRight: 8 },
  chipText: { fontWeight: '800', fontSize: 13 },
  card: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10, marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 46, fontSize: 14 },
  submit: { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  submitText: { color: '#fff', fontWeight: '900' },
  empty: { textAlign: 'center', marginTop: 18, fontWeight: '700' },
  entry: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    maxWidth: '85%',
  },
  entryMe: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  entryOther: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
  },
  entryHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  entryTitle: { fontWeight: '800', fontSize: 12, opacity: 0.8 },
  editBtn: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(29,147,54,0.1)' },
  editText: { fontSize: 11, fontWeight: '800' },
  bubbleField: { fontSize: 13, lineHeight: 18, marginTop: 3 },
  boldLabel: { fontWeight: '800', opacity: 0.9 },
  bubbleTime: { fontSize: 9, alignSelf: 'flex-end', marginTop: 6 },
  cancelEditBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  cancelEditText: { fontWeight: '800', fontSize: 14 },
});
