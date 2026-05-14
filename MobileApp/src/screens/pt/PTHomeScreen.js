import React, { useEffect, useState } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, 
  StyleSheet, StatusBar, Alert, ActivityIndicator, RefreshControl 
} from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';
import ProfileAvatar from '../../components/ProfileAvatar';

export default function PTHomeScreen() {
  const { user, logout } = useAuthStore();
  const [profileData, setProfileData] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchPTData = async () => {
    try {
      // Tải dữ liệu hồ sơ HLV và toàn bộ lịch dạy từ CSDL SQLite
      const [profileRes, schedRes] = await Promise.all([
        api.get('/members/me/profile'),
        api.get('/pt/schedules') // Controller tự động filter theo PT đang đăng nhập
      ]);

      if (profileRes.data?.success) {
        setProfileData(profileRes.data.data);
      }
      if (schedRes.data?.success) {
        setSchedules(schedRes.data.data || []);
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu PT từ CSDL SQLite:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPTData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPTData();
  };

  // Hàm gọi API thực tế để xác nhận học viên đã hoàn thành buổi tập (Ghi nhận vào DB SQLite)
  const handleConfirmSchedule = async (id) => {
    Alert.alert(
      'Xác nhận buổi tập',
      'Bạn có chắc chắn xác nhận học viên đã hoàn thành buổi tập này? Hệ thống sẽ tự động trừ 1 buổi trong gói PT của học viên.',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xác nhận', 
          onPress: async () => {
            setActionLoadingId(id);
            try {
              const res = await api.put(`/pt/schedules/${id}/confirm`);
              if (res.data?.success || res.status === 200) {
                Alert.alert('Thành công', 'Đã xác nhận hoàn thành buổi tập vào cơ sở dữ liệu!');
                await fetchPTData();
              } else {
                Alert.alert('Lỗi', res.data?.message || 'Không thể xác nhận buổi tập.');
              }
            } catch (err) {
              Alert.alert('Lỗi', err.response?.data?.message || 'Có lỗi xảy ra khi xác nhận vào DB.');
            } finally {
              setActionLoadingId(null);
            }
          }
        }
      ]
    );
  };

  // Thống kê nhanh từ danh sách lịch dạy thực tế tải về
  const completedCount = schedules.filter(s => s.trang_thai === 'da_tap').length;
  const pendingCount = schedules.filter(s => s.trang_thai === 'cho_tap').length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f9ff" />
      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1D9336']} />
        }
      >
        {/* Header Thông tin PT trích xuất từ CSDL */}
        <View style={styles.header}>
          <View style={styles.profileArea}>
            <ProfileAvatar uri={profileData?.avatar_url || user?.avatar_url} name={profileData?.ho_ten || user?.name} size={52} />
            <View>
              <Text style={styles.greeting}>HLV Quản lý DB ☀️</Text>
              <Text style={styles.name}>{profileData?.ho_ten || user?.name}</Text>
              <View style={styles.roleTag}>
                <Text style={styles.roleText}>
                  Chuyên môn: {profileData?.chuyen_mon || 'Chưa cập nhật'}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>

        {/* Trạng thái Loading ban đầu */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#1D9336" />
            <Text style={styles.loadingText}>Đang tải danh sách học viên từ DB SQLite...</Text>
          </View>
        ) : (
          <>
            {/* Các thẻ Thống Kê Tổng Quan (Stats) - Đồng bộ dữ liệu thực DB */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, styles.statMainGreen]}>
                <Text style={styles.statNum}>{schedules.length}</Text>
                <Text style={styles.statLabel}>Tổng ca phân công</Text>
              </View>
              <View style={[styles.statCard, styles.statSecondaryGreen]}>
                <Text style={styles.statNum}>{completedCount}</Text>
                <Text style={styles.statLabel}>Đã xác nhận</Text>
              </View>
              <View style={[styles.statCard, styles.statOutlineVariant]}>
                <Text style={styles.statNumDark}>{pendingCount}</Text>
                <Text style={styles.statLabelDark}>Chờ hướng dẫn</Text>
              </View>
            </View>

            {/* Danh sách phân công lịch dạy (Schedules from SQLite) */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>📅 Lịch dạy phân công (CSDL DB)</Text>
              <Text style={styles.dateSubtitle}>Kéo xuống để làm mới</Text>
            </View>

            {schedules.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Hiện tại bạn chưa được phân công lịch dạy nào trong CSDL.</Text>
              </View>
            ) : (
              schedules.map((item) => {
                const isDone = item.trang_thai === 'da_tap';
                const isCanceled = item.trang_thai === 'da_huy';

                return (
                  <View 
                    key={item.id} 
                    style={[
                      styles.scheduleCard, 
                      isDone && styles.scheduleCardDone,
                      isCanceled && { borderLeftColor: '#dc2626' }
                    ]}
                  >
                    <View style={styles.scheduleLeft}>
                      <View style={styles.timeRow}>
                        <Text style={[styles.scheduleTime, isDone && styles.textDone]}>
                          📅 {item.ngay_tap} • {item.gio_bat_dau} - {item.gio_ket_thuc}
                        </Text>
                      </View>
                      <Text style={styles.scheduleMember}>Học viên: {item.ten_hoi_vien}</Text>
                      <Text style={styles.scheduleType}>
                        Loại: {item.loai_buoi === 'ca_nhan' ? 'Cá nhân (1 kèm 1)' : 'Nhóm'} • Còn lại: {item.buoi_con_lai} buổi
                      </Text>
                      {item.ghi_chu ? <Text style={styles.noteText}>Ghi chú: {item.ghi_chu}</Text> : null}
                    </View>
                    
                    <View style={styles.actionRight}>
                      <View style={[styles.statusBadge, isDone ? styles.badgeDone : isCanceled ? styles.badgeCanceled : styles.badgePending]}>
                        <Text style={[styles.badgeText, isDone ? styles.badgeTextDone : isCanceled ? styles.badgeTextCanceled : styles.badgeTextPending]}>
                          {isDone ? 'Đã xong' : isCanceled ? 'Đã hủy' : 'Chờ tập'}
                        </Text>
                      </View>

                      {/* Nút thao tác xác nhận thực tế khi trạng thái đang là cho_tap */}
                      {item.trang_thai === 'cho_tap' && (
                        <TouchableOpacity
                          style={styles.confirmBtn}
                          onPress={() => handleConfirmSchedule(item.id)}
                          disabled={actionLoadingId === item.id}
                        >
                          {actionLoadingId === item.id ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <Text style={styles.confirmBtnText}>✓ Hoàn thành</Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f7f9ff' 
  },
  content: { 
    padding: 20, 
    paddingTop: 10,
    paddingBottom: 32 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24,
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ebeef3',
    shadowColor: '#181c20', 
    shadowOpacity: 0.04, 
    shadowRadius: 10, 
    elevation: 3,
  },
  profileArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  greeting: { 
    fontSize: 12, 
    color: '#3f4a3c', 
    fontWeight: '500' 
  },
  name: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: '#181c20',
    marginTop: 2 
  },
  roleTag: {
    backgroundColor: '#e7f5e9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4
  },
  roleText: {
    color: '#1D9336',
    fontSize: 11,
    fontWeight: '700'
  },
  logoutBtn: { 
    backgroundColor: '#fef2f2', 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fee2e2'
  },
  logoutText: { 
    color: '#dc2626', 
    fontWeight: '700', 
    fontSize: 12 
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#3f4a3c',
    fontWeight: '500'
  },
  statsRow: { 
    flexDirection: 'row', 
    gap: 10, 
    marginBottom: 24 
  },
  statCard: { 
    flex: 1, 
    borderRadius: 18, 
    padding: 16, 
    alignItems: 'center',
    shadowColor: '#181c20', 
    shadowOpacity: 0.08, 
    shadowRadius: 14, 
    elevation: 4,
  },
  statMainGreen: { 
    backgroundColor: '#1D9336' 
  },
  statSecondaryGreen: { 
    backgroundColor: '#4cce5f' 
  },
  statOutlineVariant: { 
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ebeef3'
  },
  statNum: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#ffffff' 
  },
  statLabel: { 
    fontSize: 11, 
    color: '#e7f5e9', 
    marginTop: 4, 
    fontWeight: '500',
    textAlign: 'center' 
  },
  statNumDark: {
    fontSize: 22, 
    fontWeight: '800', 
    color: '#181c20' 
  },
  statLabelDark: {
    fontSize: 11, 
    color: '#3f4a3c', 
    marginTop: 4, 
    fontWeight: '600',
    textAlign: 'center' 
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: '#181c20', 
    marginBottom: 12 
  },
  dateSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7a8775',
    marginBottom: 12 
  },
  emptyBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#ebeef3',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 13,
    color: '#7a8775',
    textAlign: 'center'
  },
  scheduleCard: {
    backgroundColor: '#ffffff', 
    borderRadius: 18, 
    padding: 16, 
    marginBottom: 12,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderLeftWidth: 5, 
    borderLeftColor: '#1D9336',
    borderWidth: 1,
    borderColor: '#ebeef3',
    shadowColor: '#181c20', 
    shadowOpacity: 0.04, 
    shadowRadius: 10, 
    elevation: 3,
  },
  scheduleCardDone: { 
    borderLeftColor: '#becab9', 
    backgroundColor: '#fafbfc' 
  },
  scheduleLeft: { 
    flex: 1,
    paddingRight: 10 
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  scheduleTime: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#181c20' 
  },
  scheduleMember: { 
    fontSize: 15, 
    fontWeight: '700',
    color: '#1D9336', 
    marginBottom: 2 
  },
  scheduleType: { 
    fontSize: 12, 
    color: '#3f4a3c',
    fontWeight: '500',
    marginTop: 2 
  },
  noteText: {
    fontSize: 11,
    color: '#7a8775',
    fontStyle: 'italic',
    marginTop: 4
  },
  textDone: { 
    color: '#7a8775',
  },
  actionRight: {
    alignItems: 'flex-end',
    gap: 8
  },
  statusBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 12 
  },
  badgeDone: { 
    backgroundColor: '#f1f4f9' 
  },
  badgePending: { 
    backgroundColor: '#e7f5e9' 
  },
  badgeCanceled: {
    backgroundColor: '#fef2f2'
  },
  badgeText: { 
    fontSize: 11, 
    fontWeight: '700' 
  },
  badgeTextDone: {
    color: '#7a8775'
  },
  badgeTextPending: {
    color: '#1D9336'
  },
  badgeTextCanceled: {
    color: '#dc2626'
  },
  confirmBtn: {
    backgroundColor: '#1D9336',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  }
});
