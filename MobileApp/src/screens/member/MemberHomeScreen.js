import React, { useEffect, useState } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, 
  StyleSheet, StatusBar, ActivityIndicator, RefreshControl 
} from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';
import ProfileAvatar from '../../components/ProfileAvatar';
import { formatDate } from '../../utils/data';

export default function MemberHomeScreen() {
  const { user, logout } = useAuthStore();
  const [profileData, setProfileData] = useState(null);
  const [notificationsData, setNotificationsData] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMemberData = async () => {
    try {
      // Tải song song dữ liệu Hồ sơ thực tế, Thông báo động và Lịch tập từ DB SQLite
      const [profileRes, notiRes, schedRes] = await Promise.all([
        api.get('/members/me/profile'),
        api.get('/members/me/notifications'),
        api.get('/pt/schedules') // BE tự động filter lịch của hội viên đang đăng nhập
      ]);

      if (profileRes.data?.success) {
        setProfileData(profileRes.data.data);
      }
      if (notiRes.data?.success) {
        setNotificationsData(notiRes.data.data);
      }
      if (schedRes.data?.success) {
        setSchedules(schedRes.data.data || []);
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu hội viên từ DB:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMemberData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMemberData();
  };

  // Trích xuất thông tin Gói tập & Gói PT đang hoạt động từ DB thực tế
  const activePlan = profileData?.goi_tap?.[0] || null;
  const activePTPlan = profileData?.dang_ky_pt?.[0] || null;

  // Lấy danh sách thông báo nhắc nhở động từ hệ thống
  const alerts = notificationsData?.notifications || [];
  const checkedInToday = notificationsData?.da_check_in_hom_nay || false;

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
        {/* Header với thông tin cá nhân DB và nút Đăng xuất */}
        <View style={styles.header}>
          <View style={styles.profileArea}>
            <ProfileAvatar uri={profileData?.avatar_url || user?.avatar_url} name={profileData?.ho_ten || user?.name} size={48} />
            <View>
              <Text style={styles.greeting}>Xin chào hội viên 👋</Text>
              <Text style={styles.name}>{profileData?.ho_ten || user?.name}</Text>
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
            <Text style={styles.loadingText}>Đang đồng bộ dữ liệu với CSDL SQLite...</Text>
          </View>
        ) : (
          <>
            {/* Hiển thị các thông báo/cảnh báo hệ thống (Gói sắp hết hạn, hết buổi,...) */}
            {alerts.map((alertItem, idx) => (
              <View 
                key={idx} 
                style={[
                  styles.alertBox, 
                  alertItem.muc_do === 'danger' ? styles.alertDanger : styles.alertWarning
                ]}
              >
                <Text style={styles.alertTitle}>⚠️ {alertItem.tieu_de}</Text>
                <Text style={styles.alertDesc}>{alertItem.noi_dung}</Text>
              </View>
            ))}

            {/* Thẻ Gói Tập (Membership Card) - Đồng bộ dữ liệu thực tế SQLite */}
            <View style={styles.memberCardInner}>
              <View style={styles.cardTopRow}>
                <View style={styles.chipTag}>
                  <Text style={styles.chipText}>🌟 Gói Đăng Ký DB</Text>
                </View>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeText}>
                    {activePlan ? 'Đang hoạt động' : 'Chưa có gói tập'}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardPlan}>
                {activePlan ? activePlan.ten_goi : 'Chưa có gói tập đang hoạt động'}
              </Text>
              
              {activePTPlan ? (
                <Text style={styles.ptNameInfo}>👤 Huấn luyện viên: {activePTPlan.ten_pt}</Text>
              ) : (
                <Text style={styles.ptNameInfo}>💡 Chưa đăng ký kèm Huấn luyện viên cá nhân</Text>
              )}

              {/* Thanh tiến trình số buổi PT thực tế (nếu có) */}
              {activePTPlan && activePTPlan.so_buoi_dang_ky ? (
                <View style={styles.progressContainer}>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressText}>
                      Đã tập: {activePTPlan.so_buoi_da_tap}/{activePTPlan.so_buoi_dang_ky} buổi
                    </Text>
                    <Text style={styles.progressTextBold}>
                      Còn lại: {activePTPlan.so_buoi_dang_ky - activePTPlan.so_buoi_da_tap} buổi
                    </Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${(activePTPlan.so_buoi_da_tap / activePTPlan.so_buoi_dang_ky) * 100}%` }
                      ]} 
                    />
                  </View>
                </View>
              ) : null}

              <View style={styles.divider} />

              <View style={styles.cardBottomRow}>
                <View>
                  <Text style={styles.cardMeta}>Hạn sử dụng gói</Text>
                  <Text style={styles.cardValue}>
                    📅 {activePlan ? formatDate(activePlan.den_ngay) : 'Chưa có'}
                  </Text>
                </View>
                <View style={styles.cardRightInfo}>
                  <Text style={styles.cardMeta}>Mã Hồ Sơ</Text>
                  <Text style={styles.cardValue}>{profileData?.ma_ho_so || 'Chưa có'}</Text>
                </View>
              </View>
            </View>

            {/* Chỉ số theo dõi & trạng thái check-in thực tế */}
            <Text style={styles.sectionTitle}>📊 Trạng thái & Lượt vào ra</Text>
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { borderLeftColor: checkedInToday ? '#1D9336' : '#ff9040' }]}>
                <Text style={[styles.statValue, { fontSize: 16, color: checkedInToday ? '#1D9336' : '#ff9040' }]}>
                  {checkedInToday ? 'Đã Vào Phòng' : 'Chưa Check-in'}
                </Text>
                <Text style={styles.statLabel}>Hôm nay</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: '#1D9336' }]}>
                <Text style={styles.statValue}>
                  {activePTPlan ? activePTPlan.so_buoi_da_tap : 0}
                </Text>
                <Text style={styles.statLabel}>Buổi PT hoàn thành</Text>
              </View>
            </View>

            {/* Lịch tập cùng PT trích xuất từ bảng lich_tap trong SQLite */}
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>📅 Lịch tập cùng PT của bạn (SQLite)</Text>
              <Text style={styles.seeAllText}>Làm mới</Text>
            </View>

            {schedules.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Bạn chưa có lịch tập nào được lên lịch sắp tới.</Text>
              </View>
            ) : (
              schedules.map((item) => (
                <View 
                  key={item.id} 
                  style={[
                    styles.scheduleCard, 
                    { borderLeftColor: item.trang_thai === 'da_tap' ? '#becab9' : '#1D9336' }
                  ]}
                >
                  <View style={styles.scheduleLeft}>
                    <Text style={styles.scheduleTime}>
                      {item.ngay_tap} • {item.gio_bat_dau} - {item.gio_ket_thuc}
                    </Text>
                    <Text style={styles.scheduleTitle}>
                      Loại buổi: {item.loai_buoi === 'ca_nhan' ? 'Tập cá nhân 1 kèm 1' : 'Tập nhóm'}
                    </Text>
                    <Text style={styles.schedulePt}>HLV hướng dẫn: {item.ten_pt}</Text>
                  </View>
                  <View style={[styles.badgeSlot, item.trang_thai === 'da_tap' ? styles.badgeScheduled : styles.badgeSoon]}>
                    <Text style={[styles.badgeSlotText, item.trang_thai !== 'da_tap' && { color: '#1D9336' }]}>
                      {item.trang_thai === 'da_tap' ? 'Đã hoàn thành' : item.trang_thai === 'cho_tap' ? 'Sắp diễn ra' : item.trang_thai}
                    </Text>
                  </View>
                </View>
              ))
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
    marginBottom: 20,
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
    color: '#181c20' 
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
  alertBox: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4
  },
  alertDanger: {
    backgroundColor: '#fef2f2',
    borderLeftColor: '#dc2626'
  },
  alertWarning: {
    backgroundColor: '#fffbeb',
    borderLeftColor: '#f59e0b'
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#181c20',
    marginBottom: 4
  },
  alertDesc: {
    fontSize: 12,
    color: '#3f4a3c',
    lineHeight: 18
  },
  memberCardInner: {
    backgroundColor: '#1D9336', 
    borderRadius: 24, 
    padding: 24,
    shadowColor: '#1D9336', 
    shadowOpacity: 0.35, 
    shadowRadius: 16, 
    elevation: 8,
    marginBottom: 24,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  chipTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20
  },
  chipText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  activeBadge: { 
    backgroundColor: '#ffffff', 
    paddingHorizontal: 12, 
    paddingVertical: 5, 
    borderRadius: 20 
  },
  activeText: { 
    color: '#1D9336', 
    fontSize: 11, 
    fontWeight: '800' 
  },
  cardPlan: { 
    color: '#ffffff', 
    fontSize: 22, 
    fontWeight: '800', 
    marginBottom: 6,
    letterSpacing: -0.3
  },
  ptNameInfo: {
    color: '#e7f5e9', 
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 18
  },
  progressContainer: {
    marginBottom: 16
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  progressText: {
    color: '#e7f5e9',
    fontSize: 12,
    fontWeight: '500'
  },
  progressTextBold: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 4
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 16
  },
  cardBottomRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  cardMeta: { 
    color: '#e7f5e9', 
    fontSize: 11, 
    marginBottom: 4,
    fontWeight: '500'
  },
  cardValue: { 
    color: '#ffffff', 
    fontWeight: '700', 
    fontSize: 14 
  },
  cardRightInfo: {
    alignItems: 'flex-end'
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  sectionTitle: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: '#181c20', 
    marginBottom: 12 
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1D9336',
    marginBottom: 12 
  },
  statsRow: { 
    flexDirection: 'row', 
    gap: 12, 
    marginBottom: 24 
  },
  statCard: {
    flex: 1, 
    backgroundColor: '#ffffff', 
    borderRadius: 16, 
    padding: 14,
    borderLeftWidth: 4.5, 
    borderWidth: 1,
    borderColor: '#ebeef3',
    shadowColor: '#181c20', 
    shadowOpacity: 0.04, 
    shadowRadius: 10, 
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statValue: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#181c20' 
  },
  statLabel: { 
    fontSize: 11, 
    color: '#3f4a3c', 
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center'
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
    borderLeftWidth: 5, 
    borderWidth: 1,
    borderColor: '#ebeef3',
    shadowColor: '#181c20', 
    shadowOpacity: 0.04, 
    shadowRadius: 10, 
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  scheduleLeft: {
    flex: 1,
    paddingRight: 10
  },
  scheduleTime: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#1D9336', 
    marginBottom: 4 
  },
  scheduleTitle: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#181c20',
    marginBottom: 4 
  },
  schedulePt: { 
    fontSize: 12, 
    color: '#3f4a3c',
    fontWeight: '500'
  },
  badgeSlot: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeSoon: {
    backgroundColor: '#e7f5e9', 
  },
  badgeScheduled: {
    backgroundColor: '#f1f4f9',
  },
  badgeSlotText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3f4a3c'
  }
});
