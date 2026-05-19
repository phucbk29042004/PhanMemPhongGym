import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl, ScrollView,
  StatusBar, StyleSheet, Text, TouchableOpacity, View,
  Modal, TextInput, Platform, KeyboardAvoidingView,
} from 'react-native';
import {
  Award, CalendarCheck, ChevronRight, Clock,
  CreditCard, Dumbbell, QrCode, ShieldCheck,
  TrendingUp, Users, Zap, MessageSquare, CheckCircle2, XCircle, ChevronDown,
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
function PackageCard({ item, index, colors, onPress }) {
  const isPT = item.loai_goi === 'pt' || item.loai_goi === 'theo_buoi';
  const isDark = colors?.isDark;
  const cardBg = isDark ? colors.surfaceVariant : [G.primaryLight, '#e8f4fd', '#fef9e7', '#f3e8ff'][index % 4];
  const accentColor = isDark ? colors.primary : [G.primary, '#1565c0', '#b7791f', '#7c3aed'][index % 4];

  return (
    <TouchableOpacity 
      style={[styles.packageCard, { backgroundColor: cardBg }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.packageIconBox, { backgroundColor: accentColor + '22' }]}>
        {isPT ? <Users color={accentColor} size={24} strokeWidth={2} /> : <Award color={accentColor} size={24} strokeWidth={2} />}
      </View>
      <Text style={[styles.packageName, { color: accentColor }]} numberOfLines={2}>{item.ten_goi}</Text>
      <Text style={[styles.packagePrice, { color: colors?.text || G.gray900 }]}>{formatPrice(item.gia)}</Text>
      {item.so_thang ? (
        <Text style={[styles.packageSub, { color: colors?.textMuted || G.gray500 }]}>{item.so_thang} tháng{item.so_ngay_them > 0 ? ` +${item.so_ngay_them} ngày` : ''}</Text>
      ) : item.so_buoi ? (
        <Text style={[styles.packageSub, { color: colors?.textMuted || G.gray500 }]}>{item.so_buoi} buổi</Text>
      ) : null}
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
  const [renewModalVisible, setRenewModalVisible] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [renewalStartDate, setRenewalStartDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── State modal lịch PT ───────────────────────────────────
  const [ptScheduleVisible, setPtScheduleVisible] = useState(false);
  const [ptSchedules, setPtSchedules] = useState([]);
  const [ptScheduleLoading, setPtScheduleLoading] = useState(false);
  const [editingNote, setEditingNote] = useState(null); // { id, ghi_chu }
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

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
    const today = new Date().toISOString().split('T')[0];
    let defaultStart = today;
    
    const active = profile?.goi_tap?.[0];
    if (active && active.den_ngay >= today) {
      const d = new Date(active.den_ngay);
      d.setDate(d.getDate() + 1);
      defaultStart = d.toISOString().split('T')[0];
    }
    
    setRenewalStartDate(defaultStart);
    setSelectedPkg(gymPackages[0]?.id || null);
    setRenewModalVisible(true);
  };

  const submitRenewal = async () => {
    if (!selectedPkg || !renewalStartDate) return;
    setIsSubmitting(true);
    try {
      const res = await api.post('/members/me/package-request', {
        goi_tap_id: selectedPkg,
        tu_ngay: renewalStartDate
      });
      if (res.data?.success) {
        setRenewModalVisible(false);
        fetchAll();
        alert('Đã gửi yêu cầu gia hạn! Vui lòng liên hệ lễ tân để hoàn tất thanh toán.');
      } else {
        alert(res.data?.message || 'Lỗi khi gửi yêu cầu');
      }
    } catch (e) {
      console.log('Submit Renewal Error:', e);
      const msg = e.response?.data?.message || 'Lỗi kết nối máy chủ';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Dữ liệu đã xử lý ─────────────────────────────────────
  const activePlan = profile?.goi_tap?.find(p => p.trang_thai === 'dang_hoat_dong') || null;
  const pendingPlan = profile?.goi_tap?.find(p => p.trang_thai === 'cho_duyet') || null;
  const currentPlan = activePlan || pendingPlan;
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[G.primary]} tintColor={G.primary} />}
        contentContainerStyle={styles.scrollContent}
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
            <View style={styles.bannerBadge}>
              <ShieldCheck color={G.white} size={14} strokeWidth={2} />
              <Text style={styles.bannerBadgeText}>
                {profile?.loai_hv === 'vip' ? 'VIP' : profile?.loai_hv === 'premium' ? 'Premium' : 'Standard'}
              </Text>
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
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.primary} size="small" />
            </View>
          ) : currentPlan ? (
            <TouchableOpacity 
              style={[styles.contractCard, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
              onPress={() => {
                setSelectedDetailPkg(currentPlan);
                setDetailModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              {/* Trạng thái + tên gói */}
              <View style={styles.contractTop}>
                {activePlan ? (
                  <View style={styles.contractBadge}>
                    <ShieldCheck color={colors.primary} size={12} strokeWidth={2.5} />
                    <Text style={styles.contractBadgeText}>Đang hoạt động</Text>
                  </View>
                ) : null}
                {pendingPlan ? (
                  <View style={[styles.contractBadge, { backgroundColor: G.warningLight }]}>
                    <Clock color={G.warning} size={12} strokeWidth={2.5} />
                    <Text style={[styles.contractBadgeText, { color: G.warning }]}>Đang chờ duyệt</Text>
                  </View>
                ) : null}
                {remaining !== null && remaining <= 7 && activePlan && (
                  <View style={[styles.contractBadge, { backgroundColor: G.dangerLight }]}>
                    <Clock color={G.danger} size={12} strokeWidth={2.5} />
                    <Text style={[styles.contractBadgeText, { color: G.danger }]}>Sắp hết hạn</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.contractPackageName, { color: colors.text }]}>{currentPlan.ten_goi}</Text>

              {/* Thông số grid */}
              <View style={[styles.contractGrid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.contractGridItem}>
                  <CalendarCheck color={colors.textMuted} size={14} strokeWidth={2} />
                  <Text style={[styles.contractGridLabel, { color: colors.textMuted }]}>Từ ngày</Text>
                  <Text style={[styles.contractGridValue, { color: colors.text }]}>{formatDate(currentPlan.tu_ngay)}</Text>
                </View>
                <View style={[styles.contractDivider, { backgroundColor: colors.border }]} />
                <View style={styles.contractGridItem}>
                  <Clock color={remaining !== null && remaining <= 7 && activePlan ? G.danger : colors.textMuted} size={14} strokeWidth={2} />
                  <Text style={[styles.contractGridLabel, { color: colors.textMuted }]}>Hết hạn</Text>
                  <Text style={[styles.contractGridValue, { color: colors.text }, remaining !== null && remaining <= 7 && activePlan && { color: G.danger }]}>
                    {formatDate(currentPlan.den_ngay)}
                  </Text>
                </View>
                <View style={[styles.contractDivider, { backgroundColor: colors.border }]} />
                <View style={styles.contractGridItem}>
                  <TrendingUp color={colors.primary} size={14} strokeWidth={2} />
                  <Text style={[styles.contractGridLabel, { color: colors.textMuted }]}>Còn lại</Text>
                  <Text style={[styles.contractGridValue, { color: remaining !== null && remaining <= 7 && activePlan ? G.danger : colors.primary }]}>
                    {remaining !== null && activePlan ? `${remaining} ngày` : '—'}
                  </Text>
                </View>
              </View>

              {/* HLV PT (nếu có) — bấm để xem lịch tập */}
              {activePT ? (
                <TouchableOpacity style={styles.ptRow} onPress={openPtSchedule} activeOpacity={0.75}>
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
              ) : null}

              {/* Nút gia hạn nếu hết hạn hoặc không có gói và KHÔNG CÓ yêu cầu chờ duyệt */}
              {(!activePlan || remaining === 0) && !pendingPlan && (
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
                <View style={[styles.renewButton, { backgroundColor: colors.border, shadowOpacity: 0 }]}>
                  <Clock color={colors.textMuted} size={16} strokeWidth={2.5} />
                  <Text style={[styles.renewButtonText, { color: colors.textMuted }]}>Đang xử lý yêu cầu...</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.emptyContract}
              onPress={openRenewModal}
              activeOpacity={0.7}
            >
              <CreditCard color={colors.textMuted} size={32} strokeWidth={1.5} />
              <Text style={[styles.emptyContractText, { color: colors.text }]}>Chưa đăng ký gói tập</Text>
              <Text style={[styles.emptyContractSub, { color: colors.textMuted }]}>Nhấn vào đây để xem các gói và đăng ký mua</Text>
              <TouchableOpacity 
                style={[styles.renewButton, { marginTop: 12, width: '60%' }]}
                onPress={openRenewModal}
                activeOpacity={0.8}
              >
                <Zap color={G.white} size={16} strokeWidth={2.5} />
                <Text style={styles.renewButtonText}>Mua gói ngay</Text>
              </TouchableOpacity>
            </TouchableOpacity>
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
              icon={Award}
              label={'Buổi PT\ncòn lại'}
              accent="#b7791f"
              onPress={() => navigation?.navigate?.('Schedule')}
              colors={colors}
            />
          </View>
        </View>

        {/* ──────────────────── */}
        {/* GÓI HỘI VIÊN THỰC TẾ */}
        {/* ──────────────────── */}
        {!loading && allPackages.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBox, { backgroundColor: colors.primaryLight }]}>
                <Award color={colors.primary} size={18} strokeWidth={2} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Gói Hội Viên</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.packageScroll}
            >
              {allPackages.map((item, i) => (
                <PackageCard 
                  key={item._key} 
                  item={item} 
                  index={i} 
                  colors={colors} 
                  onPress={() => {
                    if (item.loai_goi !== 'pt' && item.loai_goi !== 'theo_buoi') {
                      setSelectedPkg(item.id);
                      const today = new Date().toISOString().split('T')[0];
                      let defaultStart = today;
                      const active = profile?.goi_tap?.[0];
                      if (active && active.den_ngay >= today) {
                        const d = new Date(active.den_ngay);
                        d.setDate(d.getDate() + 1);
                        defaultStart = d.toISOString().split('T')[0];
                      }
                      setRenewalStartDate(defaultStart);
                      setRenewModalVisible(true);
                    } else {
                      alert(`Đây là gói Huấn Luyện Viên cá nhân (PT).\nVui lòng liên hệ quầy lễ tân để đăng ký tập với HLV.`);
                    }
                  }}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ──────────────────────────── */}
        {/* PANEL PARADISE GYM          */}
        {/* ──────────────────────────── */}
        <View style={[styles.paradisePanel, { backgroundColor: colors.surfaceVariant }]}>
          <View style={[styles.paradisePanelInner, { backgroundColor: colors.surface }]}>
            <View style={styles.paradiseBadge}>
              <ShieldCheck color={G.white} size={12} strokeWidth={2} />
              <Text style={styles.paradiseBadgeText}>PREMIUM GYM</Text>
            </View>
            <Text style={[styles.paradiseTitle, { color: colors.text }]}>Paradise GYM</Text>
            <Text style={[styles.paradiseDesc, { color: colors.textMuted }]}>
              Không gian hiện đại · Huấn luyện viên chuyên nghiệp · Thiết bị cao cấp
            </Text>
            <View style={styles.paradiseStats}>
              {[
                { icon: Users, label: 'Hội viên', value: '500+' },
                { icon: Dumbbell, label: 'Huấn luyện viên', value: '20+' },
                { icon: Award, label: 'Năm hoạt động', value: '5+' },
              ].map(({ icon: Icon, label, value }) => (
                <View key={label} style={styles.paradiseStat}>
                  <Icon color={G.primaryMid} size={18} strokeWidth={2} />
                  <Text style={[styles.paradiseStatValue, { color: colors.text }]}>{value}</Text>
                  <Text style={[styles.paradiseStatLabel, { color: colors.textMuted }]}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ── Modal Lịch tập PT ──────────────────────────────── */}
      <Modal
        visible={ptScheduleVisible}
        transparent
        animationType="slide"
        onRequestClose={() => { setPtScheduleVisible(false); setEditingNote(null); }}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface, maxHeight: '88%' }]}>
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
                      cho_tap:  { label: 'Chờ tập',      color: G.warning,  bg: G.warningLight },
                      da_tap:   { label: 'Đã hoàn thành', color: colors.primary,  bg: colors.primaryLight },
                      da_huy:   { label: 'Đã hủy',        color: G.danger,   bg: G.dangerLight },
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

      {/* ── Modal Đăng ký/Gia hạn gói tập ────────────────────── */}
      <Modal
        visible={renewModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {activePlan ? 'Gia hạn gói tập' : 'Đăng ký gói tập'}
              </Text>
              <TouchableOpacity onPress={() => setRenewModalVisible(false)}>
                <Text style={[styles.modalCloseX, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Chọn gói tập</Text>
              <View style={styles.pkgPicker}>
                {gymPackages.map(p => (
                  <TouchableOpacity 
                    key={p.id} 
                    style={[
                      styles.pkgOption, 
                      { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                      selectedPkg === p.id && { borderColor: colors.primary, backgroundColor: colors.primaryLight }
                    ]}
                    onPress={() => setSelectedPkg(p.id)}
                  >
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={[
                        styles.pkgOptionText, 
                        { color: colors.text },
                        selectedPkg === p.id && { color: colors.primary, fontWeight: '700' }
                      ]}>{p.ten_goi}</Text>
                      {p.mo_ta ? (
                        <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }} numberOfLines={2}>
                          {p.mo_ta}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={[
                      styles.pkgOptionPrice, 
                      { color: colors.textMuted },
                      selectedPkg === p.id && { color: colors.primary, fontWeight: '700' }
                    ]}>{formatPrice(p.gia)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { marginTop: 16, color: colors.text }]}>Ngày bắt đầu (YYYY-MM-DD)</Text>
              <TextInput
                style={[styles.dateInput, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, color: colors.text }]}
                value={renewalStartDate}
                onChangeText={setRenewalStartDate}
                placeholder="2024-01-01"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={[styles.inputHint, { color: colors.textMuted }]}>Mặc định: Ngày tiếp nối gói cũ hoặc hôm nay</Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: colors.border }]} onPress={() => setRenewModalVisible(false)}>
                <Text style={[styles.modalCancelText, { color: colors.textMuted }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSubmitBtn} 
                onPress={submitRenewal}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={G.white} size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>
                    {activePlan ? 'Gia hạn ngay' : 'Đăng ký mua'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
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
    paddingBottom: 24,
    paddingHorizontal: 20,
    overflow: 'hidden',
    position: 'relative',
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
});
