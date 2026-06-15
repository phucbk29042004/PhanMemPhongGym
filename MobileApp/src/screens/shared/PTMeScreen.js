import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform,
  RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
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
  const flatListRef = useRef(null);
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

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.ngay_tao || a.ngay_cap_nhat).getTime() - new Date(b.ngay_tao || b.ngay_cap_nhat).getTime()
  );

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

  const renderMessage = ({ item }) => {
    // Tin nhắn Hội viên → bên PHẢI, tin nhắn PT → bên TRÁI
    const isMemberMsg = item.vai_tro_gui !== 'pt';
    const isMe = item.nguoi_gui_id === user?.id;

    let dateStr = '';
    if (item.ngay_tao) {
      const dt = new Date(item.ngay_tao);
      const time = dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const date = dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      dateStr = `${time} ${date}`;
    }

    return (
      <View style={[styles.messageRow, isMemberMsg ? styles.messageRowRight : styles.messageRowLeft]}>
        {!isMemberMsg && (
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <UserRound color={colors.primary} size={14} />
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isMemberMsg
              ? [styles.bubbleRight, { backgroundColor: colors.isDark ? colors.primary : '#e6f4ea', borderColor: colors.primary }]
              : [styles.bubbleLeft, { backgroundColor: colors.surface, borderColor: colors.border }],
          ]}
        >
          <View style={styles.bubbleHead}>
            <Text style={[styles.bubbleSender, { color: isMemberMsg ? (colors.isDark ? '#fff' : colors.primary) : colors.textSecondary }]}>
              {item.vai_tro_gui === 'pt' ? 'PT dặn dò' : (isPT ? item.ten_hoi_vien || 'Hội viên' : 'Bạn')}
            </Text>
            {isMe && (
              <TouchableOpacity style={[styles.editBtn, { backgroundColor: 'rgba(29,147,54,0.1)' }]} onPress={() => startEdit(item)}>
                <Text style={[styles.editText, { color: colors.isDark ? '#fff' : colors.primary }]}>Sửa</Text>
              </TouchableOpacity>
            )}
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
            {dateStr}{item.da_chinh_sua ? ' • Đã sửa' : ''}
          </Text>
        </View>
        {isMemberMsg && (
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <UserRound color="#fff" size={14} />
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={22} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>PT & Tôi</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {isPT ? 'Xem cập nhật của hội viên và gửi lời dặn.' : (thread?.pair?.ten_pt ? `HLV ${thread.pair.ten_pt}` : 'Trao đổi với PT của bạn')}
          </Text>
        </View>
        <View style={styles.placeholderButton} />
      </View>

      {/* Chip chọn học viên (chỉ PT thấy) */}
      {isPT && students.length > 0 && (
        <View style={[styles.chipsBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
            {students.map(s => (
              <TouchableOpacity
                key={s.hoi_vien_id}
                style={[styles.chip, { backgroundColor: selectedMemberId === s.hoi_vien_id ? colors.primary : colors.surfaceVariant }]}
                onPress={() => load(s.hoi_vien_id)}
              >
                <Text style={[styles.chipText, { color: selectedMemberId === s.hoi_vien_id ? '#fff' : colors.text }]}>
                  {s.ho_ten || s.ten_hoi_vien}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Danh sách tin nhắn — chiếm hết không gian còn lại */}
      <FlatList
        ref={flatListRef}
        data={sortedEntries}
        keyExtractor={item => String(item.id)}
        renderItem={renderMessage}
        contentContainerStyle={[styles.messageList, sortedEntries.length === 0 && styles.messageListEmpty]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            colors={[colors.primary]}
          />
        }
        onContentSizeChange={() => {
          if (sortedEntries.length > 0) flatListRef.current?.scrollToEnd({ animated: false });
        }}
        ListEmptyComponent={
          loading
            ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
            : <Text style={[styles.empty, { color: colors.textMuted }]}>Chưa có trao đổi nào. Hãy gửi tin đầu tiên!</Text>
        }
      />

      {/* Form nhập liệu — cố định ở dưới */}
      <View style={[styles.inputArea, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
        {editingId && (
          <View style={[styles.editingBanner, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.editingText, { color: colors.primary }]}>Đang chỉnh sửa tin nhắn</Text>
            <TouchableOpacity onPress={() => { setEditingId(null); setForm({ cam_nhan_tap: '', khau_phan_an: '', so_phut_tap: '', noi_dung_tap: '', loi_dan: '' }); }}>
              <Text style={[styles.editingCancel, { color: colors.primary }]}>Hủy</Text>
            </TouchableOpacity>
          </View>
        )}

        <TextInput
          style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
          placeholder={isPT ? 'Nội dung / lịch tập hôm nay...' : 'Cảm nhận buổi tập hôm nay...'}
          placeholderTextColor={colors.textMuted}
          value={isPT ? form.noi_dung_tap : form.cam_nhan_tap}
          onChangeText={v => setForm(f => isPT ? { ...f, noi_dung_tap: v } : { ...f, cam_nhan_tap: v })}
          multiline
          maxLength={500}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={[styles.inputSmall, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
            placeholder="Khẩu phần ăn..."
            placeholderTextColor={colors.textMuted}
            value={form.khau_phan_an}
            onChangeText={v => setForm(f => ({ ...f, khau_phan_an: v }))}
          />
          <TextInput
            style={[styles.inputTiny, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
            placeholder="Phút tập"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={form.so_phut_tap}
            onChangeText={v => setForm(f => ({ ...f, so_phut_tap: v }))}
          />
        </View>

        {isPT && (
          <TextInput
            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
            placeholder="Lời dặn thêm cho hội viên..."
            placeholderTextColor={colors.textMuted}
            value={form.loi_dan}
            onChangeText={v => setForm(f => ({ ...f, loi_dan: v }))}
            multiline
            maxLength={300}
          />
        )}

        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: colors.primary }]}
          onPress={submit}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : (
              <>
                <Send color="#fff" size={16} />
                <Text style={styles.sendBtnText}>
                  {editingId ? 'Cập nhật' : (isPT ? 'Gửi lời dặn' : 'Gửi cho PT')}
                </Text>
              </>
            )
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    fontSize: 16,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  placeholderButton: { width: 40 },

  chipsBar: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  chipText: { fontWeight: '700', fontSize: 13 },

  messageList: {
    padding: 12,
    paddingBottom: 8,
  },
  messageListEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
    paddingHorizontal: 32,
  },

  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
    gap: 6,
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '78%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
  },
  bubbleRight: {
    borderBottomRightRadius: 3,
  },
  bubbleLeft: {
    borderBottomLeftRadius: 3,
  },
  bubbleHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  bubbleSender: {
    fontWeight: '800',
    fontSize: 11,
    opacity: 0.8,
    flex: 1,
  },
  editBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  editText: { fontSize: 11, fontWeight: '800' },
  bubbleField: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  boldLabel: { fontWeight: '800', opacity: 0.9 },
  bubbleTime: { fontSize: 9, alignSelf: 'flex-end', marginTop: 5 },

  // Input area
  inputArea: {
    borderTopWidth: 1,
    paddingTop: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  editingBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editingText: { fontSize: 12, fontWeight: '700' },
  editingCancel: { fontSize: 12, fontWeight: '800' },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    minHeight: 44,
    maxHeight: 100,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputSmall: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    height: 40,
  },
  inputTiny: {
    width: 90,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    height: 40,
  },
  sendBtn: {
    height: 46,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // Lock screen
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
    elevation: 4,
  },
  lockButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});
