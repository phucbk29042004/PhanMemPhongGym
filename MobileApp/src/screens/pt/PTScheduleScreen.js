import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../services/api';
import { formatDate, scheduleStatusLabel, unwrapData } from '../../utils/data';

export default function PTScheduleScreen() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [errorText, setErrorText] = useState('');

  const fetchSchedules = async () => {
    try {
      setErrorText('');
      const res = await api.get('/pt/schedules');
      setSchedules(unwrapData(res, []));
    } catch (error) {
      setErrorText(error.response?.data?.message || 'Không tải được lịch dạy từ backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const confirmSchedule = (id) => {
    Alert.alert('Xác nhận buổi tập', 'Xác nhận học viên đã hoàn thành buổi tập này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xác nhận',
        onPress: async () => {
          setActionLoadingId(id);
          try {
            await api.put(`/pt/schedules/${id}/confirm`);
            await fetchSchedules();
          } catch (error) {
            Alert.alert('Lỗi', error.response?.data?.message || 'Không thể xác nhận buổi tập.');
          } finally {
            setActionLoadingId(null);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSchedules(); }} colors={['#1D9336']} />}
    >
      <Text style={styles.title}>Lịch dạy</Text>
      <Text style={styles.subtitle}>Dữ liệu lấy từ API /pt/schedules và được backend lọc theo PT đang đăng nhập.</Text>

      {loading ? <ActivityIndicator color="#1D9336" size="large" /> : null}
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}

      {!loading && schedules.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyText}>Chưa có lịch dạy nào trong hệ thống.</Text></View>
      ) : schedules.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.time}>{formatDate(item.ngay_tap)} • {item.gio_bat_dau} - {item.gio_ket_thuc}</Text>
          <Text style={styles.name}>{item.ten_hoi_vien || 'Chưa có học viên'}</Text>
          <Text style={styles.meta}>Còn lại: {item.buoi_con_lai ?? 'Chưa rõ'} buổi • {item.loai_buoi === 'ca_nhan' ? 'Cá nhân' : 'Nhóm'}</Text>
          <Text style={styles.status}>{scheduleStatusLabel(item.trang_thai)}</Text>
          {item.ghi_chu ? <Text style={styles.note}>{item.ghi_chu}</Text> : null}
          {item.trang_thai === 'cho_tap' ? (
            <TouchableOpacity style={styles.button} onPress={() => confirmSchedule(item.id)} disabled={actionLoadingId === item.id}>
              {actionLoadingId === item.id ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Xác nhận hoàn thành</Text>}
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, backgroundColor: '#f7f9ff', padding: 20, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '800', color: '#181c20', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#5c6758', marginBottom: 18 },
  error: { color: '#dc2626', fontWeight: '600', marginBottom: 12 },
  empty: { backgroundColor: '#fff', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#ebeef3' },
  emptyText: { color: '#7a8775', textAlign: 'center' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#ebeef3', borderLeftWidth: 5, borderLeftColor: '#1D9336', marginBottom: 12 },
  time: { color: '#1D9336', fontSize: 13, fontWeight: '800', marginBottom: 6 },
  name: { color: '#181c20', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  meta: { color: '#3f4a3c', fontWeight: '500', marginBottom: 8 },
  status: { color: '#1D9336', fontWeight: '800' },
  note: { color: '#7a8775', marginTop: 8, fontStyle: 'italic' },
  button: { backgroundColor: '#1D9336', paddingVertical: 11, borderRadius: 12, alignItems: 'center', marginTop: 14 },
  buttonText: { color: '#fff', fontWeight: '800' },
});
