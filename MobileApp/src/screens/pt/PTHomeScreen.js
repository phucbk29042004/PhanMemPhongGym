import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, RefreshControl, ScrollView,
  StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import {
  Award, CalendarCheck, CheckCircle2, ChevronRight, Clock,
  CreditCard, Dumbbell, MapPin, MessageSquare, QrCode, ShieldCheck, TrendingUp, UserCheck, Users, X, Zap, Info, Star, Phone,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import ProfileAvatar from '../../components/ProfileAvatar';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';
import { formatDate } from '../../utils/data';
import { useTheme } from '../../context/ThemeContext';

// ── Hằng số màu sắc Paradise Gym ─────────────────────────
const G = {
  primary: '#1D9336',
  primaryDark: '#155f27',
  primaryLight: '#e6f4ea',
  primaryMid: '#4db870',
  white: '#ffffff',
  gray50: '#f8faf8',
  gray100: '#f0f4f0',
  gray200: '#e4ebe4',
  gray400: '#9cad9c',
  gray500: '#6b7c6b',
  gray700: '#2d3c2d',
  gray900: '#141c14',
  danger: '#dc2626',
  dangerLight: '#fef2f2',
  warning: '#f59e0b',
  warningLight: '#fffbeb',
  shadow: '#1D9336',
};

// ── Component: Chip Tiện Ích ──────────────────────────────
function UtilityChip({ icon: Icon, label, onPress, accent = G.primary, colors }) {
  return (
    <TouchableOpacity style={[styles.utilChip, { backgroundColor: colors?.surface }]} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.utilIcon, { backgroundColor: accent + '18' }]}>
        <Icon color={accent} size={22} strokeWidth={2} />
      </View>
      <Text style={[styles.utilLabel, { color: colors?.text || G.gray700 }]} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Màn hình chính HLV (PT Home Screen) ───────────────────
export default function PTHomeScreen({ navigation }) {
  const { user } = useAuthStore();
  const { colors, isDark } = useTheme();
  const [profile, setProfile] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [gymInfoVisible, setGymInfoVisible] = useState(false);

  // ── Fetch dữ liệu thực tế từ API Backend ─────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [profileRes, schedRes] = await Promise.all([
        api.get('/members/me/profile'),
        api.get('/pt/schedules'),
      ]);

      if (profileRes.data?.success) setProfile(profileRes.data.data);
      if (schedRes.data?.success) setSchedules(schedRes.data.data || []);
    } catch (err) {
      console.error('[PTHomeScreen] fetchAll error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    setStudentsLoading(true);
    try {
      const res = await api.get('/pt/schedules/my-members');
      if (res.data?.success) setStudents(res.data.data || []);
    } catch (err) {
      console.error('[PTHomeScreen] fetchStudents error:', err?.message);
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  // ── Thao tác Xác nhận Hoàn thành buổi tập ────────────────
  const handleConfirmSchedule = async (id) => {
    Alert.alert(
      'Xác nhận buổi tập',
      'Bạn có chắc chắn xác nhận học viên đã hoàn thành buổi tập này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            setActionLoadingId(id);
            try {
              const res = await api.put(`/pt/schedules/${id}/confirm`);
              if (res.data?.success || res.status === 200) {
                const { bothConfirmed } = res.data.data || {};
                if (bothConfirmed) {
                  Alert.alert('Thành công', 'Buổi tập đã được cả 2 bên xác nhận hoàn thành!');
                } else {
                  Alert.alert('Đã ghi nhận', 'Đã ghi nhận xác nhận của bạn. Buổi tập sẽ hoàn thành khi học viên xác nhận.');
                }
                await fetchAll();
              } else {
                Alert.alert('Lỗi', res.data?.message || 'Không thể xác nhận buổi tập.');
              }
            } catch (err) {
              Alert.alert('Lỗi', err.displayMessage || 'Có lỗi xảy ra khi cập nhật.');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  // ── Render buổi tập tiếp theo (Tránh nested ternary/IIFE trong JSX) ──
  const renderNextSchedule = () => {
    if (loading) {
      return (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      );
    }

    const pending = schedules.filter(s => s.trang_thai === 'cho_tap');
    if (pending.length === 0) {
      return (
        <View style={styles.emptyBox}>
          <CalendarCheck color={colors.textMuted} size={48} strokeWidth={1} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Hôm nay bạn không có lịch dạy nào sắp tới.
          </Text>
        </View>
      );
    }

    const next = pending[0];
    return (
      <View style={[styles.contractCard, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
        <View style={styles.contractTop}>
          <View style={[styles.contractBadge, { backgroundColor: colors.primaryLight }]}>
            <Clock color={colors.primary} size={12} strokeWidth={2.5} />
            <Text style={[styles.contractBadgeText, { color: colors.primary }]}>Sắp diễn ra</Text>
          </View>
          <Text style={[styles.contractDateText, { color: colors.textMuted }]}>{formatDate(next.ngay_tap)}</Text>
        </View>

        <View style={styles.memberRowMain}>
          <ProfileAvatar uri={next.avatar_hoi_vien} name={next.ten_hoi_vien} size={50} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.contractPackageName, { color: colors.text }]}>{next.ten_hoi_vien || 'Học viên'}</Text>
            <Text style={[styles.contractSubText, { color: colors.textSecondary }]}>{next.ten_goi_pt || 'Gói tập PT'}</Text>
          </View>
        </View>

        <View style={[styles.contractGrid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.contractGridItem}>
            <Clock color={colors.textMuted} size={14} strokeWidth={2} />
            <Text style={[styles.contractGridLabel, { color: colors.textMuted }]}>Bắt đầu</Text>
            <Text style={[styles.contractGridValue, { color: colors.text }]}>{next.gio_bat_dau}</Text>
          </View>
          <View style={[styles.contractDivider, { backgroundColor: colors.border }]} />
          <View style={styles.contractGridItem}>
            <Dumbbell color={colors.textMuted} size={14} strokeWidth={2} />
            <Text style={[styles.contractGridLabel, { color: colors.textMuted }]}>Buổi thứ</Text>
            <Text style={[styles.contractGridValue, { color: colors.text }]}>{(next.so_buoi_da_tap ?? 0) + 1}/{next.so_buoi_dang_ky ?? '—'}</Text>
          </View>
          <View style={[styles.contractDivider, { backgroundColor: colors.border }]} />
          <View style={styles.contractGridItem}>
            <MapPin color={colors.textMuted} size={14} strokeWidth={2} />
            <Text style={[styles.contractGridLabel, { color: colors.textMuted }]}>Địa điểm</Text>
            <Text style={[styles.contractGridValue, { color: colors.text }]} numberOfLines={1}>{next.chi_nhanh_tap || 'Paradise'}</Text>
          </View>
        </View>

        {next.pt_xac_nhan === 0 ? (
          <TouchableOpacity
            style={styles.confirmBtnMain}
            onPress={() => handleConfirmSchedule(next.id)}
            disabled={actionLoadingId === next.id}
          >
            {actionLoadingId === next.id ? (
              <ActivityIndicator color={G.white} size="small" />
            ) : (
              <>
                <CheckCircle2 color={G.white} size={16} strokeWidth={2.5} />
                <Text style={styles.confirmBtnTextMain}>Xác nhận hoàn thành</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={[styles.confirmBtnMain, { backgroundColor: colors.surfaceVariant, borderWidth: 1, borderColor: colors.border }]}>
            <Clock color={colors.textMuted} size={16} strokeWidth={2.5} />
            <Text style={[styles.confirmBtnTextMain, { color: colors.textMuted, marginLeft: 8 }]}>Chờ học viên xác nhận</Text>
          </View>
        )}
      </View>
    );
  };

  // ── Thống kê nhanh từ danh sách ──────────────────────────
  const pendingSchedules = schedules.filter(s => s.trang_thai === 'cho_tap');
  const completedCount = schedules.filter(s => s.trang_thai === 'da_tap').length;
  const uniqueStudents = new Set(schedules.map(s => s.hoi_vien_id).filter(Boolean)).size;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? colors.background : G.primaryDark} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.background }]}
      >
        <View style={styles.banner}>
          {Array.from({ length: 12 }).map((_, i) => (
            <View
              key={i}
              style={[styles.sunRay, { transform: [{ rotate: `${i * 30}deg` }] }]}
            />
          ))}

          <View style={styles.bannerHeader}>
            <View style={styles.bannerLeft}>
              <View style={styles.bannerAvatar}>
                <ProfileAvatar
                  uri={profile?.avatar_url || user?.avatar_url}
                  name={profile?.ho_ten || user?.name}
                  size={42}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerGreeting}>Huấn luyện viên 👋</Text>
                <Text style={styles.bannerName} numberOfLines={1}>
                  {profile?.ho_ten || user?.name || 'PT chuyên nghiệp'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.bannerBody}>
            <Text style={styles.bannerTitle}>Paradise GYM</Text>
            <Text style={styles.bannerSubtitle}>
              {profile?.chi_nhanh || 'Hệ thống Paradise GYM'}
            </Text>
          </View>
        </View>

        <View style={styles.statsWrapper}>
          <View style={[styles.statCard, { backgroundColor: colors.primary }]}>
            <Users color="rgba(255,255,255,0.25)" size={42} style={styles.statBgIcon} />
            <Text style={styles.statNum}>{uniqueStudents}</Text>
            <Text style={styles.statLabel}>Học viên</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.primaryMid }]}>
            <Clock color="rgba(255,255,255,0.25)" size={42} style={styles.statBgIcon} />
            <Text style={styles.statNum}>{pendingSchedules.length}</Text>
            <Text style={styles.statLabel}>Ca chờ tập</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: isDark ? 1 : 0, shadowColor: colors.primary }]}>
            <CheckCircle2 color={colors.primaryLight} size={42} style={styles.statBgIcon} />
            <Text style={[styles.statNum, { color: colors.text }]}>{completedCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Đã dạy</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: isDark ? 1 : 0 }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBox, { backgroundColor: colors.primaryLight }]}>
              <CalendarCheck color={colors.primary} size={18} strokeWidth={2} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Buổi tập tiếp theo</Text>
          </View>

          {renderNextSchedule()}
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: isDark ? 1 : 0 }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBox, { backgroundColor: colors.primaryLight }]}>
              <Zap color={colors.primary} size={18} strokeWidth={2} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quản lý & Tiện ích</Text>
          </View>

          <View style={styles.utilGrid}>
            <UtilityChip
              icon={QrCode}
              label={'Mã QR\nCheck-in'}
              accent="#7c3aed"
              onPress={() => navigation?.navigate?.('QRCode')}
              colors={colors}
            />
            <UtilityChip
              icon={CalendarCheck}
              label={'Lịch dạy\ncủa tôi'}
              accent={colors.primary}
              onPress={() => navigation?.navigate?.('Schedule')}
              colors={colors}
            />
            <UtilityChip
              icon={Users}
              label={'Danh sách\nHọc viên'}
              accent="#0891b2"
              onPress={() => { fetchStudents(); setShowStudentsModal(true); }}
              colors={colors}
            />
            <UtilityChip
              icon={MessageSquare}
              label={'PT và\nTôi'}
              accent="#0f766e"
              onPress={() => navigation?.navigate?.('PTMe')}
              colors={colors}
            />
          </View>
        </View>

        {/* Gym Info Card (tappable banner) */}
        <TouchableOpacity
          style={[styles.gymInfoCard, { backgroundColor: colors.primaryDark }]}
          onPress={() => setGymInfoVisible(true)}
          activeOpacity={0.85}
        >
          {/* Sun rays */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <View
              key={i}
              style={[
                styles.gymInfoRay,
                { transform: [{ rotate: (i * 45) + 'deg' }] },
              ]}
            />
          ))}
          <View style={styles.gymInfoCardContent}>
            <View style={styles.gymInfoCardLeft}>
              <View style={styles.gymInfoBadge}>
                <ShieldCheck color={G.white} size={11} strokeWidth={2} />
                <Text style={styles.gymInfoBadgeText}>PREMIUM GYM</Text>
              </View>
              <Text style={styles.gymInfoCardTitle}>Paradise GYM</Text>
              <Text style={styles.gymInfoCardDesc}>
                Không gian hiện đại · HLV chuyên nghiệp
              </Text>
              <View style={styles.gymInfoStatsRow}>
                {[
                  { v: '100+', l: 'Hội viên' },
                  { v: '15+', l: 'HLV' },
                  { v: '3+', l: 'Năm' },
                ].map(({ v, l }) => (
                  <View key={l} style={styles.gymInfoStat}>
                    <Text style={styles.gymInfoStatValue}>{v}</Text>
                    <Text style={styles.gymInfoStatLabel}>{l}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.gymInfoCardRight}>
              <View style={styles.gymInfoBtn}>
                <Info color={G.white} size={16} strokeWidth={2} />
                <Text style={styles.gymInfoBtnText}>Xem chi tiết</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Modal Học viên */}
      <Modal
        visible={showStudentsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStudentsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Học viên của tôi</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>Danh sách học viên đang hoạt động</Text>
              </View>
              <TouchableOpacity onPress={() => setShowStudentsModal(false)}>
                <X color={colors.text} size={22} />
              </TouchableOpacity>
            </View>

            {studentsLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 40 }} />
            ) : students.length === 0 ? (
              <Text style={{ textAlign: 'center', marginVertical: 40, color: colors.textMuted }}>Bạn chưa có học viên nào.</Text>
            ) : (
              <FlatList
                data={students}
                keyExtractor={(item) => String(item.dang_ky_id)}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={[styles.studentCard, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                    <View style={styles.studentTop}>
                      <ProfileAvatar uri={item.avatar_url} name={item.ho_ten} size={42} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.studentName, { color: colors.text }]}>{item.ho_ten}</Text>
                        <Text style={[styles.studentMeta, { color: colors.textSecondary }]}>
                          Mã số: {item.ma_ho_so} • {item.so_dien_thoai}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.studentStats, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={styles.studentStatItem}>
                        <Dumbbell color={colors.primary} size={14} strokeWidth={2} />
                        <Text style={[styles.studentStatVal, { color: colors.primary }]}>{item.so_buoi_da_tap}/{item.so_buoi_dang_ky}</Text>
                        <Text style={[styles.studentStatLabel, { color: colors.textMuted }]}>Đã tập</Text>
                      </View>
                      <View style={[styles.studentStatDivider, { backgroundColor: colors.border }]} />
                      <View style={styles.studentStatItem}>
                        <Clock color={G.warning} size={14} strokeWidth={2} />
                        <Text style={[styles.studentStatVal, { color: G.warning }]}>{item.buoi_con_lai ?? '—'}</Text>
                        <Text style={[styles.studentStatLabel, { color: colors.textMuted }]}>Còn lại</Text>
                      </View>
                      <View style={[styles.studentStatDivider, { backgroundColor: colors.border }]} />
                      <View style={styles.studentStatItem}>
                        <CalendarCheck color={colors.textSecondary} size={14} strokeWidth={2} />
                        <Text style={[styles.studentStatVal, { color: colors.text }]}>{item.buoi_tap_sap_toi ? formatDate(item.buoi_tap_sap_toi) : '—'}</Text>
                        <Text style={[styles.studentStatLabel, { color: colors.textMuted }]}>Buổi tới</Text>
                      </View>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal thông tin phòng tập */}
      <Modal
        visible={gymInfoVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGymInfoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.modalSheet, { backgroundColor: colors.surface, paddingHorizontal: 0 }]}>
            <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Thông tin Paradise GYM</Text>
                  <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>Chi tiết tiện ích & nội quy phòng tập</Text>
                </View>
                <TouchableOpacity onPress={() => setGymInfoVisible(false)}>
                  <X color={colors.text} size={22} />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 16, paddingBottom: 40 }}>
                {/* Stats */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={[styles.gymStatCard, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, flex: 1 }]}>
                    <Text style={[styles.gymStatValue, { color: colors.primary }]}>100+</Text>
                    <Text style={[styles.gymStatLabel, { color: colors.textSecondary }]}>Hội viên đang tập</Text>
                  </View>
                  <View style={[styles.gymStatCard, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, flex: 1 }]}>
                    <Text style={[styles.gymStatValue, { color: colors.primary }]}>15+</Text>
                    <Text style={[styles.gymStatLabel, { color: colors.textSecondary }]}>HLV chuyên nghiệp</Text>
                  </View>
                  <View style={[styles.gymStatCard, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, flex: 1 }]}>
                    <Text style={[styles.gymStatValue, { color: colors.primary }]}>3+</Text>
                    <Text style={[styles.gymStatLabel, { color: colors.textSecondary }]}>Chi nhánh hoạt động</Text>
                  </View>
                </View>

                {/* Section: Liên hệ */}
                <View style={[styles.gymInfoSection, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                  <Text style={[styles.gymInfoSectionTitle, { color: colors.text }]}>Hệ thống phòng tập</Text>
                  <View style={styles.gymInfoRow}>
                    <MapPin color={colors.primary} size={16} style={{ marginTop: 2 }} />
                    <Text style={[styles.gymInfoRowText, { color: colors.textSecondary }]}>
                      Chi nhánh Gò Vấp: 123 Nguyễn Oanh, P.10, Gò Vấp, TP.HCM{'\n'}
                      Chi nhánh Bình Thạnh: 456 Điện Biên Phủ, P.25, Bình Thạnh, TP.HCM{'\n'}
                      Chi nhánh Tân Bình: 789 Cộng Hòa, P.12, Tân Bình, TP.HCM
                    </Text>
                  </View>
                  <View style={styles.gymInfoRow}>
                    <Phone color={colors.primary} size={16} />
                    <Text style={[styles.gymInfoRowText, { color: colors.textSecondary }]}>Hotline: 1900 6868</Text>
                  </View>
                  <View style={styles.gymInfoRow}>
                    <Clock color={colors.primary} size={16} />
                    <Text style={[styles.gymInfoRowText, { color: colors.textSecondary }]}>Giờ mở cửa: 05:00 - 22:00 (Hằng ngày)</Text>
                  </View>
                </View>

                {/* Section: Tiện ích */}
                <View style={[styles.gymInfoSection, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                  <Text style={[styles.gymInfoSectionTitle, { color: colors.text }]}>Dịch vụ & Tiện ích miễn phí</Text>
                  {[
                    'Tủ đồ cá nhân thông minh bảo mật cao',
                    'Nước uống tinh khiết miễn phí tại các máy lọc nước',
                    'Phòng tắm nóng lạnh, máy sấy tóc hiện đại',
                    'Đo chỉ số cơ thể BMI miễn phí hàng tháng',
                    'Bãi giữ xe máy & ô tô rộng rãi, an toàn',
                  ].map((text, idx) => (
                    <View key={idx} style={styles.gymBulletRow}>
                      <View style={[styles.gymBulletDot, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.gymBulletText, { color: colors.textSecondary }]}>{text}</Text>
                    </View>
                  ))}
                </View>

                {/* Section: Quy định */}
                <View style={[styles.gymInfoSection, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                  <Text style={[styles.gymInfoSectionTitle, { color: colors.text }]}>Nội quy phòng tập</Text>
                  {[
                    'Vui lòng xuất trình mã QR cá nhân để check-in tại quầy trước khi vào tập.',
                    'Mang giày thể thao sạch và trang phục tập luyện phù hợp.',
                    'Sử dụng khăn cá nhân để trải trên các thiết bị khi sử dụng.',
                    'Cất tạ và dụng cụ về đúng vị trí sau khi tập xong.',
                    'Không làm ồn, nói tục, hoặc gây ảnh hưởng đến người tập khác.',
                  ].map((text, idx) => (
                    <View key={idx} style={styles.gymBulletRow}>
                      <View style={[styles.gymBulletDot, { backgroundColor: colors.danger }]} />
                      <Text style={[styles.gymBulletText, { color: colors.textSecondary }]}>{text}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.gymInfoCloseBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setGymInfoVisible(false)}
                >
                  <Text style={{ color: G.white, fontWeight: '800', fontSize: 15 }}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ── StyleSheet ────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: G.gray50 },
  scrollContent: { paddingBottom: 32 },

  // Banner
  banner: {
    backgroundColor: G.primaryDark,
    paddingTop: 52,
    paddingBottom: 36,
    paddingHorizontal: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  sunRay: {
    position: 'absolute',
    width: 2,
    height: 300,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -50,
    left: '50%',
    transformOrigin: 'bottom center',
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bannerAvatar: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 24,
    overflow: 'hidden',
  },
  bannerGreeting: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  bannerName: { fontSize: 16, color: G.white, fontWeight: '700', maxWidth: 170 },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  bannerBadgeText: { color: G.white, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  bannerBody: { alignItems: 'flex-start', marginTop: 4 },
  bannerTitle: { fontSize: 24, fontWeight: '800', color: G.white, marginBottom: 2 },
  bannerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },

  // Stats Wrapper
  statsWrapper: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: -20,
    justifyContent: 'space-between',
    gap: 8,
    zIndex: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: G.white,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  statBgIcon: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    transform: [{ rotate: '-15deg' }],
  },
  statNum: { fontSize: 18, fontWeight: '800', color: G.white, marginBottom: 2 },
  statLabel: { fontSize: 10, fontWeight: '600', color: G.white, opacity: 0.9, textAlign: 'center' },

  // Contract Card (Styled like Member App)
  contractCard: {
    backgroundColor: G.gray50,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: G.gray100,
  },
  contractTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  contractBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: G.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  contractBadgeText: { fontSize: 10, fontWeight: '800', color: G.primary },
  contractDateText: { fontSize: 11, fontWeight: '600', color: G.gray400 },
  memberRowMain: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  contractPackageName: { fontSize: 17, fontWeight: '800', color: G.gray900 },
  contractSubText: { fontSize: 12, color: G.gray500, fontWeight: '500' },
  contractGrid: {
    flexDirection: 'row',
    backgroundColor: G.white,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: G.gray100,
  },
  contractGridItem: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: 4 },
  contractGridLabel: { fontSize: 9, color: G.gray400, fontWeight: '600', textTransform: 'uppercase' },
  contractGridValue: { fontSize: 12, fontWeight: '800', color: G.gray900 },
  contractDivider: { width: 1, height: '60%', backgroundColor: G.gray100, alignSelf: 'center' },
  confirmBtnMain: {
    backgroundColor: G.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: G.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  confirmBtnTextMain: { color: G.white, fontWeight: '800', fontSize: 14 },

  // Section
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: G.white,
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: G.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: G.gray900, flex: 1 },
  viewAllText: { fontSize: 12, fontWeight: '700', color: G.primary },

  // Utility chips
  utilGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  utilChip: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    minWidth: 55,
  },
  utilIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 13,
  },

  // Schedules List
  loadingBox: { paddingVertical: 20, alignItems: 'center' },
  emptyBox: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 13, color: G.gray400, textAlign: 'center', paddingHorizontal: 20 },
  schedulesList: { gap: 12 },
  scheduleItem: {
    backgroundColor: G.gray50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: G.gray100,
    overflow: 'hidden',
  },
  schedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  schedTimeBadge: {
    backgroundColor: G.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  schedTimeBadgeText: { fontSize: 11, fontWeight: '800', color: G.primaryDark },
  schedDateText: { fontSize: 11, fontWeight: '600', color: G.gray500 },
  schedBody: { paddingHorizontal: 12, paddingBottom: 10 },
  schedMemberInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  schedMemberName: { fontSize: 15, fontWeight: '700', color: G.gray900, marginBottom: 2 },
  schedPackageType: { fontSize: 11, color: G.gray500, fontWeight: '500' },
  schedNote: {
    fontSize: 11,
    color: G.gray500,
    fontStyle: 'italic',
    backgroundColor: G.white,
    padding: 6,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: G.gray200,
  },
  schedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: G.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: G.gray100,
  },
  statusPill: {
    backgroundColor: '#fef9c3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusPillText: { fontSize: 10, fontWeight: '700', color: '#a16207' },
  confirmActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: G.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 100,
    justifyContent: 'center',
    shadowColor: G.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  confirmActionBtnText: { color: G.white, fontSize: 11, fontWeight: '800' },

  // Modal Học viên
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: G.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: G.gray100,
    marginBottom: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: G.gray900 },
  modalSubtitle: { fontSize: 11, color: G.gray400, fontWeight: '500', marginTop: 1 },

  // Student Cards in Modal
  studentCard: {
    backgroundColor: G.gray50,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: G.gray100,
  },
  studentTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  studentName: { fontSize: 16, fontWeight: '800', color: G.gray900 },
  studentMeta: { fontSize: 11, color: G.gray500, fontWeight: '500', marginTop: 2 },
  studentStats: {
    flexDirection: 'row',
    backgroundColor: G.white,
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: G.gray100,
  },
  studentStatItem: { flex: 1, alignItems: 'center', gap: 2 },
  studentStatDivider: { width: 1, height: 24, backgroundColor: G.gray100, alignSelf: 'center' },
  studentStatVal: { fontSize: 13, fontWeight: '800', color: G.primary },
  studentStatLabel: { fontSize: 9, color: G.gray400, fontWeight: '600' },

  // Gym Info Card (tappable banner)
  gymInfoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: G.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  gymInfoRay: {
    position: 'absolute',
    width: 2,
    height: 300,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -80,
    left: '50%',
    transformOrigin: 'bottom center',
  },
  gymInfoCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gymInfoCardLeft: { flex: 1 },
  gymInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  gymInfoBadgeText: { color: G.white, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  gymInfoCardTitle: { fontSize: 22, fontWeight: '900', color: G.white, letterSpacing: 0.3 },
  gymInfoCardDesc: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '500' },
  gymInfoStatsRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  gymInfoStat: { alignItems: 'center' },
  gymInfoStatValue: { fontSize: 15, fontWeight: '900', color: G.white },
  gymInfoStatLabel: { fontSize: 9, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
  gymInfoCardRight: { marginLeft: 12 },
  gymInfoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  gymInfoBtnText: { color: G.white, fontSize: 12, fontWeight: '800' },

  // Gym Info Modal content styles
  gymStatCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  gymStatValue: { fontSize: 18, fontWeight: '900' },
  gymStatLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  gymInfoSection: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  gymInfoSectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  gymInfoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  gymInfoRowText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  gymBulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gymBulletDot: { width: 6, height: 6, borderRadius: 3 },
  gymBulletText: { flex: 1, fontSize: 13, lineHeight: 19 },
  gymInfoCloseBtn: {
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  phone: {},
});
