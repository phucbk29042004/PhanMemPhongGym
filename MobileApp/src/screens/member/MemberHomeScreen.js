import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator, Alert, FlatList, RefreshControl, ScrollView,
  StatusBar, StyleSheet, Text, TouchableOpacity, View,
  Modal, TextInput, Platform, KeyboardAvoidingView, Image,
} from 'react-native';
import {
  Award, CalendarCheck, ChevronRight, Clock,
  CreditCard, Dumbbell, QrCode, ShieldCheck,
  TrendingUp, Users, Zap, MessageSquare, CheckCircle2, XCircle, ChevronDown,
  MapPin, Phone, Info, Star
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import ProfileAvatar from '../../components/ProfileAvatar';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
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

// ── Helper: số ngày còn lại ───────────────────────────────
function daysLeft(den_ngay) {
  if (!den_ngay) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const end = new Date(den_ngay); end.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((end - today) / 86400000));
}

// ── Helper: format giá tiền ───────────────────────────────
function formatPrice(val) {
  if (val == null) return '—';
  return Number(val).toLocaleString('vi-VN') + 'đ';
}

// ── Component: Card Gói Hội Viên ──────────────────────────
function PackageCard({ item, index, colors: propColors, onPress }) {
  const theme = useTheme();
  const colors = propColors || theme.colors;
  const isDark = theme.isDark;
  const cardBg = isDark ? colors.surfaceVariant : [colors.primaryLight, '#e8f4fd', '#fef9e7', '#f3e8ff'][index % 4];
  const accentColor = isDark ? colors.primary : [G.primary, '#1565c0', '#b7791f', '#7c3aed'][index % 4];

  return (
    <TouchableOpacity
      style={[
        styles.packageCard,
        {
          backgroundColor: cardBg,
          borderWidth: isDark ? 1 : 0,
          borderColor: isDark ? colors.border : 'transparent',
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.pkgCardBrandRow}>
        <Dumbbell color={accentColor} size={11} strokeWidth={2.5} />
        <Text style={[styles.pkgCardBrandText, { color: accentColor }]}>PARADISE GYM</Text>
      </View>
      <Text style={[styles.packageNameText, { color: colors.text }]} numberOfLines={2}>
        {item.ten_goi}
      </Text>
      <Text style={[styles.packagePriceText, { color: accentColor }]}>
        {formatPrice(item.gia)}
      </Text>
      <View style={[styles.pkgCardBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
        <Text style={[styles.pkgCardBadgeText, { color: colors.textSecondary }]}>
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Component: Chip Tiện Ích ──────────────────────────────
function UtilityChip({ icon: Icon, label, onPress, accent = G.primary, colors }) {
  return (
    <TouchableOpacity style={[styles.utilChip, { backgroundColor: colors?.surface || G.white }]} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.utilIcon, { backgroundColor: accent + '18' }]}>
        <Icon color={accent} size={22} strokeWidth={2} />
      </View>
      <Text style={[styles.utilLabel, { color: colors?.text || G.gray700 }]} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}


// ── Màn hình chính ────────────────────────────────────────
export default function MemberHomeScreen({ navigation }) {
  const { user, logout } = useAuthStore();
  const { colors } = useTheme();
  const { fetchNotifications } = useNotificationStore();
  const [profile, setProfile] = useState(null);
  const [gymPackages, setGymPackages] = useState([]);
  const [ptPackages, setPtPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [ptScheduleVisible, setPtScheduleVisible] = useState(false);
  const [ptSchedules, setPtSchedules] = useState([]);
  const [ptScheduleLoading, setPtScheduleLoading] = useState(false);
  const [editingNote, setEditingNote] = useState(null); // { id, ghi_chu }
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [remainingPtVisible, setRemainingPtVisible] = useState(false);

  // States cho PayOS trên trang chủ
  const [payosModalVisible, setPayosModalVisible] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [pollingActive, setPollingActive] = useState(false);
  const pollingErrorCountRef = useRef(0);
  const pollingActiveRef = useRef(false);

  // Keep ref in sync
  useEffect(() => {
    pollingActiveRef.current = pollingActive;
  }, [pollingActive]);

  const [timeLeft, setTimeLeft] = useState(300); // 5 phút = 300 giây

  // Reset timeLeft khi mở modal
  useEffect(() => {
    if (payosModalVisible) {
      setTimeLeft(300);
    }
  }, [payosModalVisible]);

  // Bộ đếm ngược 5 phút
  useEffect(() => {
    let timerId = null;
    if (payosModalVisible && timeLeft > 0) {
      timerId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerId);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [payosModalVisible, timeLeft]);

  const handleTimeout = async () => {
    setPayosModalVisible(false);
    setPollingActive(false);
    if (paymentInfo?.id) {
      try {
        await api.post(`/members/me/package-request/${paymentInfo.id}/cancel`);
        fetchAll();
      } catch (err) {
        console.error('Lỗi khi tự động hủy đơn gia hạn:', err);
      }
    }
    Alert.alert('Thanh toán hết hạn', 'Đã hết thời gian thanh toán 5 phút. Giao dịch đã bị hủy tự động.');
  };

  // Turn off polling when screen is blurred/navigated away
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      setPollingActive(false);
      setPayosModalVisible(false);
    });
    return unsubscribe;
  }, [navigation]);

  const handleResumePayment = async (plan) => {
    setLoading(true);
    try {
      const res = await api.get(`/members/me/payos-status/${plan.payos_order_code}?resume=true`);
      if (res.data?.success) {
        const { status, qrCode, checkoutUrl, orderCode } = res.data.data;
        if (status === 'PAID') {
          Alert.alert('Thông báo', 'Giao dịch này đã được thanh toán thành công trước đó.');
          fetchAll();
        } else if (status === 'CANCELLED') {
          Alert.alert('Thông báo', 'Giao dịch này đã bị hủy.');
          fetchAll();
        } else {
          setPaymentInfo({
            id: plan.id, // Lưu thêm id để gọi API hủy khi timeout
            orderCode: orderCode || plan.payos_order_code,
            qrCodeUrl: qrCode || checkoutUrl,
            amount: plan.gia_thuc_te,
            checkoutUrl: checkoutUrl
          });
          setPayosModalVisible(true);
          setPollingActive(true);
          pollingErrorCountRef.current = 0;
        }
      }
    } catch (err) {
      Alert.alert('Lỗi', err?.displayMessage || 'Có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let intervalId = null;
    if (pollingActive && paymentInfo?.orderCode) {
      intervalId = setInterval(async () => {
        if (!pollingActiveRef.current) return;
        try {
          const res = await api.get(`/members/me/payos-status/${paymentInfo.orderCode}`);
          if (!pollingActiveRef.current) return;
          if (res.data?.success) {
            const status = res.data.data?.status;
            if (status === 'PAID') {
              setPollingActive(false);
              setPayosModalVisible(false);
              Alert.alert('Thành công 🎉', 'Thanh toán chuyển khoản qua PayOS thành công! Gói tập của bạn đã được kích hoạt.', [
                { text: 'Đồng ý', onPress: () => { fetchAll(); } }
              ]);
            } else if (status === 'CANCELLED') {
              setPollingActive(false);
              setPayosModalVisible(false);
              Alert.alert('Hủy thanh toán', 'Giao dịch thanh toán PayOS đã bị hủy.', [
                { text: 'Đồng ý', onPress: () => { fetchAll(); } }
              ]);
            }
          }
        } catch (err) {
          console.error('Lỗi checkPayosStatus polling:', err);
          pollingErrorCountRef.current += 1;
          if (pollingErrorCountRef.current > 15) {
            setPollingActive(false);
          }
        }
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pollingActive, paymentInfo, fetchAll]);

  // ── Fetch dữ liệu thực tế từ API ─────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [profileRes, pkgRes, ptPkgRes] = await Promise.all([
        api.get('/members/me/profile'),
        api.get('/packages'),          // Gói gym
        api.get('/packages/pt'),       // Gói PT
      ]);

      if (profileRes.data?.success) setProfile(profileRes.data.data);
      if (pkgRes.data?.success) setGymPackages(pkgRes.data.data || []);
      if (ptPkgRes.data?.success) setPtPackages(ptPkgRes.data.data || []);

      // Fetch thông báo ngầm
      fetchNotifications();
    } catch (err) {
      console.error('[HomeScreen] fetchAll error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAll();

      // Tự động tải lại thông báo mỗi 10 giây để hiển thị badge số đỏ realtime khi có lịch tập thay đổi
      const intervalId = setInterval(() => {
        fetchNotifications();
      }, 10000);

      return () => clearInterval(intervalId);
    }, [fetchAll, fetchNotifications])
  );

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  // ── Mở modal lịch tập PT ────────────────────────────────
  const openPtSchedule = async () => {
    setPtScheduleVisible(true);
    setPtScheduleLoading(true);
    try {
      const res = await api.get('/pt/schedules');
      if (res.data?.success) {
        const sorted = (res.data.data || []).sort((a, b) => new Date(b.ngay_tap) - new Date(a.ngay_tap));
        setPtSchedules(sorted);
      }
    } catch (e) {
      console.error('[PT Schedule]', e?.message);
    } finally {
      setPtScheduleLoading(false);
    }
  };

  // ── Lưu ghi chú buổi tập ────────────────────────────────
  const saveNote = async () => {
    if (!editingNote) return;
    setSavingNote(true);
    try {
      await api.patch(`/pt/schedules/${editingNote.id}/note`, { ghi_chu: noteText });
      setPtSchedules(prev => prev.map(s => s.id === editingNote.id ? { ...s, ghi_chu: noteText } : s));
      setEditingNote(null);
    } catch (e) {
      console.error('[SaveNote]', e?.message);
    } finally {
      setSavingNote(false);
    }
  };

  const openRenewModal = () => {
    navigation.navigate('OrderConfirmation', { profile });
  };

  // ── Dữ liệu đã xử lý ─────────────────────────────────────
  const activePlan = profile?.goi_tap?.find(p => p.trang_thai === 'dang_hoat_dong') || null;
  const choKichHoatPlan = profile?.goi_tap?.find(p => p.trang_thai === 'cho_kich_hoat') || null;
  const pendingPlan = profile?.goi_tap?.find(p => p.trang_thai === 'cho_duyet') || null;
  const expiredPlan = profile?.goi_tap?.find(p => p.trang_thai === 'het_han') || null;
  const currentPlan = activePlan || choKichHoatPlan || pendingPlan || expiredPlan;
  const hasAnyPackage = profile?.goi_tap && profile.goi_tap.length > 0;
  const activePT = profile?.dang_ky_pt?.[0] || null;
  const remaining = daysLeft(currentPlan?.den_ngay);
  const ptRemaining = activePT ? Math.max(0, (activePT.so_buoi_dang_ky || 0) - (activePT.so_buoi_da_tap || 0)) : null;
  // Thêm prefix 'gym-' / 'pt-' vào id để tránh key trùng khi render
  const allPackages = [
    ...gymPackages.map(p => ({ ...p, _key: `gym-${p.id}` })),
    ...ptPackages.map(p => ({ ...p, _key: `pt-${p.id}` })),
  ];

  // ── State chi tiết gói tập ───────────────────────────────
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetailPkg, setSelectedDetailPkg] = useState(null);
  const [gymInfoVisible, setGymInfoVisible] = useState(false);
  const [allPackagesModalVisible, setAllPackagesModalVisible] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={G.primaryDark} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[G.primary]} tintColor={G.primary} />}
        contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.background, flexGrow: 1 }]}
      >
        {/* ──────────────────────────────────────────────── */}
        {/* TOP BANNER — Paradise Gym với hiệu ứng tia nắng  */}
        {/* ──────────────────────────────────────────────── */}
        <View style={styles.banner}>
          {/* Tia nắng tỏa ra bằng View xoay — hiệu ứng thuần RN */}
          {Array.from({ length: 12 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.sunRay,
                { transform: [{ rotate: `${i * 30}deg` }] },
              ]}
            />
          ))}
          {/* Header: avatar + tên người dùng */}
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
                <Text style={styles.bannerGreeting}>Xin chào 👋</Text>
                <Text style={styles.bannerName} numberOfLines={1}>
                  {profile?.ho_ten || user?.name || 'Hội viên'}
                </Text>
              </View>
            </View>
          </View>

          {/* Tiêu đề lớn */}
          <View style={styles.bannerBody}>
            <Text style={styles.bannerTitle}>Paradise GYM</Text>
            <Text style={styles.bannerSubtitle}>
              {profile?.chi_nhanh || 'Chăm sóc sức khỏe mỗi ngày'}
            </Text>
          </View>
        </View>

        {/* ────────────────────────────────────── */}
        {/* CARD HỢP ĐỒNG / GÓI TẬP ĐANG HOẠT ĐỘNG */}
        {/* ────────────────────────────────────── */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBox, { backgroundColor: colors.primaryLight }]}>
                <CreditCard color={colors.primary} size={18} strokeWidth={2} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Gói Hội Viên</Text>
              <TouchableOpacity onPress={() => setAllPackagesModalVisible(true)} activeOpacity={0.7}>
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>Xem thêm</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={colors.primary} size="small" />
              </View>
            ) : (currentPlan || activePT) ? (
              <TouchableOpacity
                style={[styles.contractCard, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
                onPress={() => {
                  if (currentPlan) {
                    setSelectedDetailPkg(currentPlan);
                    setDetailModalVisible(true);
                  } else {
                    setRemainingPtVisible(true);
                  }
                }}
                activeOpacity={0.8}
              >
                {/* Trạng thái + tên gói */}
                <View style={styles.contractTop}>
                  {currentPlan ? (
                    <>
                      {activePlan ? (
                        <View style={[styles.contractBadge, { backgroundColor: colors.primaryLight }]}>
                          <ShieldCheck color={colors.primary} size={12} strokeWidth={2.5} />
                          <Text style={[styles.contractBadgeText, { color: colors.primary }]}>Đang hoạt động</Text>
                        </View>
                      ) : null}
                      {choKichHoatPlan && !activePlan ? (
                        <View style={[styles.contractBadge, { backgroundColor: colors.primaryLight }]}>
                          <ShieldCheck color={colors.primary} size={12} strokeWidth={2.5} />
                          <Text style={[styles.contractBadgeText, { color: colors.primary }]}>Chờ kích hoạt nối tiếp</Text>
                        </View>
                      ) : null}
                      {pendingPlan && !activePlan && !choKichHoatPlan ? (
                        <View style={[styles.contractBadge, { backgroundColor: colors.warningLight }]}>
                          <Clock color={colors.warning} size={12} strokeWidth={2.5} />
                          <Text style={[styles.contractBadgeText, { color: colors.warning }]}>
                            {pendingPlan.phuong_thuc_tt === 'chuyen_khoan' && pendingPlan.payos_status === 'PENDING'
                              ? 'Đang chờ thanh toán chuyển khoản'
                              : 'Đang chờ duyệt'}
                          </Text>
                        </View>
                      ) : null}
                      {!activePlan && !choKichHoatPlan && !pendingPlan && expiredPlan ? (
                        <View style={[styles.contractBadge, { backgroundColor: colors.dangerLight }]}>
                          <Clock color={colors.danger} size={12} strokeWidth={2.5} />
                          <Text style={[styles.contractBadgeText, { color: colors.danger }]}>Đã hết hạn</Text>
                        </View>
                      ) : null}
                      {remaining !== null && remaining <= 7 && activePlan && (
                        <View style={[styles.contractBadge, { backgroundColor: colors.dangerLight }]}>
                          <Clock color={colors.danger} size={12} strokeWidth={2.5} />
                          <Text style={[styles.contractBadgeText, { color: colors.danger }]}>Sắp hết hạn</Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={[styles.contractBadge, { backgroundColor: colors.primaryLight }]}>
                      <ShieldCheck color={colors.primary} size={12} strokeWidth={2.5} />
                      <Text style={[styles.contractBadgeText, { color: colors.primary }]}>
                        {activePT.trang_thai === 'dang_hoat_dong' ? 'PT Đang hoạt động' : 'PT Chờ kích hoạt'}
                      </Text>
                    </View>
                  )}
                </View>
                
                <Text style={[styles.contractPackageName, { color: colors.text }]}>
                  {currentPlan ? currentPlan.ten_goi : activePT.ten_goi_pt || 'Gói Huấn Luyện Viên Cá Nhân'}
                </Text>

                {/* Thông số grid */}
                {currentPlan ? (
                  <View style={[styles.contractGrid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.contractGridItem}>
                      <CalendarCheck color={colors.textMuted} size={14} strokeWidth={2} />
                      <Text style={[styles.contractGridLabel, { color: colors.textMuted }]}>Từ ngày</Text>
                      <Text style={[styles.contractGridValue, { color: colors.text }]}>{formatDate(currentPlan.tu_ngay)}</Text>
                    </View>
                    <View style={[styles.contractDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.contractGridItem}>
                      <Clock color={remaining !== null && remaining <= 7 && activePlan ? colors.danger : colors.textMuted} size={14} strokeWidth={2} />
                      <Text style={[styles.contractGridLabel, { color: colors.textMuted }]}>Hết hạn</Text>
                      <Text style={[styles.contractGridValue, { color: colors.text }, remaining !== null && remaining <= 7 && activePlan && { color: colors.danger }]}>
                        {formatDate(currentPlan.den_ngay)}
                      </Text>
                    </View>
                    <View style={[styles.contractDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.contractGridItem}>
                      <TrendingUp color={colors.primary} size={14} strokeWidth={2} />
                      <Text style={[styles.contractGridLabel, { color: colors.textMuted }]}>Còn lại</Text>
                      <Text style={[styles.contractGridValue, { color: remaining !== null && remaining <= 7 && activePlan ? colors.danger : colors.primary }]}>
                        {remaining !== null && activePlan ? `${remaining} ngày` : '—'}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.contractGrid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.contractGridItem}>
                      <CalendarCheck color={colors.textMuted} size={14} strokeWidth={2} />
                      <Text style={[styles.contractGridLabel, { color: colors.textMuted }]}>Từ ngày</Text>
                      <Text style={[styles.contractGridValue, { color: colors.text }]}>{formatDate(activePT.tu_ngay)}</Text>
                    </View>
                    <View style={[styles.contractDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.contractGridItem}>
                      <Clock color={colors.textMuted} size={14} strokeWidth={2} />
                      <Text style={[styles.contractGridLabel, { color: colors.textMuted }]}>Hết hạn</Text>
                      <Text style={[styles.contractGridValue, { color: colors.text }]}>
                        {formatDate(activePT.den_ngay)}
                      </Text>
                    </View>
                    <View style={[styles.contractDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.contractGridItem}>
                      <TrendingUp color={colors.primary} size={14} strokeWidth={2} />
                      <Text style={[styles.contractGridLabel, { color: colors.textMuted }]}>Số buổi</Text>
                      <Text style={[styles.contractGridValue, { color: colors.primary }]}>
                        {ptRemaining} buổi
                      </Text>
                    </View>
                  </View>
                )}

                {/* HLV PT (nếu có) — bấm để xem lịch tập */}
                {currentPlan && activePT ? (
                  <TouchableOpacity style={[styles.ptRow, { backgroundColor: colors.surface }]} onPress={openPtSchedule} activeOpacity={0.75}>
                    <Dumbbell color={colors.primary} size={15} strokeWidth={2} />
                    <Text style={[styles.ptRowText, { color: colors.text }]}>
                      {activePT.ten_goi_pt ? (
                        <>
                          <Text style={{ fontWeight: '700', color: colors.text }}>{activePT.ten_goi_pt}</Text>
                          {'  •  '}
                        </>
                      ) : null}
                      HLV: <Text style={{ fontWeight: '700', color: colors.text }}>{activePT.ten_pt}</Text>
                      {'  •  '}Còn <Text style={{ fontWeight: '700', color: colors.primary }}>{ptRemaining} buổi</Text>
                    </Text>
                    <ChevronRight color={colors.primary} size={16} strokeWidth={2.5} />
                  </TouchableOpacity>
                ) : !currentPlan && activePT ? (
                  <TouchableOpacity style={[styles.ptRow, { backgroundColor: colors.surface }]} onPress={openPtSchedule} activeOpacity={0.75}>
                    <Dumbbell color={colors.primary} size={15} strokeWidth={2} />
                    <Text style={[styles.ptRowText, { color: colors.text }]}>
                      HLV: <Text style={{ fontWeight: '700', color: colors.text }}>{activePT.ten_pt}</Text>
                      {'  •  '}Bấm để xem lịch tập với PT
                    </Text>
                    <ChevronRight color={colors.primary} size={16} strokeWidth={2.5} />
                  </TouchableOpacity>
                ) : null}

                {/* Nút gia hạn nếu hết hạn và KHÔNG CÓ yêu cầu chờ duyệt */}
                {expiredPlan && !activePlan && !pendingPlan && (
                  <TouchableOpacity
                    style={styles.renewButton}
                    onPress={openRenewModal}
                    activeOpacity={0.8}
                  >
                    <Zap color={G.white} size={16} strokeWidth={2.5} />
                    <Text style={styles.renewButtonText}>Gia hạn ngay</Text>
                  </TouchableOpacity>
                )}

                {pendingPlan && (
                  <View style={[styles.pendingRequestCard, { backgroundColor: colors.warningLight, borderColor: colors.warning }]}>
                    <View style={styles.pendingRequestHeader}>
                      <Clock color={colors.warning} size={15} strokeWidth={2} />
                      <Text style={[styles.pendingRequestTitle, { color: colors.warning }]}>
                        {pendingPlan.phuong_thuc_tt === 'chuyen_khoan' && pendingPlan.payos_status === 'PENDING'
                          ? 'Đang chờ thanh toán chuyển khoản'
                          : 'Yêu cầu đang chờ duyệt'}
                      </Text>
                    </View>
                    <Text style={[styles.pendingRequestPkg, { color: colors.text }]} numberOfLines={1}>{pendingPlan.ten_goi}</Text>
                    <Text style={[styles.pendingRequestInfo, { color: colors.textSecondary }]}>
                      {formatDate(pendingPlan.tu_ngay)} – {formatDate(pendingPlan.den_ngay)}
                      {pendingPlan.phuong_thuc_tt === 'chuyen_khoan' ? '  •  Chuyển khoản' : '  •  Tiền mặt'}
                    </Text>

                    {pendingPlan.phuong_thuc_tt === 'chuyen_khoan' && pendingPlan.payos_status === 'PENDING' && (
                      <TouchableOpacity
                        style={[styles.payNowBtn, { backgroundColor: colors.primary }]}
                        activeOpacity={0.8}
                        onPress={() => handleResumePayment(pendingPlan)}
                      >
                        <CreditCard color={G.white} size={15} strokeWidth={2.5} />
                        <Text style={styles.payNowBtnText}>Thanh toán ngay</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.cancelRequestBtn}
                      activeOpacity={0.8}
                      onPress={() => {
                        Alert.alert(
                          'Hủy yêu cầu gia hạn',
                          `Bạn muốn hủy yêu cầu gia hạn gói "${pendingPlan.ten_goi}" đang chờ duyệt?`,
                          [
                            { text: 'Không', style: 'cancel' },
                            {
                              text: 'Hủy yêu cầu', style: 'destructive',
                              onPress: async () => {
                                try {
                                  await api.post(`/members/me/package-request/${pendingPlan.id}/cancel`);
                                  Alert.alert('Thành công', 'Đã hủy yêu cầu gia hạn thành công.');
                                  onRefresh();
                                } catch (err) {
                                  Alert.alert('Lỗi', err?.message || 'Không thể hủy yêu cầu lúc này.');
                                }
                              }
                            }
                          ]
                        );
                      }}
                    >
                      <XCircle color={G.white} size={15} strokeWidth={2.5} />
                      <Text style={styles.cancelRequestBtnText}>Hủy yêu cầu gia hạn</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {choKichHoatPlan && (
                  <View style={[styles.pendingRequestCard, { backgroundColor: colors.primaryLight, borderColor: colors.primary, marginTop: 12 }]}>
                    <View style={styles.pendingRequestHeader}>
                      <CheckCircle2 color={colors.primary} size={15} strokeWidth={2} />
                      <Text style={[styles.pendingRequestTitle, { color: colors.primary }]}>
                        Gói gia hạn đã được phê duyệt
                      </Text>
                    </View>
                    <Text style={[styles.pendingRequestPkg, { color: colors.text }]} numberOfLines={1}>{choKichHoatPlan.ten_goi}</Text>
                    <Text style={[styles.pendingRequestInfo, { color: colors.textSecondary }]}>
                      Hiệu lực nối tiếp: {formatDate(choKichHoatPlan.tu_ngay)} – {formatDate(choKichHoatPlan.den_ngay)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyContract}>
                <CreditCard color={colors.textMuted} size={36} strokeWidth={1.5} />
                <Text style={[styles.emptyContractText, { color: colors.text }]}>Chưa đăng ký gói tập</Text>
                <Text style={[styles.emptyContractSub, { color: colors.textMuted }]}>Hãy nhấn Xem thêm ở góc phải để đăng ký gói tập mới.</Text>
              </View>
            )}
          </View>

        {/* ──────────────────── */}
        {/* TIỆN ÍCH NHANH      */}
        {/* ──────────────────── */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBox, { backgroundColor: colors.primaryLight }]}>
              <Zap color={colors.primary} size={18} strokeWidth={2} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tiện ích</Text>
            {profile?.chi_nhanh ? (
              <Text style={[styles.branchLabel, { color: colors.textMuted }]} numberOfLines={1}>{profile.chi_nhanh}</Text>
            ) : null}
          </View>

          <View style={styles.utilGrid}>
            <UtilityChip
              icon={QrCode}
              label={'Quét QR\nCheck-in'}
              accent="#7c3aed"
              onPress={() => navigation?.navigate?.('QRCode')}
              colors={colors}
            />

            <UtilityChip
              icon={CalendarCheck}
              label={'Lịch tập\ntiếp theo'}
              accent={colors.primary}
              onPress={() => navigation?.navigate?.('Schedule')}
              colors={colors}
            />
            <UtilityChip
              icon={TrendingUp}
              label={'Thống kê\ntập luyện'}
              accent="#0891b2"
              onPress={() => navigation?.navigate?.('Checkins')}
              colors={colors}
            />
            <UtilityChip
              icon={MessageSquare}
              label={'PT &\nTôi'}
              accent="#0f766e"
              onPress={() => navigation?.navigate?.('PTMe')}
              colors={colors}
            />
            <UtilityChip
              icon={Award}
              label={'Buổi PT\ncòn lại'}
              accent="#b7791f"
              onPress={() => setRemainingPtVisible(true)}
              colors={colors}
            />
          </View>
        </View>

        {/* Danh sách gói tập đã được đưa lên modal Xem thêm ở card hợp đồng */}

        {/* ─────────────────────────────────────── */}
        {/* CARD NỘI DUNG PHÒNG TẬP (bấm mở modal) */}
        {/* ─────────────────────────────────────── */}
        <TouchableOpacity
          style={[
            styles.gymInfoCard,
            {
              backgroundColor: colors.isDark ? '#1f2e21' : '#3a5f43',
              shadowColor: colors.isDark ? '#000000' : '#3a5f43',
              shadowOpacity: colors.isDark ? 0.15 : 0.12,
              elevation: 3,
            }
          ]}
          onPress={() => setGymInfoVisible(true)}
          activeOpacity={0.85}
        >
          {/* Sun rays */}
          {Array.from({ length: 8 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.gymInfoRay,
                { transform: [{ rotate: `${i * 45}deg` }] },
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

      {/* ── Modal Lịch tập PT ──────────────────────────────── */}
      <Modal
        visible={ptScheduleVisible}
        transparent
        animationType="slide"
        onRequestClose={() => { setPtScheduleVisible(false); setEditingNote(null); }}
      >
        <View style={styles.bottomSheetOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
            <View style={[styles.modalContent, styles.bottomSheetContent, { backgroundColor: colors.surface, maxHeight: '95%' }]}>
              {/* Header */}
              <View style={[styles.modalHeader, { backgroundColor: G.primaryDark }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Lịch tập với PT</Text>
                  {activePT ? (
                    <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 }}>
                      HLV: {activePT.ten_pt}  •  Còn {ptRemaining} buổi
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => { setPtScheduleVisible(false); setEditingNote(null); }}>
                  <Text style={styles.modalCloseX}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Ghi chú inline editor */}
              {editingNote ? (
                <View style={[styles.noteEditor, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                  <Text style={[styles.noteEditorLabel, { color: colors.text }]}>Ghi chú buổi tập</Text>
                  <TextInput
                    style={[styles.noteInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    value={noteText}
                    onChangeText={setNoteText}
                    multiline
                    numberOfLines={3}
                    placeholder="VD: Hôm nay ăn gì, tập bài gì, cảm nhận sau buổi tập..."
                    placeholderTextColor={colors.textMuted}
                    autoFocus
                  />
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                    <TouchableOpacity
                      style={[styles.noteBtn, { backgroundColor: colors.surfaceVariant }]}
                      onPress={() => setEditingNote(null)}
                    >
                      <Text style={{ color: colors.textMuted, fontWeight: '700', fontSize: 13 }}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.noteBtn, { backgroundColor: colors.primary, flex: 2 }]}
                      onPress={saveNote}
                      disabled={savingNote}
                    >
                      {savingNote
                        ? <ActivityIndicator color={G.white} size="small" />
                        : <Text style={{ color: G.white, fontWeight: '700', fontSize: 13 }}>Lưu ghi chú</Text>
                      }
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {/* Danh sách lịch tập */}
              {ptScheduleLoading ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <ActivityIndicator color={colors.primary} size="large" />
                </View>
              ) : ptSchedules.length === 0 ? (
                <View style={{ paddingVertical: 40, alignItems: 'center', gap: 8 }}>
                  <CalendarCheck color={colors.textMuted} size={36} strokeWidth={1.5} />
                  <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Chưa có lịch tập nào</Text>
                </View>
              ) : (
                <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
                  {ptSchedules.map(s => {
                    const statusMap = {
                      cho_tap: { label: 'Chờ tập', color: G.warning, bg: G.warningLight },
                      da_tap: { label: 'Đã hoàn thành', color: colors.primary, bg: colors.primaryLight },
                      da_huy: { label: 'Đã hủy', color: G.danger, bg: G.dangerLight },
                    };
                    const st = statusMap[s.trang_thai] || { label: s.trang_thai, color: colors.textMuted, bg: colors.surfaceVariant };
                    const isEditing = editingNote?.id === s.id;
                    return (
                      <View key={s.id} style={[styles.scheduleItem, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                        {/* Ngày + giờ + badge */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.scheduleDate, { color: colors.text }]}>{s.ngay_tap ? new Date(s.ngay_tap).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}</Text>
                            <Text style={[styles.scheduleTime, { color: colors.textMuted }]}>{s.gio_bat_dau || '?'}–{s.gio_ket_thuc || '?'}</Text>
                          </View>
                          <View style={[styles.scheduleBadge, { backgroundColor: st.bg }]}>
                            <Text style={[styles.scheduleBadgeText, { color: st.color }]}>{st.label}</Text>
                          </View>
                        </View>

                        {/* Ghi chú hiện tại */}
                        {s.ghi_chu && !isEditing ? (
                          <View style={[styles.noteBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <MessageSquare color={colors.textMuted} size={13} strokeWidth={2} />
                            <Text style={[styles.noteBoxText, { color: colors.text }]}>{s.ghi_chu}</Text>
                          </View>
                        ) : null}

                        {/* Nút thêm/sửa ghi chú */}
                        {!isEditing ? (
                          <TouchableOpacity
                            style={styles.noteAddBtn}
                            onPress={() => { setEditingNote(s); setNoteText(s.ghi_chu || ''); }}
                            activeOpacity={0.7}
                          >
                            <MessageSquare color={colors.primary} size={13} strokeWidth={2} />
                            <Text style={[styles.noteAddBtnText, { color: colors.primary }]}>{s.ghi_chu ? 'Sửa ghi chú' : 'Thêm ghi chú'}</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Modal Chi tiết gói hội viên ────────────────────── */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { backgroundColor: G.primaryDark }]}>
              <Text style={[styles.modalTitle, { color: G.white }]}>Chi tiết gói hội viên</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Text style={[styles.modalCloseX, { color: G.white }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {selectedDetailPkg && (
                <View style={{ gap: 12 }}>
                  <View style={{ alignItems: 'center', marginVertical: 10 }}>
                    <View style={[styles.packageIconBox, { backgroundColor: G.primaryLight, width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' }]}>
                      <Award color={G.primary} size={32} />
                    </View>
                    <Text style={[styles.contractPackageName, { color: colors.text, marginTop: 8, fontSize: 20, textAlign: 'center' }]}>
                      {selectedDetailPkg.ten_goi}
                    </Text>
                    <View style={[
                      styles.contractBadge,
                      selectedDetailPkg.trang_thai === 'dang_hoat_dong' ? { backgroundColor: '#dcfce7' } : { backgroundColor: G.warningLight },
                      { marginTop: 4 }
                    ]}>
                      {selectedDetailPkg.trang_thai === 'dang_hoat_dong' ? (
                        <>
                          <ShieldCheck color={G.primary} size={12} strokeWidth={2.5} />
                          <Text style={styles.contractBadgeText}>Đang hoạt động</Text>
                        </>
                      ) : (
                        <>
                          <Clock color={G.warning} size={12} strokeWidth={2.5} />
                          <Text style={[styles.contractBadgeText, { color: G.warning }]}>Chờ duyệt thanh toán</Text>
                        </>
                      )}
                    </View>
                  </View>

                  <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Thời lượng gói:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{selectedDetailPkg.so_thang} tháng</Text>
                  </View>

                  <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Giá thanh toán:</Text>
                    <Text style={[styles.detailValue, { color: colors.text, fontWeight: '700' }]}>
                      {formatPrice(selectedDetailPkg.gia_thuc_te)}
                    </Text>
                  </View>

                  <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Ngày bắt đầu:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(selectedDetailPkg.tu_ngay)}</Text>
                  </View>

                  <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Ngày hết hạn:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(selectedDetailPkg.den_ngay)}</Text>
                  </View>

                  {selectedDetailPkg.trang_thai === 'dang_hoat_dong' && remaining !== null && (
                    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Thời gian còn lại:</Text>
                      <Text style={[styles.detailValue, { color: remaining <= 7 ? G.danger : colors.primary, fontWeight: '700' }]}>
                        {remaining} ngày
                      </Text>
                    </View>
                  )}

                  <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 10, lineHeight: 16 }}>
                    {selectedDetailPkg.trang_thai === 'cho_duyet'
                      ? 'Yêu cầu đang được chờ phê duyệt. Vui lòng liên hệ quầy lễ tân để thanh toán.'
                      : 'Chúc bạn có những giờ phút tập luyện tuyệt vời tại Paradise GYM!'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setDetailModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.textMuted }]}>Đóng</Text>
              </TouchableOpacity>
              {selectedDetailPkg?.trang_thai === 'dang_hoat_dong' && (
                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={() => {
                    setDetailModalVisible(false);
                    openRenewModal();
                  }}
                >
                  <Text style={styles.modalSubmitText}>Gia hạn gói</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal Số buổi PT còn lại ────────────────────── */}
      <Modal
        visible={remainingPtVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRemainingPtVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { backgroundColor: '#b7791f' }]}>
              <Text style={[styles.modalTitle, { color: G.white }]}>Số buổi PT còn lại</Text>
              <TouchableOpacity onPress={() => setRemainingPtVisible(false)}>
                <Text style={[styles.modalCloseX, { color: G.white }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {activePT ? (
                <View style={{ gap: 12 }}>
                  {/* Trainer Avatar & Info */}
                  <View style={{ alignItems: 'center', marginVertical: 10 }}>
                    <View style={{ width: 64, height: 64, borderRadius: 32, overflow: 'hidden', borderWidth: 2, borderColor: '#b7791f', marginBottom: 8 }}>
                      <ProfileAvatar
                        uri={activePT.avatar_pt}
                        name={activePT.ten_pt}
                        size={64}
                      />
                    </View>
                    <Text style={[styles.contractPackageName, { color: colors.text, fontSize: 18, fontWeight: '800' }]}>
                      HLV: {activePT.ten_pt}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                      {activePT.ten_goi_pt || 'Gói Huấn Luyện Viên Cá Nhân'}
                    </Text>
                  </View>

                  {/* Remaining Progress Bar */}
                  <View style={{ backgroundColor: colors.surfaceVariant, borderRadius: 14, padding: 16, gap: 12, borderWidth: 1, borderColor: colors.border }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Tiến độ gói tập</Text>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#b7791f' }}>
                        Còn {ptRemaining} / {activePT.so_buoi_dang_ky || 0} buổi
                      </Text>
                    </View>

                    {/* Progress Bar Container */}
                    <View style={{ height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden' }}>
                      <View
                        style={{
                          height: '100%',
                          backgroundColor: '#b7791f',
                          width: `${((activePT.so_buoi_da_tap || 0) / (activePT.so_buoi_dang_ky || 1)) * 100}%`
                        }}
                      />
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>Đã tập: {activePT.so_buoi_da_tap || 0} buổi</Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>Đăng ký: {activePT.so_buoi_dang_ky || 0} buổi</Text>
                    </View>
                  </View>

                  {/* Dates */}
                  {activePT.tu_ngay && (
                    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Ngày bắt đầu:</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(activePT.tu_ngay)}</Text>
                    </View>
                  )}

                  {activePT.den_ngay && (
                    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Ngày hết hạn:</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(activePT.den_ngay)}</Text>
                    </View>
                  )}

                  {activePT.gia_thuc_te != null && (
                    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Chi phí gói:</Text>
                      <Text style={[styles.detailValue, { color: colors.text, fontWeight: '700' }]}>
                        {formatPrice(activePT.gia_thuc_te)}
                      </Text>
                    </View>
                  )}

                  <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 10, lineHeight: 16 }}>
                    {ptRemaining === 0
                      ? 'Bạn đã hoàn thành toàn bộ số buổi của hợp đồng. Vui lòng liên hệ quầy lễ tân để gia hạn.'
                      : 'Hãy tích cực tập luyện cùng PT để đạt mục tiêu sức khỏe của bạn!'}
                  </Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 20, gap: 10 }}>
                  <Dumbbell color={colors.textMuted} size={48} strokeWidth={1.5} />
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15, marginTop: 8 }}>Chưa có gói tập PT</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
                    Bạn chưa đăng ký gói tập huấn luyện viên cá nhân (PT) nào đang hoạt động hoặc gói tập đã hoàn thành.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border, flex: 1 }]}
                onPress={() => setRemainingPtVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.textMuted, textAlign: 'center' }]}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal PayOS VietQR ─────────────────────────── */}
      <Modal
        visible={payosModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => {
          setPayosModalVisible(false);
          setPollingActive(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.qrSheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.qrHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.qrTitle, { color: colors.text }]}>Thanh toán chuyển khoản</Text>
              <TouchableOpacity onPress={() => {
                setPayosModalVisible(false);
                setPollingActive(false);
                Alert.alert('Thanh toán chưa hoàn tất', 'Yêu cầu gia hạn của bạn vẫn đang ở trạng thái Chờ thanh toán. Bạn có thể thanh toán sau.');
              }}>
                <XCircle color={colors.textMuted} size={24} />
              </TouchableOpacity>
            </View>

            {paymentInfo?.qrCodeUrl ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.qrScroll}>
                <Text style={[styles.qrHint, { color: colors.textMuted }]}>
                  Sử dụng ứng dụng ngân hàng quét mã QR dưới đây để tự động điền số tiền và nội dung chuyển khoản.
                </Text>

                {/* QR Code Container */}
                <View style={[styles.qrWrapper, { backgroundColor: '#ffffff' }]}>
                  <Image
                    source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentInfo.qrCodeUrl)}` }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                  <View style={[styles.qrBadge, { backgroundColor: colors.primaryLight }]}>
                    <CheckCircle2 color={colors.primary} size={14} />
                    <Text style={[styles.qrBadgeText, { color: colors.primary }]}>PAYOS SECURE</Text>
                  </View>
                </View>

                {/* Thông tin tài khoản */}
                <View style={[styles.qrDetails, { backgroundColor: colors.surfaceVariant }]}>
                  <View style={styles.qrDetailRow}>
                    <Text style={[styles.qrDetailLabel, { color: colors.textMuted }]}>Số tiền thanh toán:</Text>
                    <Text style={[styles.qrDetailValue, { color: colors.text }]}>{formatPrice(paymentInfo.amount)}</Text>
                  </View>
                  <View style={styles.qrDetailRow}>
                    <Text style={[styles.qrDetailLabel, { color: colors.textMuted }]}>Mã đơn hàng:</Text>
                    <Text style={[styles.qrDetailValue, { color: colors.text }]}>{paymentInfo.orderCode}</Text>
                  </View>
                </View>

                <View style={styles.pollingStatus}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.pollingStatusText, { color: colors.textSecondary, fontWeight: '700' }]}>
                    Đang chờ thanh toán ({Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')})...
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.qrCancelBtn, { borderColor: colors.border }]}
                  onPress={() => {
                    setPayosModalVisible(false);
                    setPollingActive(false);
                  }}
                >
                  <Text style={[styles.qrCancelBtnText, { color: colors.textSecondary }]}>Đóng</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <View style={styles.qrLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 12, color: colors.text }}>Đang tải mã QR PayOS...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Modal Nội dung phòng tập ────────────────────── */}
      <Modal
        visible={gymInfoVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGymInfoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, maxHeight: '92%' }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { backgroundColor: G.primaryDark }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Paradise GYM</Text>
                <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 11, marginTop: 2 }}>
                  Thông tin phòng tập
                </Text>
              </View>
              <TouchableOpacity onPress={() => setGymInfoVisible(false)}>
                <Text style={styles.modalCloseX}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }} showsVerticalScrollIndicator={false}>
              {/* Stats nổi bật */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {[
                  { icon: Users, label: 'Hội viên', value: '200+', color: '#0891b2' },
                  { icon: Dumbbell, label: 'Huấn luyện viên', value: '15+', color: G.primary },
                  { icon: Award, label: 'Năm hoạt động', value: '3+', color: '#b7791f' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <View key={label} style={[styles.gymStatCard, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, flex: 1 }]}>
                    <Icon color={color} size={20} strokeWidth={2} />
                    <Text style={[styles.gymStatValue, { color: colors.text }]}>{value}</Text>
                    <Text style={[styles.gymStatLabel, { color: colors.textMuted }]}>{label}</Text>
                  </View>
                ))}
              </View>

              {/* Địa chỉ & Liên hệ */}
              <View style={[styles.gymInfoSection, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                <Text style={[styles.gymInfoSectionTitle, { color: colors.text }]}>Địa chỉ & Liên hệ</Text>
                <View style={styles.gymInfoRow}>
                  <MapPin color={colors.primary} size={15} strokeWidth={2} />
                  <Text style={[styles.gymInfoRowText, { color: colors.text }]}>123 Đường ABC, Phường XYZ, Quận 1, TP.HCM</Text>
                </View>
                <View style={styles.gymInfoRow}>
                  <Phone color={colors.primary} size={15} strokeWidth={2} />
                  <Text style={[styles.gymInfoRowText, { color: colors.text }]}>028 1234 5678  •  0901 234 567</Text>
                </View>
                <View style={styles.gymInfoRow}>
                  <Clock color={colors.primary} size={15} strokeWidth={2} />
                  <Text style={[styles.gymInfoRowText, { color: colors.text }]}>Giờ mở cửa: 5:00 – 22:00 (Thứ 2 – CN)</Text>
                </View>
              </View>

              {/* Tiện ích phòng tập */}
              <View style={[styles.gymInfoSection, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                <Text style={[styles.gymInfoSectionTitle, { color: colors.text }]}>Tiện ích & Thiết bị</Text>
                {[
                  'Hơn 100 máy tập thể hình cao cấp nhập khẩu',
                  'Khu cardio hiện đại: xe đạp, máy chạy bộ, elliptical',
                  'Phòng tập nhóm: Yoga, Zumba, Boxing, Aerobics',
                  'Phòng tắm, tủ đồ cá nhân miễn phí',
                  'Bãi giữ xe rộng rãi, miễn phí',
                  'WiFi miễn phí toàn khu vực',
                  'Hệ thống âm thanh, ánh sáng chuyên nghiệp',
                  'Camera an ninh 24/7',
                ].map((item, i) => (
                  <View key={i} style={styles.gymBulletRow}>
                    <View style={[styles.gymBulletDot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.gymBulletText, { color: colors.text }]}>{item}</Text>
                  </View>
                ))}
              </View>

              {/* Dịch vụ */}
              <View style={[styles.gymInfoSection, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                <Text style={[styles.gymInfoSectionTitle, { color: colors.text }]}>Dịch vụ nổi bật</Text>
                {[
                  'Huấn luyện viên cá nhân (PT) chuyên nghiệp',
                  'Tư vấn dinh dưỡng & kế hoạch tập luyện',
                  'Đo chỉ số cơ thể (BMI, BF%) miễn phí',
                  'Theo dõi tiến độ tập luyện qua app',
                  'Lớp tập nhóm đa dạng không phụ phí',
                  'Chương trình khuyến mãi thành viên thân thiết',
                ].map((item, i) => (
                  <View key={i} style={styles.gymBulletRow}>
                    <Star color={G.primaryMid} size={12} strokeWidth={2.5} fill={G.primaryMid} />
                    <Text style={[styles.gymBulletText, { color: colors.text }]}>{item}</Text>
                  </View>
                ))}
              </View>

              {/* Nội quy */}
              <View style={[styles.gymInfoSection, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                <Text style={[styles.gymInfoSectionTitle, { color: colors.text }]}>Nội quy phòng tập</Text>
                {[
                  'Mang theo thẻ hội viên khi vào tập',
                  'Mặc trang phục thể thao phù hợp',
                  'Hoàn trả dụng cụ sau khi dùng xong',
                  'Giữ vệ sinh chung, không hút thuốc',
                  'Không mang thức ăn vào khu vực tập',
                  'Tôn trọng giờ nghỉ của hội viên khác',
                ].map((item, i) => (
                  <View key={i} style={styles.gymBulletRow}>
                    <CheckCircle2 color={G.primary} size={13} strokeWidth={2.5} />
                    <Text style={[styles.gymBulletText, { color: colors.text }]}>{item}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.gymInfoCloseBtn, { backgroundColor: G.primaryDark }]}
                onPress={() => setGymInfoVisible(false)}
              >
                <Text style={{ color: G.white, fontWeight: '800', fontSize: 15 }}>Đóng</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Modal Toàn bộ gói tập (Xem thêm) ────────────────── */}
      <Modal
        visible={allPackagesModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAllPackagesModalVisible(false)}
      >
        <View style={styles.bottomSheetOverlay}>
          <View style={[styles.modalContent, styles.bottomSheetContent, { backgroundColor: colors.surface, maxHeight: '85%' }]}>
            <View style={[styles.modalHeader, { backgroundColor: colors.isDark ? colors.statusBarBg : '#3a5f43' }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Danh sách gói tập</Text>
                <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 }}>
                  Tất cả các gói tập Gym & PT hiện có tại Paradise GYM
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAllPackagesModalVisible(false)}>
                <Text style={styles.modalCloseX}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
                {allPackages.map((item, i) => {
                  const cardBg = colors.isDark ? colors.surfaceVariant : [colors.primaryLight, '#e8f4fd', '#fef9e7', '#f3e8ff'][i % 4];
                  const accentColor = colors.isDark ? colors.primary : [G.primary, '#1565c0', '#b7791f', '#7c3aed'][i % 4];
                  return (
                    <TouchableOpacity
                      key={item._key}
                      style={{
                        width: '48%',
                        backgroundColor: cardBg,
                        borderWidth: colors.isDark ? 1 : 0,
                        borderColor: colors.isDark ? colors.border : 'transparent',
                        padding: 16,
                        borderRadius: 16,
                        minHeight: 120,
                        justifyContent: 'space-between'
                      }}
                      onPress={() => {
                        setAllPackagesModalVisible(false);
                        if (item.loai_goi !== 'pt' && item.loai_goi !== 'theo_buoi') {
                          navigation.navigate('PackageDetail', { packageItem: item, profile });
                        } else {
                          Alert.alert('Thông báo', `Đây là gói Huấn Luyện Viên cá nhân (PT).\nVui lòng liên hệ quầy lễ tân để đăng ký tập với HLV.`);
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <View>
                        <View style={styles.pkgCardBrandRow}>
                          <Dumbbell color={accentColor} size={11} strokeWidth={2.5} />
                          <Text style={[styles.pkgCardBrandText, { color: accentColor }]}>PARADISE GYM</Text>
                        </View>
                        <Text style={[styles.packageNameText, { color: colors.text }]} numberOfLines={2}>
                          {item.ten_goi}
                        </Text>
                      </View>
                      <View style={{ marginTop: 8 }}>
                        <Text style={[styles.packagePriceText, { color: accentColor, fontSize: 15 }]}>
                          {formatPrice(item.gia)}
                        </Text>
                        <View style={[styles.pkgCardBadge, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                          <Text style={[styles.pkgCardBadgeText, { color: colors.textSecondary, fontSize: 9 }]}>
                            {item.loai_goi === 'pt' ? 'Gói PT' : 'Gói Gym'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ── StyleSheet ────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: G.gray50 },
  scrollContent: { paddingBottom: 24 },

  // Banner
  banner: {
    backgroundColor: G.primaryDark,
    paddingTop: 52,
    paddingBottom: 28,
    paddingHorizontal: 20,
    overflow: 'hidden',
    position: 'relative',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  sunRay: {
    position: 'absolute',
    width: 2,
    height: 280,
    backgroundColor: 'rgba(255,255,255,0.045)',
    top: -40,
    left: '50%',
    transformOrigin: 'bottom center',
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bannerAvatar: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 24,
    overflow: 'hidden',
  },
  bannerGreeting: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  bannerName: { fontSize: 15, color: G.white, fontWeight: '700', maxWidth: 160 },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  bannerBadgeText: { color: G.white, fontSize: 11, fontWeight: '700' },
  bannerBody: { alignItems: 'center' },
  bannerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: G.white,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Alerts
  alertSection: { paddingHorizontal: 16, paddingTop: 14, gap: 8 },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
  },
  alertTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  alertBody: { fontSize: 12, lineHeight: 17, opacity: 0.85 },

  // Section
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: G.white,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
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
  sectionTitle: { fontSize: 16, fontWeight: '800', color: G.gray900, flex: 1 },
  branchLabel: { fontSize: 11, color: G.gray400, maxWidth: 130, textAlign: 'right' },

  // Contract card
  loadingBox: { paddingVertical: 20, alignItems: 'center' },
  contractCard: {
    backgroundColor: G.primaryLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: G.gray200,
  },
  contractTop: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  contractBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  contractBadgeText: { fontSize: 10, fontWeight: '700', color: G.primary },
  contractPackageName: {
    fontSize: 18,
    fontWeight: '800',
    color: G.gray900,
    marginBottom: 12,
  },
  contractGrid: {
    flexDirection: 'row',
    backgroundColor: G.white,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  contractGridItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    gap: 3,
  },
  contractDivider: { width: 1, backgroundColor: G.gray200 },
  contractGridLabel: { fontSize: 11, color: G.gray400, fontWeight: '500' },
  contractGridValue: { fontSize: 13, fontWeight: '700', color: G.gray700 },
  ptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: G.white,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: G.primary + '25',
  },
  ptRowText: { fontSize: 13, color: G.gray500, flex: 1, lineHeight: 18 },
  emptyContract: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  emptyContractText: { fontSize: 15, fontWeight: '700', color: G.gray500 },
  emptyContractSub: { fontSize: 12, color: G.gray400 },

  // Utility chips
  utilGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-start' },
  utilChip: {
    width: '30%',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
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

  // Package cards — tăng size lên 1 bậc
  packageScroll: { paddingRight: 4, gap: 10 },
  packageCard: {
    width: 155,
    padding: 16,
    borderRadius: 16,
    gap: 7,
  },
  packageIconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  packageName: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  packagePrice: { fontSize: 18, fontWeight: '800' },
  packageSub: { fontSize: 12, color: G.gray400, fontWeight: '500' },

  // PT Schedule modal
  scheduleItem: {
    backgroundColor: G.gray50,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: G.gray200,
  },
  scheduleDate: { fontSize: 14, fontWeight: '700', color: G.gray900 },
  scheduleTime: { fontSize: 12, color: G.gray500, marginTop: 1 },
  scheduleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  scheduleBadgeText: { fontSize: 11, fontWeight: '700' },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: G.white,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: G.gray200,
    marginBottom: 8,
  },
  noteBoxText: { fontSize: 13, color: G.gray700, flex: 1, lineHeight: 18 },
  noteAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: G.primaryLight,
    borderWidth: 1,
    borderColor: G.primary + '30',
  },
  noteAddBtnText: { fontSize: 12, fontWeight: '700', color: G.primary },
  noteEditor: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: G.gray50,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: G.primary + '40',
  },
  noteEditorLabel: { fontSize: 11, fontWeight: '700', color: G.primary, marginBottom: 8, textTransform: 'uppercase' },
  noteInput: {
    backgroundColor: G.white,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: G.gray900,
    borderWidth: 1,
    borderColor: G.gray200,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  noteBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Paradise panel
  paradisePanel: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  paradisePanelInner: {
    backgroundColor: G.primaryDark,
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  paradiseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  paradiseBadgeText: { color: G.white, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  paradiseTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: G.white,
    marginBottom: 6,
  },
  paradiseDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
    marginBottom: 18,
  },
  paradiseStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  paradiseStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  paradiseStatValue: { fontSize: 18, fontWeight: '800', color: G.white },
  paradiseStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },

  // Renewal & Modal
  renewButton: {
    backgroundColor: G.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 14,
    shadowColor: G.primary,
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  renewButtonText: { color: G.white, fontWeight: '800', fontSize: 14 },

  // Thẻ yêu cầu đang chờ duyệt — thay thế nút disabled bị đóng băng
  pendingRequestCard: {
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fbbf24',
    padding: 12,
    gap: 6,
  },
  pendingRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pendingRequestTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
  },
  pendingRequestPkg: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1c1917',
  },
  pendingRequestInfo: {
    fontSize: 11,
    color: '#78716c',
    fontWeight: '500',
  },
  cancelRequestBtn: {
    marginTop: 8,
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  cancelRequestBtnText: {
    color: G.white,
    fontWeight: '800',
    fontSize: 13,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: G.white,
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    backgroundColor: G.primary,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { color: G.white, fontSize: 18, fontWeight: '800' },
  modalCloseX: { color: G.white, fontSize: 20, fontWeight: '300' },
  modalBody: { padding: 20 },
  inputLabel: { fontSize: 12, color: G.gray500, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  pkgPicker: { gap: 8 },
  pkgOption: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: G.gray200,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pkgOptionActive: { borderColor: G.primary, backgroundColor: G.primaryLight },
  pkgOptionText: { fontSize: 14, color: G.gray700, fontWeight: '600' },
  pkgOptionTextActive: { color: G.primaryDark },
  pkgOptionPrice: { fontSize: 14, fontWeight: '700', color: G.gray900 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  dateInput: {
    backgroundColor: G.gray100,
    padding: 12,
    borderRadius: 12,
    fontSize: 15,
    fontWeight: '600',
    color: G.gray900,
  },
  inputHint: { fontSize: 11, color: G.gray400, marginTop: 6 },
  modalFooter: {
    padding: 20,
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: G.gray100,
  },
  modalCancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  modalCancelText: { color: G.gray500, fontWeight: '700' },
  modalSubmitBtn: {
    flex: 2,
    backgroundColor: G.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: G.primary,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  modalSubmitText: { color: G.white, fontWeight: '800', fontSize: 15 },

  // Nút Thanh toán ngay PayOS
  payNowBtn: {
    marginTop: 8,
    backgroundColor: G.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  payNowBtnText: {
    color: G.white,
    fontWeight: '800',
    fontSize: 13,
  },

  // Premium Package Card Styles
  pkgCardBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  pkgCardBrandText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  packageNameText: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
    marginVertical: 2,
  },
  packagePriceText: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 'auto',
  },
  pkgCardBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  pkgCardBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // PayOS QR Modal Styles
  qrSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '850',
  },
  qrScroll: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  qrHint: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  qrWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 16,
    position: 'relative',
  },
  qrImage: {
    width: 240,
    height: 240,
  },
  qrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 10,
  },
  qrBadgeText: {
    fontSize: 10,
    fontWeight: '850',
    letterSpacing: 0.5,
  },
  qrDetails: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    marginBottom: 20,
  },
  qrDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qrDetailLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  qrDetailValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  pollingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  pollingStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  qrCancelBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  qrLoading: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Gym Info Card (tappable banner)
  gymInfoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: G.primaryDark,
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
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
  },
});
