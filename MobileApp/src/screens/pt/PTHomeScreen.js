import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';

export default function PTHomeScreen() {
  const { user, logout } = useAuthStore();

  const schedule = [
    { time: '08:00 – 09:00', member: 'Lê Văn C', type: 'Gym tổng hợp', done: true },
    { time: '10:00 – 11:00', member: 'Phạm Thị D', type: 'Cardio + Core', done: true },
    { time: '17:00 – 18:00', member: 'Trần Thị B', type: 'Nâng tạ', done: false },
    { time: '19:00 – 20:00', member: 'Nguyễn Văn E', type: 'Giảm cân', done: false },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Chào buổi sáng ☀️</Text>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.role}>Personal Trainer</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.statBlue]}>
          <Text style={styles.statNum}>4</Text>
          <Text style={styles.statLabel}>Ca hôm nay</Text>
        </View>
        <View style={[styles.statCard, styles.statGreen]}>
          <Text style={styles.statNum}>12</Text>
          <Text style={styles.statLabel}>Học viên</Text>
        </View>
        <View style={[styles.statCard, styles.statOrange]}>
          <Text style={styles.statNum}>2</Text>
          <Text style={styles.statLabel}>Chờ xác nhận</Text>
        </View>
      </View>

      {/* Today Schedule */}
      <Text style={styles.sectionTitle}>📅 Lịch dạy hôm nay</Text>
      {schedule.map((item, i) => (
        <View key={i} style={[styles.scheduleCard, item.done && styles.scheduleCardDone]}>
          <View style={styles.scheduleLeft}>
            <Text style={[styles.scheduleTime, item.done && styles.textDone]}>{item.time}</Text>
            <Text style={styles.scheduleMember}>👤 {item.member}</Text>
            <Text style={styles.scheduleType}>{item.type}</Text>
          </View>
          <View style={[styles.statusBadge, item.done ? styles.badgeDone : styles.badgePending]}>
            <Text style={styles.badgeText}>{item.done ? 'Xong' : 'Sắp tới'}</Text>
          </View>
        </View>
      ))}

      {/* Pending Requests */}
      <Text style={styles.sectionTitle}>🔔 Yêu cầu đặt lịch mới</Text>
      <View style={styles.requestCard}>
        <Text style={styles.requestName}>Hoàng Thị F</Text>
        <Text style={styles.requestTime}>Thứ 5, 19:00 – 20:00</Text>
        <View style={styles.requestActions}>
          <TouchableOpacity style={styles.btnAccept}>
            <Text style={styles.btnAcceptText}>✓ Xác nhận</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnReject}>
            <Text style={styles.btnRejectText}>✗ Từ chối</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 20, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greeting: { fontSize: 13, color: '#6B7280' },
  name: { fontSize: 22, fontWeight: '700', color: '#111827' },
  role: { fontSize: 13, color: '#2563EB', fontWeight: '600', marginTop: 2 },
  logoutBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  logoutText: { color: '#DC2626', fontWeight: '600', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  statBlue: { backgroundColor: '#2563EB' },
  statGreen: { backgroundColor: '#10B981' },
  statOrange: { backgroundColor: '#F59E0B' },
  statNum: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  scheduleCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderLeftWidth: 4, borderLeftColor: '#2563EB',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  scheduleCardDone: { borderLeftColor: '#D1D5DB', opacity: 0.75 },
  scheduleLeft: { flex: 1 },
  scheduleTime: { fontSize: 14, fontWeight: '700', color: '#111827' },
  scheduleMember: { fontSize: 13, color: '#374151', marginTop: 2 },
  scheduleType: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  textDone: { color: '#9CA3AF' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeDone: { backgroundColor: '#D1FAE5' },
  badgePending: { backgroundColor: '#DBEAFE' },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  requestCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  requestName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  requestTime: { fontSize: 13, color: '#6B7280', marginTop: 2, marginBottom: 12 },
  requestActions: { flexDirection: 'row', gap: 10 },
  btnAccept: { flex: 1, backgroundColor: '#DCFCE7', borderRadius: 10, padding: 10, alignItems: 'center' },
  btnAcceptText: { color: '#16A34A', fontWeight: '700', fontSize: 13 },
  btnReject: { flex: 1, backgroundColor: '#FEE2E2', borderRadius: 10, padding: 10, alignItems: 'center' },
  btnRejectText: { color: '#DC2626', fontWeight: '700', fontSize: 13 },
});
