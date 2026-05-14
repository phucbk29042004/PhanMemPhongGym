import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../../services/api';
import ProfileAvatar from '../../components/ProfileAvatar';
import { formatDate, unwrapData } from '../../utils/data';

export default function PTStudentsScreen() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState('');

  const fetchSchedules = async () => {
    try {
      setErrorText('');
      const res = await api.get('/pt/schedules');
      setSchedules(unwrapData(res, []));
    } catch (error) {
      setErrorText(error.response?.data?.message || 'Không tải được học viên từ backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const students = useMemo(() => {
    const map = new Map();
    schedules.forEach((item) => {
      if (!item.hoi_vien_id) return;
      const current = map.get(item.hoi_vien_id) || {
        id: item.hoi_vien_id,
        name: item.ten_hoi_vien,
        avatar: item.avatar_hoi_vien,
        total: 0,
        completed: 0,
        nextDate: null,
        remaining: item.buoi_con_lai,
      };
      current.total += 1;
      if (item.trang_thai === 'da_tap') current.completed += 1;
      if (item.trang_thai === 'cho_tap' && (!current.nextDate || item.ngay_tap < current.nextDate)) {
        current.nextDate = item.ngay_tap;
      }
      current.remaining = item.buoi_con_lai;
      map.set(item.hoi_vien_id, current);
    });
    return Array.from(map.values());
  }, [schedules]);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSchedules(); }} colors={['#1D9336']} />}
    >
      <Text style={styles.title}>Học viên của tôi</Text>
      <Text style={styles.subtitle}>Danh sách được tổng hợp từ lịch dạy thực tế của API /pt/schedules.</Text>

      {loading ? <ActivityIndicator color="#1D9336" size="large" /> : null}
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}

      {!loading && students.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyText}>Chưa có học viên nào trong lịch dạy.</Text></View>
      ) : students.map((student) => (
        <View key={student.id} style={styles.card}>
          <ProfileAvatar uri={student.avatar} name={student.name} size={48} />
          <View style={styles.info}>
            <Text style={styles.name}>{student.name || 'Chưa có tên'}</Text>
            <Text style={styles.meta}>Tổng lịch: {student.total} • Đã tập: {student.completed}</Text>
            <Text style={styles.meta}>Buổi còn lại: {student.remaining ?? 'Chưa rõ'}</Text>
            <Text style={styles.next}>Buổi kế tiếp: {formatDate(student.nextDate)}</Text>
          </View>
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
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#ebeef3', marginBottom: 12, flexDirection: 'row', gap: 12 },
  info: { flex: 1 },
  name: { color: '#181c20', fontSize: 16, fontWeight: '800', marginBottom: 5 },
  meta: { color: '#3f4a3c', fontWeight: '600', marginBottom: 3 },
  next: { color: '#1D9336', fontWeight: '800', marginTop: 4 },
});
