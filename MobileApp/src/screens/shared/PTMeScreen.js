import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, RefreshControl, ScrollView, StatusBar,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Send, UserRound } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';

export default function PTMeScreen() {
  const { user } = useAuthStore();
  const { colors } = useTheme();
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} />}
      >
        <Text style={[styles.title, { color: colors.text }]}>PT & Tôi</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>
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
          <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} placeholder={isPT ? 'Hôm nay/tới buổi sau tập gì?' : 'Hôm nay bạn tập luyện như thế nào?'} placeholderTextColor={colors.textMuted} value={form.noi_dung_tap || form.cam_nhan_tap} onChangeText={v => setForm(f => isPT ? { ...f, noi_dung_tap: v } : { ...f, cam_nhan_tap: v })} multiline />
          <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} placeholder={isPT ? 'Cần ăn gì, lưu ý khẩu phần?' : 'Khẩu phần ăn hôm nay, bạn đã ăn gì?'} placeholderTextColor={colors.textMuted} value={form.khau_phan_an} onChangeText={v => setForm(f => ({ ...f, khau_phan_an: v }))} multiline />
          <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} placeholder="Số phút tập" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={form.so_phut_tap} onChangeText={v => setForm(f => ({ ...f, so_phut_tap: v }))} />
          {isPT ? <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} placeholder="Lời dặn thêm" placeholderTextColor={colors.textMuted} value={form.loi_dan} onChangeText={v => setForm(f => ({ ...f, loi_dan: v }))} multiline /> : null}
          <TouchableOpacity style={[styles.submit, { backgroundColor: colors.primary }]} onPress={submit} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <><Send color="#fff" size={18} /><Text style={styles.submitText}>{editingId ? 'Cập nhật' : (isPT ? 'Gửi lời dặn' : 'Gửi cho PT')}</Text></>}
          </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator color={colors.primary} /> : entries.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>Chưa có trao đổi nào.</Text>
        ) : entries.map(item => (
          <View key={item.id} style={[styles.entry, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.entryHead}>
              <UserRound color={colors.primary} size={18} />
              <Text style={[styles.entryTitle, { color: colors.text }]}>{item.vai_tro_gui === 'pt' ? 'PT dặn dò' : (isPT ? item.ten_hoi_vien || 'Hội viên' : 'Bạn cập nhật')}</Text>
              {item.nguoi_gui_id === user?.id ? (
                <TouchableOpacity style={styles.editBtn} onPress={() => startEdit(item)}>
                  <Text style={[styles.editText, { color: colors.primary }]}>Sửa</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {[item.cam_nhan_tap, item.noi_dung_tap, item.khau_phan_an, item.loi_dan, item.ghi_chu].filter(Boolean).map((txt, i) => (
              <Text key={i} style={[styles.entryText, { color: colors.textMuted }]}>{txt}</Text>
            ))}
            {item.so_phut_tap != null ? <Text style={[styles.minutes, { color: colors.primary }]}>{item.so_phut_tap} phút</Text> : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '900' },
  sub: { fontSize: 13, marginTop: 4, marginBottom: 14 },
  chips: { marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: '#eef3ee', marginRight: 8 },
  chipText: { fontWeight: '800', fontSize: 13 },
  card: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10, marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 46, fontSize: 14 },
  submit: { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  submitText: { color: '#fff', fontWeight: '900' },
  empty: { textAlign: 'center', marginTop: 18, fontWeight: '700' },
  entry: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 },
  entryHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  entryTitle: { fontWeight: '900', fontSize: 15 },
  editBtn: { marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 4 },
  editText: { fontSize: 12, fontWeight: '900' },
  entryText: { fontSize: 13, lineHeight: 20, marginTop: 4 },
  minutes: { fontWeight: '900', marginTop: 8 },
});
