import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, RefreshControl, ScrollView,
  StatusBar, StyleSheet, Text, TouchableOpacity, View,
  FlatList, Modal, TextInput
} from 'react-native';
import {
  Award, Calendar, CalendarCheck, CheckCircle2, ChevronRight,
  Clock, CreditCard, Dumbbell, Shield, Trash2, Edit3, User,
  Users, Check, X, Phone, Mail, MapPin, Map, Building2, UserPlus, Bell
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import ProfileAvatar from '../../components/ProfileAvatar';
import { useAuthStore } from '../../store/useAuthStore';
import DatePickerField from '../../components/DatePickerField';

function formatPrice(val) {
  if (val == null) return '0đ';
  return Number(val).toLocaleString('vi-VN') + 'đ';
}

function formatDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AdminMemberDetailScreen({ route, navigation }) {
  const { memberId } = route.params;
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { role } = useAuthStore();
  const [member, setMember] = useState(null);
  const [history, setHistory] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [ptSchedules, setPtSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelingPackage, setCancelingPackage] = useState(false);
  const [cancelingPT, setCancelingPT] = useState(false);

  // States for inline editing
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editType, setEditType] = useState('gym'); // 'gym' | 'pt'
  const [editTuNgay, setEditTuNgay] = useState('');
  const [editDenNgay, setEditDenNgay] = useState('');
  const [editGiaThucTe, setEditGiaThucTe] = useState('');
  const [editSoBuoi, setEditSoBuoi] = useState(''); // PT only
  const [savingEdit, setSavingEdit] = useState(false);

  const handleEditPackageClick = () => {
    if (!activePkg) return;
    setEditType('gym');
    setEditTuNgay(activePkg.tu_ngay ? activePkg.tu_ngay.split('T')[0] : '');
    setEditDenNgay(activePkg.den_ngay ? activePkg.den_ngay.split('T')[0] : '');
    setEditGiaThucTe(String(activePkg.gia_thuc_te || 0));
    setEditModalVisible(true);
  };

  const handleEditPTClick = () => {
    if (!activePT) return;
    setEditType('pt');
    setEditTuNgay(activePT.tu_ngay ? activePT.tu_ngay.split('T')[0] : '');
    setEditDenNgay(activePT.den_ngay ? activePT.den_ngay.split('T')[0] : '');
    setEditGiaThucTe(String(activePT.gia_thuc_te || 0));
    setEditSoBuoi(String(activePT.buoi_dang_ky || 0));
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(editTuNgay) || (editDenNgay && !dateRegex.test(editDenNgay))) {
      Alert.alert('Lỗi', 'Ngày phải có định dạng YYYY-MM-DD (VD: 2026-05-28).');
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startD = new Date(editTuNgay);
    const endD = editDenNgay ? new Date(editDenNgay) : null;
    if (startD < today) {
      Alert.alert('Lỗi', 'Ngày bắt đầu không được ở quá khứ.');
      return;
    }
    if (endD && endD < today) {
      Alert.alert('Lỗi', 'Ngày kết thúc không được ở quá khứ.');
      return;
    }
    if (endD && endD <= startD) {
      Alert.alert('Lỗi', 'Ngày kết thúc phải sau ngày bắt đầu.');
      return;
    }
    const priceVal = Number(editGiaThucTe);
    if (isNaN(priceVal) || priceVal < 0) {
      Alert.alert('Lỗi', 'Giá thực tế không hợp lệ.');
      return;
    }

    setSavingEdit(true);
    try {
      if (editType === 'gym') {
        const activePackage = member?.goi_tap_hien_tai[0];
        const res = await api.patch(`/members/${memberId}/package/${activePackage.id}`, {
          tu_ngay: editTuNgay,
          den_ngay: editDenNgay,
          gia_thuc_te: priceVal
        });
        if (res.data?.success) {
          Alert.alert('Thành công', 'Đã cập nhật thông tin gói Gym.');
          setEditModalVisible(false);
          fetchDetail();
        } else {
          Alert.alert('Lỗi', res.data?.message || 'Không thể cập nhật gói Gym.');
        }
      } else {
        const activePT = member?.pt_hien_tai[0];
        const res = await api.put(`/pt/registrations/${activePT.id}`, {
          pt_id: activePT.pt_id,
          goi_pt_id: activePT.goi_pt_id,
          tu_ngay: editTuNgay,
          den_ngay: editDenNgay,
          gia_thuc_te: priceVal,
          so_buoi_dang_ky: Number(editSoBuoi)
        });
        if (res.data?.success) {
          Alert.alert('Thành công', 'Đã cập nhật thông tin gói PT.');
          setEditModalVisible(false);
          fetchDetail();
        } else {
          Alert.alert('Lỗi', res.data?.message || 'Không thể cập nhật gói PT.');
        }
      }
    } catch (err) {
      console.error('[AdminMemberDetail] edit error:', err?.message);
      Alert.alert('Lỗi', err.response?.data?.message || err?.message || 'Không thể cập nhật.');
    } finally {
      setSavingEdit(false);
    }
  };

  const fetchDetail = useCallback(async () => {
    try {
      const [detailRes, historyRes, checkinRes, scheduleRes] = await Promise.all([
        api.get(`/members/${memberId}`),
        api.get(`/members/${memberId}/history`),
        api.get(`/checkins?ho_so_id=${memberId}&date=all&limit=10`),
        api.get(`/pt/schedules?hoi_vien_id=${memberId}`)
      ]);

      if (detailRes.data?.success) {
        setMember(detailRes.data.data);
      }
      if (historyRes.data?.success) {
        setHistory(historyRes.data.data || []);
      }
      if (checkinRes.data?.success) {
        setCheckins(checkinRes.data.data || []);
      }
      if (scheduleRes.data?.success) {
        setPtSchedules(scheduleRes.data.data || []);
      }
    } catch (err) {
      console.error('[AdminMemberDetail] fetch error:', err?.message);
      Alert.alert('Lỗi', 'Không thể lấy thông tin chi tiết hội viên.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [memberId]);

  const handleCancelSchedule = (scheduleId) => {
    Alert.prompt(
      'Hủy lịch tập PT',
      'Nhập lý do hủy lịch:',
      async (reason) => {
        if (!reason || !reason.trim()) {
          Alert.alert('Lỗi', 'Vui lòng nhập lý do hủy lịch.');
          return;
        }
        try {
          const res = await api.put(`/pt/schedules/${scheduleId}/cancel`, { ly_do: reason.trim() });
          if (res.data?.success) {
            Alert.alert('Thành công', 'Đã hủy lịch tập.');
            fetchDetail();
          }
        } catch (err) {
          Alert.alert('Lỗi', err.response?.data?.message || err?.message || 'Không thể hủy lịch.');
        }
      }
    );
  };

  useFocusEffect(useCallback(() => {
    fetchDetail();
  }, [fetchDetail]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetail();
  };

  const handleNotifyRenew = async () => {
    const trangThai = member?.trang_thai;
    const isExpired = trangThai === 'het_han';
    const title = isExpired
      ? 'Gói tập của bạn đã hết hạn'
      : 'Gói tập của bạn sắp hết hạn';
    const body = isExpired
      ? `Xin chào ${member.ho_ten}, gói tập Gym của bạn đã hết hạn. Hãy ghé thăm phòng tập để gia hạn ngay hôm nay!`
      : `Xin chào ${member.ho_ten}, gói tập Gym của bạn sắp hết hạn. Hãy gia hạn để không bị gián đoạn lịch tập!`;

    Alert.alert(
      'Xác nhận gửi thông báo',
      `Gửi thông báo nhắc gia hạn đến hội viên ${member.ho_ten}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gửi ngay',
          onPress: async () => {
            try {
              const res = await api.post(`/members/${memberId}/notify`, { title, body });
              if (res.data?.success) {
                Alert.alert('Thành công', 'Đã gửi thông báo gia hạn đến hội viên.');
              } else {
                Alert.alert('Lỗi', res.data?.message || 'Không thể gửi thông báo.');
              }
            } catch (err) {
              Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể gửi thông báo.');
            }
          }
        }
      ]
    );
  };

  const handleCancelPackage = () => {
    if (!member?.goi_tap_hien_tai?.length) return;
    const activePackage = member.goi_tap_hien_tai[0];
    Alert.alert(
      'Xác nhận hủy gói',
      `Bạn có chắc chắn muốn hủy gói "${activePackage.ten_goi}" của ${member.ho_ten}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Hủy gói',
          style: 'destructive',
          onPress: async () => {
            setCancelingPackage(true);
            try {
              const res = await api.patch(`/members/${memberId}/package/${activePackage.id}/cancel`, {
                ly_do_huy: 'Hủy gói bởi Admin qua ứng dụng di động',
                so_tien_hoan: 0
              });
              if (res.data?.success) {
                Alert.alert('Thành công', 'Đã hủy gói tập của hội viên.');
                fetchDetail();
              } else {
                Alert.alert('Lỗi', res.data?.message || 'Không thể hủy gói này.');
              }
            } catch (err) {
              Alert.alert('Lỗi', err?.response?.data?.message || err?.message || 'Có lỗi khi hủy gói.');
            } finally {
              setCancelingPackage(false);
            }
          }
        }
      ]
    );
  };

  const handleCancelPT = () => {
    if (!member?.pt_hien_tai?.length) return;
    const activePT = member.pt_hien_tai[0];
    Alert.alert(
      'Xác nhận hủy PT',
      `Bạn có chắc chắn muốn hủy gói PT "${activePT.ten_goi_pt}" của ${member.ho_ten}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Hủy PT',
          style: 'destructive',
          onPress: async () => {
            setCancelingPT(true);
            try {
              const res = await api.put(`/pt/registrations/${activePT.id}/cancel`, {
                ly_do: 'Hủy PT bởi Admin qua ứng dụng di động'
              });
              if (res.data?.success) {
                Alert.alert('Thành công', 'Đã hủy gói PT của hội viên.');
                fetchDetail();
              } else {
                Alert.alert('Lỗi', res.data?.message || 'Không thể hủy gói PT.');
              }
            } catch (err) {
              Alert.alert('Lỗi', err?.response?.data?.message || err?.message || 'Có lỗi khi hủy gói PT.');
            } finally {
              setCancelingPT(false);
            }
          }
        }
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Cảnh báo xóa',
      `Bạn có chắc chắn muốn xóa hội viên ${member?.ho_ten}? Tài khoản đăng nhập của hội viên này cũng sẽ bị khóa.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(`/members/${memberId}`, {
                data: { ly_do: 'Xóa bởi Admin qua ứng dụng di động' }
              });
              if (res.data?.success) {
                Alert.alert('Thành công', 'Đã xóa hội viên.');
                navigation.goBack();
              }
            } catch (err) {
              Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể xóa hội viên.');
            }
          }
        }
      ]
    );
  };

  const handleCreateAccount = async () => {
    // Navigate to Create Account page or prompt for username/password
    Alert.prompt(
      'Cấp tài khoản',
      'Nhập Tên đăng nhập (mật khẩu mặc định: 123456)',
      async (username) => {
        if (!username || !username.trim()) return;
        try {
          const res = await api.post(`/members/${memberId}/create-account`, {
            ten_dang_nhap: username.trim(),
            mat_khau: '123456'
          });
          if (res.data?.success) {
            Alert.alert('Thành công', 'Đã tạo tài khoản cho hội viên!');
            fetchDetail();
          }
        } catch (err) {
          Alert.alert('Lỗi', err?.response?.data?.message || 'Tên đăng nhập đã được sử dụng.');
        }
      }
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const activePkg = member?.goi_tap_hien_tai?.length > 0 ? member.goi_tap_hien_tai[0] : null;
  const activePT = member?.pt_hien_tai?.length > 0 ? member.pt_hien_tai[0] : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: insets.top, height: 60 + insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <X color={colors.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Chi tiết Hội viên</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AdminAddEditMember', { memberId })} style={styles.headerBtn}>
          <Edit3 color={colors.primary} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ProfileAvatar uri={member?.avatar_url} name={member?.ho_ten} size={64} />
          <Text style={[styles.name, { color: colors.text }]}>{member?.ho_ten}</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            {member?.ma_ho_so} • {member?.loai_hv === 'vip' ? 'Thành viên VIP' : member?.loai_hv === 'premium' ? 'Premium' : 'Standard'}
          </Text>

          <View style={[styles.contactInfo, { backgroundColor: colors.surfaceVariant }]}>
            <View style={styles.contactRow}>
              <Phone color={colors.textSecondary} size={14} />
              <Text style={[styles.contactText, { color: colors.text }]}>{member?.so_dien_thoai || 'Chưa cập nhật SĐT'}</Text>
            </View>
            <View style={styles.contactRow}>
              <Mail color={colors.textSecondary} size={14} />
              <Text style={[styles.contactText, { color: colors.text }]} numberOfLines={1}>{member?.email || 'Chưa cập nhật Email'}</Text>
            </View>
            <View style={styles.contactRow}>
              <Building2 color={colors.textSecondary} size={14} />
              <Text style={[styles.contactText, { color: colors.text }]}>{member?.chi_nhanh || 'Chưa gán chi nhánh'}</Text>
            </View>
          </View>

          {/* Account status */}
          {!member?.ten_dang_nhap ? (
            <TouchableOpacity 
              style={[styles.accountBtn, { borderColor: colors.primary }]}
              onPress={handleCreateAccount}
            >
              <UserPlus color={colors.primary} size={14} />
              <Text style={[styles.accountBtnText, { color: colors.primary }]}>Cấp tài khoản đăng nhập</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.accountStatus}>
              <Check color={colors.primary} size={14} />
              <Text style={[styles.accountStatusText, { color: colors.textSecondary }]}>
                Tài khoản: <Text style={{ fontWeight: '700', color: colors.text }}>{member.ten_dang_nhap}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Gói Gym hiện tại */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Gói tập Gym</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {activePkg ? (
            <View>
              <View style={styles.cardHeader}>
                <Award color={colors.primary} size={20} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>{activePkg.ten_goi}</Text>
                <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.badgeText, { color: colors.primary }]}>Đang hoạt động</Text>
                </View>
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardText, { color: colors.textSecondary }]}>
                  Thời hạn: {formatDate(activePkg.tu_ngay)} - {formatDate(activePkg.den_ngay)}
                </Text>
                <Text style={[styles.cardText, { color: colors.textSecondary }]}>
                  Đã thanh toán: <Text style={{ fontWeight: '700', color: colors.text }}>{formatPrice(activePkg.gia_thuc_te)}</Text>
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={[styles.emptyCardText, { color: colors.textMuted }]}>Chưa đăng ký gói Gym</Text>
            </View>
          )}

          {/* Nút Yêu cầu gia hạn khi hết hạn / sắp hết hạn */}
          {(member?.trang_thai === 'het_han' || member?.trang_thai === 'sap_het_han') && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.warningLight, marginTop: 10, flexDirection: 'row', gap: 6 }]}
              onPress={handleNotifyRenew}
            >
              <Bell color={colors.warning} size={14} />
              <Text style={[styles.actionBtnText, { color: colors.warning }]}>Yêu cầu gia hạn</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primaryLight, marginTop: activePkg ? 10 : 0 }]}
            onPress={() => navigation.navigate('AdminRegisterPackage', { member, activePkg })}
          >
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>
              {activePkg ? 'Gia hạn / Đổi gói Gym' : 'Đăng ký gói Gym mới'}
            </Text>
          </TouchableOpacity>
          {activePkg && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.surfaceVariant, marginTop: 10 }]}
              onPress={handleEditPackageClick}
            >
              <Text style={[styles.actionBtnText, { color: colors.text }]}>Chỉnh sửa thông tin gói Gym hiện tại</Text>
            </TouchableOpacity>
          )}
          {activePkg && role === 'admin' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.dangerLight, marginTop: 10 }]}
              onPress={handleCancelPackage}
              disabled={cancelingPackage}
            >
              <Text style={[styles.actionBtnText, { color: colors.danger }]}>Hủy gói hiện tại</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hợp đồng PT hiện tại */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Hợp đồng PT</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {activePT ? (
            <View>
              <View style={styles.cardHeader}>
                <Dumbbell color={colors.primary} size={20} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>{activePT.ten_goi_pt || 'Đăng ký PT'}</Text>
                <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.badgeText, { color: colors.primary }]}>Đang hoạt động</Text>
                </View>
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardText, { color: colors.textSecondary }]}>
                  HLV gán: <Text style={{ fontWeight: '700', color: colors.text }}>{activePT.ten_pt}</Text>
                </Text>
                <Text style={[styles.cardText, { color: colors.textSecondary }]}>
                  Số buổi tập: {activePT.buoi_da_tap}/{activePT.buoi_dang_ky} buổi (còn {activePT.buoi_dang_ky - activePT.buoi_da_tap} buổi)
                </Text>
                <Text style={[styles.cardText, { color: colors.textSecondary }]}>
                  Thời hạn: {formatDate(activePT.tu_ngay)} - {formatDate(activePT.den_ngay)}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={[styles.emptyCardText, { color: colors.textMuted }]}>Chưa đăng ký HLV cá nhân (PT)</Text>
            </View>
          )}
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: colors.primaryLight, marginTop: activePT ? 12 : 0 }]}
            onPress={() => navigation.navigate('AdminRegisterPT', { member, activePT })}
          >
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>
              {activePT ? 'Gia hạn / Đổi gói PT' : 'Đăng ký gói tập với HLV (PT)'}
            </Text>
          </TouchableOpacity>
          {activePT && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.surfaceVariant, marginTop: 10 }]}
              onPress={handleEditPTClick}
            >
              <Text style={[styles.actionBtnText, { color: colors.text }]}>Chỉnh sửa thông tin gói PT</Text>
            </TouchableOpacity>
          )}
          {activePT && (
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: colors.primary, marginTop: 10 }]}
              onPress={() => navigation.navigate('AdminRegisterPTSchedule', { member, activePT })}
            >
              <Text style={[styles.actionBtnText, { color: '#fff' }]}>
                Đặt lịch tập PT mới
              </Text>
            </TouchableOpacity>
          )}
          {activePT && role === 'admin' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.dangerLight, marginTop: 10 }]}
              onPress={handleCancelPT}
              disabled={cancelingPT}
            >
              <Text style={[styles.actionBtnText, { color: colors.danger }]}>Hủy gói PT</Text>
            </TouchableOpacity>
          )}
          {ptSchedules.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={[styles.emptyCardText, { color: colors.textMuted }]}>Chưa có lịch tập PT nào được xếp</Text>
            </View>
          ) : (
            ptSchedules.map((item, idx) => {
              const statusMap = {
                cho_tap: 'Chờ tập',
                da_tap: 'Đã hoàn thành',
                da_huy: 'Đã hủy',
              };
              const label = statusMap[item.trang_thai] || item.trang_thai;
              return (
                <View 
                  key={item.id} 
                  style={[
                    styles.historyRow, 
                    { borderBottomColor: colors.borderLight }, 
                    idx === ptSchedules.length - 1 && { borderBottomWidth: 0 }
                  ]}
                >
                  <View style={styles.historyInfo}>
                    <Text style={[styles.historyName, { color: colors.text }]}>
                      HLV: {item.ten_pt} • {item.gio_bat_dau} - {item.gio_ket_thuc}
                    </Text>
                    <Text style={[styles.historyDates, { color: colors.textSecondary }]}>
                      Ngày tập: {formatDate(item.ngay_tap)}
                    </Text>
                    {item.ghi_chu ? (
                      <Text style={{ fontSize: 11, color: colors.textMuted, fontStyle: 'italic' }}>
                        Ghi chú: {item.ghi_chu}
                      </Text>
                    ) : null}
                    {item.ly_do_huy ? (
                      <Text style={{ fontSize: 11, color: colors.danger, fontStyle: 'italic' }}>
                        Lý do hủy: {item.ly_do_huy}
                      </Text>
                    ) : null}
                  </View>
                  <View style={{ gap: 6, alignItems: 'flex-end' }}>
                    <View style={[
                      styles.historyBadge, 
                      { backgroundColor: item.trang_thai === 'da_tap' ? colors.primaryLight : item.trang_thai === 'da_huy' ? colors.dangerLight : colors.warningLight }
                    ]}>
                      <Text style={[
                        styles.historyBadgeText, 
                        { color: item.trang_thai === 'da_tap' ? colors.primary : item.trang_thai === 'da_huy' ? colors.danger : colors.warning }
                      ]}>
                        {label}
                      </Text>
                    </View>
                    {item.trang_thai === 'cho_tap' && (
                      <TouchableOpacity 
                        onPress={() => handleCancelSchedule(item.id)}
                        style={{ padding: 4 }}
                      >
                        <Text style={{ fontSize: 11, color: colors.danger, fontWeight: '700' }}>Hủy lịch</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Lịch sử check-in */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Lịch sử Check-in (10 lượt gần nhất)</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 8 }]}>
          {checkins.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={[styles.emptyCardText, { color: colors.textMuted }]}>Chưa có lịch sử vào/ra phòng tập</Text>
            </View>
          ) : (
            checkins.map((item, idx) => (
              <View 
                key={idx} 
                style={[
                  styles.checkinRow, 
                  { borderBottomColor: colors.borderLight }, 
                  idx === checkins.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <View style={styles.checkinIconBox}>
                  <CheckCircle2 color={item.loai === 'vao' ? colors.primary : colors.textMuted} size={14} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.checkinTime, { color: colors.text }]}>
                    {formatDate(item.thoi_diem)} lúc {new Date(item.thoi_diem).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={[styles.checkinType, { color: colors.textSecondary }]}>
                    {item.loai === 'vao' ? 'Vào phòng tập' : 'Ra khỏi phòng'} • Lễ tân: {item.ten_le_tan || 'Tự động QR'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Lịch sử đăng ký gói tập */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Lịch sử gói tập</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 8 }]}>
          {history.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={[styles.emptyCardText, { color: colors.textMuted }]}>Chưa đăng ký gói tập nào</Text>
            </View>
          ) : (
            history.map((item, idx) => (
              <View 
                key={item.id} 
                style={[
                  styles.historyRow, 
                  { borderBottomColor: colors.borderLight }, 
                  idx === history.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <View style={styles.historyInfo}>
                  <Text style={[styles.historyName, { color: colors.text }]}>{item.ten_goi}</Text>
                  <Text style={[styles.historyDates, { color: colors.textSecondary }]}>
                    {formatDate(item.tu_ngay)} - {formatDate(item.den_ngay)}
                  </Text>
                  <Text style={[styles.historyPrice, { color: colors.textMuted }]}>
                    Giá thực tế: {formatPrice(item.gia_thuc_te)} • Đã đóng: {formatPrice(item.so_tien_da_thu)}
                  </Text>
                </View>
                <View style={[
                  styles.historyBadge, 
                  { backgroundColor: item.trang_thai === 'dang_hoat_dong' ? colors.primaryLight : colors.borderLight }
                ]}>
                  <Text style={[
                    styles.historyBadgeText, 
                    { color: item.trang_thai === 'dang_hoat_dong' ? colors.primary : colors.textSecondary }
                  ]}>
                    {item.trang_thai === 'dang_hoat_dong' ? 'Đang HĐ' : item.trang_thai === 'het_han' ? 'Hết hạn' : item.trang_thai === 'cho_kich_hoat' ? 'Chờ KH' : 'Đã hủy'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Delete button */}
        {role === 'admin' && (
          <TouchableOpacity 
            style={[styles.deleteBtn, { borderColor: colors.danger }]}
            onPress={handleDelete}
          >
            <Trash2 color={colors.danger} size={16} />
            <Text style={[styles.deleteBtnText, { color: colors.danger }]}>Xóa hội viên</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Registration Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editType === 'gym' ? 'Sửa Gói Gym Hiện Tại' : 'Sửa Gói PT Hiện Tại'}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X color={colors.text} size={20} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 8 }}>
              <DatePickerField
                label="Ngày bắt đầu"
                value={editTuNgay}
                onChangeText={setEditTuNgay}
                placeholder="Chọn ngày bắt đầu"
                colors={colors}
                returnFormat="YYYY-MM-DD"
                minDate={new Date()}
              />

              <DatePickerField
                label="Ngày kết thúc"
                value={editDenNgay}
                onChangeText={setEditDenNgay}
                placeholder="Chọn ngày kết thúc"
                colors={colors}
                returnFormat="YYYY-MM-DD"
                minDate={new Date()}
              />

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Giá thực tế (đ)</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.surfaceVariant, color: colors.textMuted, borderColor: colors.border, opacity: 0.6 }]}
                value={editGiaThucTe}
                onChangeText={setEditGiaThucTe}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                editable={false}
              />

              {editType === 'pt' && (
                <>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Số buổi đăng ký</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
                    value={editSoBuoi}
                    onChangeText={setEditSoBuoi}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                </>
              )}
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.text }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.modalBtnText, { color: '#fff' }]}>Lưu lại</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  scroll: { padding: 16 },

  profileCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20
  },
  name: { fontSize: 18, fontWeight: '800', marginTop: 12 },
  sub: { fontSize: 12, marginTop: 4 },
  contactInfo: {
    width: '100%',
    borderRadius: 14,
    padding: 12,
    gap: 8,
    marginTop: 16
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contactText: { fontSize: 12, fontWeight: '500' },
  accountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 14
  },
  accountBtnText: { fontSize: 12, fontWeight: '700' },
  accountStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  accountStatusText: { fontSize: 12, fontWeight: '500' },

  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 16, marginBottom: 8, paddingLeft: 4 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  cardInfo: { gap: 4, marginTop: 10 },
  cardText: { fontSize: 12, fontWeight: '500' },
  emptyCard: { paddingVertical: 20, alignItems: 'center' },
  emptyCardText: { fontSize: 12, fontWeight: '500' },
  actionBtn: {
    borderRadius: 12,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },

  emptySection: { paddingVertical: 20, alignItems: 'center' },
  checkinRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  checkinIconBox: { width: 24, alignItems: 'center' },
  checkinTime: { fontSize: 12, fontWeight: '700' },
  checkinType: { fontSize: 11, marginTop: 1 },

  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  historyInfo: { flex: 1, gap: 2 },
  historyName: { fontSize: 13, fontWeight: '700' },
  historyDates: { fontSize: 11 },
  historyPrice: { fontSize: 11 },
  historyBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  historyBadgeText: { fontSize: 9, fontWeight: '700' },

  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    height: 46,
    borderRadius: 12,
    marginTop: 20
  },
  deleteBtnText: { fontSize: 14, fontWeight: '800' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800'
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4
  },
  modalInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '700'
  }
});
