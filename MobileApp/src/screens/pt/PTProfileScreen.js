import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../../services/api';
import ProfileAvatar from '../../components/ProfileAvatar';
import { checkinMethodLabel, formatDateTime, unwrapData } from '../../utils/data';

export default function PTProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState('');

  const fetchData = async () => {
    try {
      setErrorText('');
      const [profileRes, notifRes, checkinsRes] = await Promise.all([
        api.get('/members/me/profile'),
        api.get('/members/me/notifications'),
        api.get('/checkins/me?limit=10'),
      ]);
      setProfile(unwrapData(profileRes, null));
      setNotifications(unwrapData(notifRes, { notifications: [] })?.notifications || []);
      setCheckins(unwrapData(checkinsRes, { data: [] })?.data || []);
    } catch (error) {
      setErrorText(error.response?.data?.message || 'Không tải được hồ sơ PT từ backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={['#1D9336']} />}
    >
      <Text style={styles.title}>Hồ sơ huấn luyện viên</Text>
      {loading ? <ActivityIndicator color="#1D9336" size="large" /> : null}
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}

      {profile ? (
        <View style={styles.profileCard}>
          <ProfileAvatar uri={profile.avatar_url} name={profile.ho_ten} size={72} />
          <Text style={styles.name}>{profile.ho_ten}</Text>
          <Text style={styles.meta}>{profile.ma_ho_so || 'Chưa có mã hồ sơ'}</Text>
          <Text style={styles.meta}>Chuyên môn: {profile.chuyen_mon || 'Chưa cập nhật'}</Text>
          <Text style={styles.meta}>Số điện thoại: {profile.so_dien_thoai || 'Chưa cập nhật'}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông báo từ hệ thống</Text>
        {notifications.length === 0 ? <Text style={styles.emptyText}>Chưa có thông báo mới.</Text> : null}
        {notifications.map((item, index) => (
          <View key={`${item.tieu_de}-${index}`} style={styles.notice}>
            <Text style={styles.noticeTitle}>{item.tieu_de}</Text>
            <Text style={styles.noticeText}>{item.noi_dung}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lượt vào/ra gần đây</Text>
        {checkins.length === 0 ? <Text style={styles.emptyText}>Chưa có dữ liệu vào/ra.</Text> : null}
        {checkins.map((item) => (
          <View key={item.id} style={styles.checkinRow}>
            <Text style={styles.checkinType}>{item.loai === 'vao' ? 'Vào' : 'Ra'}</Text>
            <Text style={styles.checkinText}>{formatDateTime(item.thoi_diem)} • {checkinMethodLabel(item.phuong_thuc)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, backgroundColor: '#f7f9ff', padding: 20, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '800', color: '#181c20', marginBottom: 18 },
  error: { color: '#dc2626', fontWeight: '600', marginBottom: 12 },
  profileCard: { backgroundColor: '#fff', padding: 20, borderRadius: 18, borderWidth: 1, borderColor: '#ebeef3', alignItems: 'center', marginBottom: 14 },
  name: { fontSize: 21, color: '#181c20', fontWeight: '800', marginTop: 12 },
  meta: { color: '#5c6758', fontWeight: '600', marginTop: 4 },
  section: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#ebeef3', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#181c20', marginBottom: 10 },
  emptyText: { color: '#7a8775', fontWeight: '600' },
  notice: { borderTopWidth: 1, borderTopColor: '#ebeef3', paddingTop: 10, marginTop: 10 },
  noticeTitle: { color: '#1D9336', fontWeight: '800' },
  noticeText: { color: '#3f4a3c', marginTop: 4, lineHeight: 19 },
  checkinRow: { borderTopWidth: 1, borderTopColor: '#ebeef3', paddingTop: 10, marginTop: 10 },
  checkinType: { color: '#1D9336', fontWeight: '800' },
  checkinText: { color: '#3f4a3c', marginTop: 3 },
});
