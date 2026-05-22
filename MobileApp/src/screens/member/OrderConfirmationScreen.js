import React, { useState, useEffect } from 'react';
import {
  ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View,
  SafeAreaView, Modal, ActivityIndicator, Image, Alert
} from 'react-native';
import {
  ArrowLeft, Building2, CreditCard, ChevronRight, Check, CheckCircle2,
  Calendar, Info, AlertTriangle, Smartphone, Copy, X
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import { formatDate } from '../../utils/data';

const BRAND = {
  primary: '#1D9336',
  primaryDark: '#155f27',
  primaryLight: '#e6f4ea',
  white: '#ffffff',
  gray50: '#f8faf8',
  gray100: '#f0f4f0',
  gray200: '#e4ebe4',
  gray500: '#6b7c6b',
  gray700: '#2d3c2d',
  gray900: '#141c14',
  danger: '#dc2626',
  dangerLight: '#fef2f2',
  warning: '#f59e0b',
  warningLight: '#fffbeb',
};

function formatPrice(val) {
  if (val == null) return '0đ';
  return Number(val).toLocaleString('vi-VN') + 'đ';
}

export default function OrderConfirmationScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { packageItem, profile } = route.params || {};

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('chuyen_khoan'); // default to 'chuyen_khoan'
  const [loading, setLoading] = useState(false);
  
  // Trạng thái cho QR PayOS Modal
  const [payosModalVisible, setPayosModalVisible] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null); // { orderCode, payosUrl, qrCodeUrl, amount }
  const [pollingActive, setPollingActive] = useState(false);
  const [pollingErrorCount, setPollingErrorCount] = useState(0);

  // Lấy ngày bắt đầu tự động tính toán từ backend nối tiếp
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 1. Fetch danh sách chi nhánh và tính ngày bắt đầu
  useEffect(() => {
    let active = true;

    const initData = async () => {
      try {
        // Fetch chi nhánh
        const res = await api.get('/branches');
        if (res.data?.success && active) {
          setBranches(res.data.data);
          // Set mặc định chi nhánh trùng với chi nhánh trong hồ sơ hội viên nếu khớp
          if (profile?.chi_nhanh) {
            const matched = res.data.data.find(b => b.ten.toLowerCase().includes(profile.chi_nhanh.toLowerCase()));
            if (matched) setSelectedBranch(matched);
          }
        }
      } catch (err) {
        console.error('Lỗi lấy chi nhánh:', err);
        // Fallback local list
        if (active) {
          const localBranches = [
            { id: 'go-vap', ten: 'Chi nhánh Gò Vấp' },
            { id: 'binh-thanh', ten: 'Chi nhánh Bình Thạnh' },
            { id: 'tan-binh', ten: 'Chi nhánh Tân Bình' }
          ];
          setBranches(localBranches);
        }
      }

      // Tính toán ngày bắt đầu dựa vào gói cũ của hội viên
      if (active) {
        const today = new Date().toISOString().split('T')[0];
        let defaultStart = today;
        const activePkg = profile?.goi_tap?.[0]; // Lấy gói hiện tại đang hoạt động
        if (activePkg && activePkg.den_ngay >= today) {
          const d = new Date(activePkg.den_ngay);
          d.setDate(d.getDate() + 1); // bắt đầu ngay ngày hôm sau ngày hết hạn gói cũ
          defaultStart = d.toISOString().split('T')[0];
        }
        setStartDate(defaultStart);

        // Tính ngày kết thúc tạm thời hiển thị trên mobile
        const d = new Date(defaultStart);
        d.setMonth(d.getMonth() + (packageItem.so_thang || 0));
        d.setDate(d.getDate() + (packageItem.so_ngay_them || 0));
        setEndDate(d.toISOString().split('T')[0]);
      }
    };

    initData();
    return () => { active = false; };
  }, [profile, packageItem]);

  // 2. Polling kiểm tra trạng thái thanh toán PayOS
  useEffect(() => {
    let intervalId = null;
    
    if (pollingActive && paymentInfo?.orderCode) {
      intervalId = setInterval(async () => {
        try {
          const res = await api.get(`/members/me/payos-status/${paymentInfo.orderCode}`);
          if (res.data?.success) {
            const status = res.data.data?.status;
            if (status === 'PAID') {
              setPollingActive(false);
              setPayosModalVisible(false);
              Alert.alert('Thành công 🎉', 'Thanh toán chuyển khoản qua PayOS thành công! Gói tập của bạn đã được kích hoạt.', [
                { text: 'Trở về trang chủ', onPress: () => navigation.navigate('Home') }
              ]);
            } else if (status === 'CANCELLED') {
              setPollingActive(false);
              setPayosModalVisible(false);
              Alert.alert('Hủy thanh toán', 'Giao dịch thanh toán PayOS đã bị hủy.');
            }
          }
        } catch (err) {
          console.error('Lỗi checkPayosStatus polling:', err);
          setPollingErrorCount(c => c + 1);
          if (pollingErrorCount > 15) {
            // Tự động dừng polling nếu gặp lỗi liên tiếp quá nhiều
            setPollingActive(false);
          }
        }
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pollingActive, paymentInfo, pollingErrorCount]);

  // 3. Xử lý mua gói tập
  const handleConfirmPurchase = async () => {
    if (!selectedBranch) {
      Alert.alert('Thông báo', 'Vui lòng chọn chi nhánh đăng ký tập.');
      return;
    }

    setLoading(true);
    try {
      const body = {
        goi_tap_id: packageItem.id,
        tu_ngay: startDate,
        phuong_thuc_tt: paymentMethod,
        chi_nhanh_mua: selectedBranch.ten,
        ghi_chu: `Đăng ký gói ${packageItem.ten_goi} tại ${selectedBranch.ten}`
      };

      const res = await api.post('/members/me/package-request', body);
      
      if (res.data?.success) {
        if (paymentMethod === 'chuyen_khoan') {
          // Luồng PayOS Chuyển khoản
          setPaymentInfo(res.data.data);
          setPayosModalVisible(true);
          setPollingActive(true);
          setPollingErrorCount(0);
        } else {
          // Luồng tiền mặt
          Alert.alert('Gửi yêu cầu thành công', 'Yêu cầu đăng ký gói đã được gửi. Vui lòng liên hệ quầy lễ tân để thanh toán tiền mặt.', [
            { text: 'Đồng ý', onPress: () => navigation.navigate('Home') }
          ]);
        }
      } else {
        Alert.alert('Lỗi', res.data?.message || 'Có lỗi xảy ra khi đăng ký.');
      }
    } catch (err) {
      console.error('Lỗi mua gói:', err);
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />
      
      {/* Header bar */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Thanh toán gói tập</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Tóm tắt gói đã chọn */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.summaryTitle, { color: colors.textMuted }]}>Gói tập đã chọn</Text>
          <Text style={[styles.packageName, { color: colors.text }]}>{packageItem.ten_goi}</Text>
          <Text style={[styles.packagePrice, { color: BRAND.primary }]}>{formatPrice(packageItem.gia)}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Calendar size={14} color={colors.textMuted} />
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Ngày bắt đầu:</Text>
            </View>
            <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(startDate)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Calendar size={14} color={colors.textMuted} />
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Ngày kết thúc:</Text>
            </View>
            <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(endDate)}</Text>
          </View>
          
          {profile?.goi_tap?.[0] && new Date(profile.goi_tap[0].den_ngay) >= new Date() && (
            <View style={[styles.alertBox, { backgroundColor: BRAND.warningLight }]}>
              <AlertTriangle size={16} color={BRAND.warning} />
              <Text style={[styles.alertText, { color: BRAND.gray700 }]}>
                Hệ thống tự động phát hiện gói tập cũ vẫn còn hạn. Gói mới sẽ tự động được xếp nối tiếp sau ngày {formatDate(profile.goi_tap[0].den_ngay)}.
              </Text>
            </View>
          )}
        </View>

        {/* Chọn chi nhánh */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Chi nhánh tập luyện</Text>
        <TouchableOpacity
          style={[styles.selectBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setBranchModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.selectBoxLeft}>
            <Building2 size={20} color={BRAND.primary} />
            <Text style={[styles.selectBoxText, { color: selectedBranch ? colors.text : colors.textMuted }]}>
              {selectedBranch ? selectedBranch.ten : 'Chọn chi nhánh đăng ký tập'}
            </Text>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Phương thức thanh toán */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Phương thức thanh toán</Text>
        <View style={styles.methodsContainer}>
          {/* Chuyển khoản PayOS */}
          <TouchableOpacity
            style={[
              styles.methodRow,
              { backgroundColor: colors.surface, borderColor: paymentMethod === 'chuyen_khoan' ? BRAND.primary : colors.border }
            ]}
            onPress={() => setPaymentMethod('chuyen_khoan')}
            activeOpacity={0.8}
          >
            <View style={styles.methodLeft}>
              <View style={[styles.methodIconBg, { backgroundColor: BRAND.primaryLight }]}>
                <Smartphone size={20} color={BRAND.primary} />
              </View>
              <View>
                <Text style={[styles.methodTitle, { color: colors.text }]}>Chuyển khoản (PayOS QR)</Text>
                <Text style={[styles.methodDesc, { color: colors.textMuted }]}>Thanh toán tự động bằng VietQR ngân hàng</Text>
              </View>
            </View>
            <View style={[styles.radioCircle, { borderColor: paymentMethod === 'chuyen_khoan' ? BRAND.primary : colors.border }]}>
              {paymentMethod === 'chuyen_khoan' && <View style={[styles.radioDot, { backgroundColor: BRAND.primary }]} />}
            </View>
          </TouchableOpacity>

          {/* Tiền mặt */}
          <TouchableOpacity
            style={[
              styles.methodRow,
              { backgroundColor: colors.surface, borderColor: paymentMethod === 'tien_mat' ? BRAND.primary : colors.border }
            ]}
            onPress={() => setPaymentMethod('tien_mat')}
            activeOpacity={0.8}
          >
            <View style={styles.methodLeft}>
              <View style={[styles.methodIconBg, { backgroundColor: BRAND.primaryLight }]}>
                <CreditCard size={20} color={BRAND.primary} />
              </View>
              <View>
                <Text style={[styles.methodTitle, { color: colors.text }]}>Tiền mặt tại quầy</Text>
                <Text style={[styles.methodDesc, { color: colors.textMuted }]}>Đến đóng tiền trực tiếp cho lễ tân</Text>
              </View>
            </View>
            <View style={[styles.radioCircle, { borderColor: paymentMethod === 'tien_mat' ? BRAND.primary : colors.border }]}>
              {paymentMethod === 'tien_mat' && <View style={[styles.radioDot, { backgroundColor: BRAND.primary }]} />}
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={styles.priceContainer}>
          <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Tổng tiền</Text>
          <Text style={[styles.priceValue, { color: BRAND.primary }]}>{formatPrice(packageItem.gia)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.payButton, { opacity: loading ? 0.7 : 1 }]}
          onPress={handleConfirmPurchase}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>
              {paymentMethod === 'chuyen_khoan' ? 'Thanh toán ngay' : 'Xác nhận mua'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal Chọn Chi nhánh */}
      <Modal visible={branchModalVisible} animationType="slide" transparent onRequestClose={() => setBranchModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Chọn chi nhánh</Text>
              <TouchableOpacity onPress={() => setBranchModalVisible(false)}>
                <X color={colors.textMuted} size={24} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {branches.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.branchSelectItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setSelectedBranch(b);
                    setBranchModalVisible(false);
                  }}
                >
                  <Building2 size={16} color={BRAND.primary} />
                  <Text style={[styles.branchSelectItemText, { color: colors.text, fontWeight: selectedBranch?.id === b.id ? '700' : '400' }]}>
                    {b.ten}
                  </Text>
                  {selectedBranch?.id === b.id && <Check color={BRAND.primary} size={16} strokeWidth={3} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal PayOS QR code */}
      <Modal visible={payosModalVisible} animationType="fade" transparent onRequestClose={() => {
        setPayosModalVisible(false);
        setPollingActive(false);
      }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.qrSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.qrHeader}>
              <Text style={[styles.qrTitle, { color: colors.text }]}>Thanh toán chuyển khoản</Text>
              <TouchableOpacity onPress={() => {
                setPayosModalVisible(false);
                setPollingActive(false);
                Alert.alert('Thanh toán chưa hoàn tất', 'Yêu cầu gia hạn của bạn vẫn đang ở trạng thái Chờ thanh toán. Bạn có thể thanh toán sau.');
              }}>
                <X color={colors.textMuted} size={24} />
              </TouchableOpacity>
            </View>

            {paymentInfo?.qrCodeUrl ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.qrScroll}>
                <Text style={[styles.qrHint, { color: colors.textMuted }]}>
                  Sử dụng ứng dụng ngân hàng quét mã QR dưới đây để tự động điền số tiền và nội dung chuyển khoản.
                </Text>

                {/* QR Code Container */}
                <View style={styles.qrWrapper}>
                  <Image
                    source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentInfo.qrCodeUrl)}` }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                  <View style={styles.qrBadge}>
                    <CheckCircle2 color={BRAND.primary} size={14} />
                    <Text style={styles.qrBadgeText}>PAYOS SECURE</Text>
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
                  <ActivityIndicator size="small" color={BRAND.primary} />
                  <Text style={[styles.pollingStatusText, { color: BRAND.gray500 }]}>
                    Đang chờ hệ thống kiểm tra giao dịch tự động...
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
                <ActivityIndicator size="large" color={BRAND.primary} />
                <Text style={{ marginTop: 12, color: colors.text }}>Đang tải mã QR PayOS...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  packageName: {
    fontSize: 18,
    fontWeight: '850',
    marginBottom: 4,
  },
  packagePrice: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#e4ebe4',
    marginVertical: 12,
    opacity: 0.8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  alertBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'flex-start',
  },
  alertText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
    marginTop: 10,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  selectBoxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectBoxText: {
    fontSize: 14,
    fontWeight: '600',
  },
  methodsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  methodIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  methodDesc: {
    fontSize: 11,
    fontWeight: '500',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  priceContainer: {
    flexDirection: 'column',
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  payButton: {
    backgroundColor: BRAND.primary,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    minWidth: 140,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4f0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  branchSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  branchSelectItemText: {
    flex: 1,
    fontSize: 14,
  },
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
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '800',
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
    backgroundColor: '#fff',
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
    backgroundColor: '#e6f4ea',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 10,
  },
  qrBadgeText: {
    color: BRAND.primary,
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
  }
});
