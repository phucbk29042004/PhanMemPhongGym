import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';

export default function MemberHomeScreen() {
  const { user, logout } = useAuthStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào 👋</Text>
          <Text style={styles.name}>{user?.name}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {/* Membership Card */}
      <View style={styles.memberCard}>
        <View style={styles.cardInner}>
          <Text style={styles.cardLabel}>Gói tập hiện tại</Text>
          <Text style={styles.cardPlan}>🏋️ Gói PT 3 Tháng</Text>
          <View style={styles.cardRow}>
            <View>
              <Text style={styles.cardMeta}>Thời hạn</Text>
              <Text style={styles.cardValue}>30/12/2026</Text>
            </View>
            <View>
              <Text style={styles.cardMeta}>Buổi còn lại</Text>
              <Text style={styles.cardValue}>12 buổi</Text>
            </View>
            <View>
              <Text style={styles.cardMeta}>Trạng thái</Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeText}>Còn hạn</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
          <Text style={styles.statValue}>24</Text>
          <Text style={styles.statLabel}>Buổi đã tập</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
          <Text style={styles.statValue}>68 kg</Text>
          <Text style={styles.statLabel}>Cân nặng</Text>
        </View>
      </View>

      {/* Upcoming Schedule */}
      <Text style={styles.sectionTitle}>📅 Lịch tập sắp tới</Text>
      {[
        { time: 'Hôm nay  17:00 – 18:00', pt: 'PT: Nguyễn Văn A', color: '#2563EB' },
        { time: 'Thứ 4, 18:00 – 19:00', pt: 'PT: Nguyễn Văn A', color: '#8B5CF6' },
      ].map((item, i) => (
        <View key={i} style={[styles.scheduleCard, { borderLeftColor: item.color }]}>
          <Text style={styles.scheduleTime}>{item.time}</Text>
          <Text style={styles.scheduleInfo}>{item.pt}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 20, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 14, color: '#6B7280' },
  name: { fontSize: 22, fontWeight: '700', color: '#111827' },
  logoutBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  logoutText: { color: '#DC2626', fontWeight: '600', fontSize: 13 },
  memberCard: {
    borderRadius: 20, overflow: 'hidden', marginBottom: 20,
    shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  cardInner: {
    backgroundColor: '#2563EB', padding: 22,
  },
  cardLabel: { color: '#BFDBFE', fontSize: 13, marginBottom: 4 },
  cardPlan: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardMeta: { color: '#93C5FD', fontSize: 11, marginBottom: 4 },
  cardValue: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  activeBadge: { backgroundColor: '#22C55E', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  activeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  scheduleCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 10,
    borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  scheduleTime: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4 },
  scheduleInfo: { fontSize: 13, color: '#6B7280' },
});
