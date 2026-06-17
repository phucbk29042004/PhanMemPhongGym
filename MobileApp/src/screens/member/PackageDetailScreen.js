import React from 'react';
import {
  ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, SafeAreaView
} from 'react-native';
import {
  ArrowLeft, Award, Calendar, Check, Landmark, ShieldCheck, MapPin, Sparkles, Flame, CheckCircle
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

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
  gold: '#f59e0b',
  goldLight: '#fffbeb'
};

function formatPrice(val) {
  if (val == null) return '0đ';
  return Number(val).toLocaleString('vi-VN') + 'đ';
}

export default function PackageDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { packageItem, profile } = route.params || {};

  if (!packageItem) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={{ color: colors.text }}>Không tìm thấy gói tập.</Text>
        </View>
      </View>
    );
  }

  const isPT = packageItem.loai_goi === 'pt' || packageItem.loai_goi === 'theo_buoi';

  // Chuyển sang màn hình xác nhận thanh toán
  const handleBuyNow = () => {
    navigation.navigate('OrderConfirmation', { packageItem, profile });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />
      
      {/* Header bar */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: insets.top, height: 56 + insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Chi tiết gói tập</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banner gói tập */}
        <View style={[styles.bannerCard, { backgroundColor: colors.surfaceVariant || colors.primaryLight }]}>
          <View style={[styles.badge, { backgroundColor: BRAND.primary }]}>
            <Sparkles color="#fff" size={12} fill="#fff" />
            <Text style={styles.badgeText}>GÓI HỘI VIÊN</Text>
          </View>
          
          <Text style={[styles.packageName, { color: colors.text }]}>{packageItem.ten_goi}</Text>
          <Text style={[styles.packagePrice, { color: BRAND.primary }]}>{formatPrice(packageItem.gia)}</Text>
          
          <View style={styles.bannerInfoRow}>
            <View style={styles.bannerInfoItem}>
              <Calendar color={BRAND.primary} size={16} />
              <Text style={[styles.bannerInfoText, { color: colors.textMuted }]}>
                {packageItem.so_thang || 0} tháng {packageItem.so_ngay_them > 0 ? `+ ${packageItem.so_ngay_them} ngày` : ''}
              </Text>
            </View>
            <View style={styles.bannerInfoDivider} />
            <View style={styles.bannerInfoItem}>
              <ShieldCheck color={BRAND.primary} size={16} />
              <Text style={[styles.bannerInfoText, { color: colors.textMuted }]}>Gia hạn nối tiếp</Text>
            </View>
          </View>
        </View>

        {/* Thông số kỹ thuật của gói */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Thông tin chi tiết</Text>
        <View style={[styles.infoGrid, { backgroundColor: colors.surface }]}>
          <View style={[styles.infoGridItem, { borderBottomWidth: 1, borderBottomColor: colors.border, borderRightWidth: 1, borderRightColor: colors.border }]}>
            <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Thời hạn gói</Text>
            <Text style={[styles.gridValue, { color: colors.text }]}>{packageItem.so_thang || 0} Tháng</Text>
          </View>
          <View style={[styles.infoGridItem, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Đơn giá niêm yết</Text>
            <Text style={[styles.gridValue, { color: colors.text }]}>{formatPrice(packageItem.gia)}</Text>
          </View>
          <View style={[styles.infoGridItem, { borderRightWidth: 1, borderRightColor: colors.border }]}>
            <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Ngày tặng kèm</Text>
            <Text style={[styles.gridValue, { color: colors.text }]}>{packageItem.so_ngay_them || 0} Ngày</Text>
          </View>
          <View style={styles.infoGridItem}>
            <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Loại gói tập</Text>
            <Text style={[styles.gridValue, { color: colors.text }]}>{isPT ? 'Huấn luyện viên' : 'Hội viên Gym'}</Text>
          </View>
        </View>

        {/* Quyền lợi hội viên */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quyền lợi hội viên</Text>
        <View style={[styles.benefitsCard, { backgroundColor: colors.surface }]}>
          {[
            'Tập luyện không giới hạn thời gian và khung giờ tại phòng tập.',
            'Sử dụng miễn phí các dịch vụ tiện ích: tủ đồ cá nhân, nước uống, phòng tắm nóng lạnh.',
            'Hỗ trợ cân đo chỉ số cơ thể InBody miễn phí mỗi tuần.',
            'Được hướng dẫn tư vấn lộ trình tập luyện bởi huấn luyện viên chuyên nghiệp.',
            'Hưởng toàn bộ các ưu đãi cộng thêm theo chương trình CSKH.'
          ].map((benefit, idx) => (
            <View key={idx} style={styles.benefitRow}>
              <View style={[styles.benefitCheck, { backgroundColor: BRAND.primaryLight }]}>
                <Check color={BRAND.primary} size={14} strokeWidth={3} />
              </View>
              <Text style={[styles.benefitText, { color: colors.textSecondary || BRAND.gray700 }]}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Chi nhánh áp dụng */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Chi nhánh áp dụng</Text>
        <View style={[styles.branchCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.branchIconBg, { backgroundColor: BRAND.primaryLight }]}>
            <MapPin color={BRAND.primary} size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.branchTitle, { color: colors.text }]}>Toàn hệ thống Paradise Gym</Text>
            <Text style={[styles.branchSubtitle, { color: colors.textMuted }]}>
              Học viên được check-in và tập luyện tại tất cả 12 chi nhánh phòng tập lớn nhỏ của Paradise Gym tại Thành phố Hồ Chí Minh.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={styles.priceContainer}>
          <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Tổng tiền</Text>
          <Text style={[styles.priceValue, { color: colors.text }]}>{formatPrice(packageItem.gia)}</Text>
        </View>
        
        <TouchableOpacity style={styles.buyButton} onPress={handleBuyNow} activeOpacity={0.8}>
          <Flame color="#fff" size={18} fill="#fff" />
          <Text style={styles.buyButtonText}>Mua ngay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
  },
  bannerCard: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  packageName: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  packagePrice: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 20,
  },
  bannerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bannerInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerInfoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bannerInfoDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#9cad9c',
    opacity: 0.4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  infoGridItem: {
    width: '50%',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  benefitsCard: {
    padding: 20,
    borderRadius: 20,
    gap: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  benefitCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  branchCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 20,
    gap: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  branchIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  branchSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
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
  buyButton: {
    flexDirection: 'row',
    backgroundColor: BRAND.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    gap: 8,
    shadowColor: BRAND.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  }
});
