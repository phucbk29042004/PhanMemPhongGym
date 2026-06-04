import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Dumbbell, User, Save, AlertTriangle } from 'lucide-react-native';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import DatePickerField from '../../components/DatePickerField';
import { useAuthStore } from '../../store/useAuthStore';

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

/** Chuyển Date thành DD/MM/YYYY */
function dateToDMY(d) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Parse DD/MM/YYYY thành Date */
function parseDMY(str) {
  if (!str) return null;
  const parts = str.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return null;
  const date = new Date(y, m - 1, d);
  return isNaN(date) ? null : date;
}

function convertDMYToYMD(dmy) {
  if (!dmy) return '';
  const parts = dmy.split('/');
  if (parts.length !== 3) return '';
  const day = parts[0].trim();
  const month = parts[1].trim();
  const year = parts[2].trim();
  if (day.length !== 2 || month.length !== 2 || year.length !== 4) return '';
  return `${year}-${month}-${day}`;
}

function formatInputMoney(val) {
  if (val == null || val === '') return '';
  const clean = String(val).replace(/\D/g, '');
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseInputMoney(val) {
  if (!val) return 0;
  return Number(String(val).replace(/\./g, '')) || 0;
}

// ── Helpers ──────────────────────────────────────────────────────────
function RequiredStar() {
  return <Text style={{ color: '#ba1a1a', fontWeight: '700' }}> *</Text>;
}

function FieldLabel({ label, required = false, colors }) {
  return (
    <Text style={[styles.label, { color: colors.textSecondary }]}>
      {label}{required && <RequiredStar />}
    </Text>
  );
}

export default function AdminRegisterPTScreen({ route, navigation }) {
  const { member, activePT } = route.params || {};
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { selectedBranch } = useAuthStore();

  // Calculate old PT credit
  let oldPTCredit = 0;
  if (activePT) {
    const buoiCon = (activePT.buoi_dang_ky || 0) - (activePT.buoi_da_tap || 0);
    const tongBuoi = activePT.buoi_dang_ky || 0;
    const giaThucTeCu = activePT.gia_thuc_te || 0;
    oldPTCredit = tongBuoi > 0 ? Math.round((giaThucTeCu * buoiCon) / tongBuoi) : 0;
  }

  // States
  const [trainers, setTrainers] = useState([]);
  const [ptPackages, setPtPackages] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Loại đăng ký khi có PT cũ:
  //   'noi_tiep' = ngày bắt đầu = ngày kết thúc PT cũ + 1
  //   'song_song' = chọn ngày tự do, hủy PT cũ trước
  const [registrationType, setRegistrationType] = useState('noi_tiep');

  // Form inputs
  const todayDMY = dateToDMY(new Date());
  const [startDate, setStartDate] = useState(todayDMY); // DD/MM/YYYY
  const [endDate, setEndDate] = useState(''); // DD/MM/YYYY
  const [actualPrice, setActualPrice] = useState('');
  const [sessionCount, setSessionCount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('tien_mat');
  const [note, setNote] = useState('');
  const [refundAmount, setRefundAmount] = useState(activePT ? formatInputMoney(String(oldPTCredit)) : '0');

  // Khi có activePT và loại nối tiếp, tự động set ngày bắt đầu = den_ngay + 1 ngày
  useEffect(() => {
    if (activePT && registrationType === 'noi_tiep' && activePT.den_ngay) {
      const endOfCurrent = new Date(activePT.den_ngay);
      endOfCurrent.setDate(endOfCurrent.getDate() + 1);
      setStartDate(dateToDMY(endOfCurrent));
      setRefundAmount('0');
    } else if (!activePT || registrationType === 'song_song') {
      setStartDate(todayDMY);
      if (activePT) {
        setRefundAmount(formatInputMoney(String(oldPTCredit)));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrationType, activePT]);

  // Tự động tính ngày kết thúc và số buổi dựa trên gói và ngày bắt đầu
  useEffect(() => {
    if (!selectedPkg) return;

    const startParsed = parseDMY(startDate);
    if (!startParsed) return;

    const soThang = selectedPkg.so_thang || 0;
    if (soThang > 0) {
      // Gói theo tháng: tính ngày kết thúc
      const end = new Date(startParsed);
      end.setMonth(end.getMonth() + soThang);
      setEndDate(dateToDMY(end));
      // Số buổi = số ngày trong chu kỳ
      const diffDays = Math.round((end - startParsed) / 86400000);
      setSessionCount(String(diffDays));
    } else {
      // Gói theo buổi
      setEndDate('');
      setSessionCount(String(selectedPkg.so_buoi || ''));
    }
  }, [selectedPkg, startDate]);

  useEffect(() => {
    const loadInitData = async () => {
      try {
        const [trainerRes, pkgRes] = await Promise.all([
          api.get('/trainers'),
          api.get('/packages/pt')
        ]);
        if (trainerRes.data?.success) {
          const allTrainers = trainerRes.data.data?.trainers || trainerRes.data.data || [];
          // Lọc HLV theo chi nhánh đang chọn (nếu có)
          const filteredTrainers = selectedBranch
            ? allTrainers.filter(t => t.chi_nhanh === selectedBranch)
            : allTrainers;
          setTrainers(filteredTrainers);
        }
        if (pkgRes.data?.success) {
          setPtPackages(pkgRes.data.data || []);
        }
      } catch (err) {
        console.error('[RegisterPT] init error:', err?.message);
      } finally {
        setLoading(false);
      }
    };
    loadInitData();
  }, []);

  const handleSelectPackage = (pkg) => {
    setSelectedPkg(pkg);
    setActualPrice(formatInputMoney(String(pkg.gia)));
    // endDate và sessionCount sẽ tự tính qua useEffect
  };

  const handleRegister = async () => {
    if (!selectedTrainer) {
      Alert.alert('Lỗi', 'Vui lòng chọn Huấn luyện viên (PT).');
      return;
    }
    if (!selectedPkg) {
      Alert.alert('Lỗi', 'Vui lòng chọn một gói PT.');
      return;
    }

    const ymdStart = convertDMYToYMD(startDate);
    if (!ymdStart || !/^\d{4}-\d{2}-\d{2}$/.test(ymdStart)) {
      Alert.alert('Lỗi', 'Ngày bắt đầu phải đúng định dạng DD/MM/YYYY (VD: 25/05/2026).');
      return;
    }
    let ymdEnd = null;
    if (endDate.trim()) {
      ymdEnd = convertDMYToYMD(endDate);
      if (!ymdEnd || !/^\d{4}-\d{2}-\d{2}$/.test(ymdEnd)) {
        Alert.alert('Lỗi', 'Ngày kết thúc phải đúng định dạng DD/MM/YYYY.');
        return;
      }
    }

    const price = parseInputMoney(actualPrice);
    const sessions = Number(sessionCount);

    if (price < 0) {
      Alert.alert('Lỗi', 'Giá thực tế không hợp lệ.');
      return;
    }
    if (isNaN(sessions) || sessions <= 0) {
      Alert.alert('Lỗi', 'Số buổi tập không hợp lệ.');
      return;
    }

    // Nếu chế độ song song: cảnh báo trước khi hủy PT cũ
    const doRegister = async () => {
      setSubmitting(true);
      try {
        let structuredGhiChu = note || 'Đăng ký PT qua di động';

        // Nếu song song: hủy PT cũ trước
        if (activePT && registrationType === 'song_song') {
          const refundVal = parseInputMoney(refundAmount) || 0;
          const maxRefund = activePT ? (activePT.gia_thuc_te || activePT.gia || 0) : 0;
          if (refundVal > maxRefund) {
            Alert.alert('Lỗi', `Số tiền khấu trừ không được vượt quá giá trị gói cũ (${formatPrice(maxRefund)}).`);
            return;
          }

          await api.put(`/pt/registrations/${activePT.id}/cancel`, {
            ly_do_huy: 'Đổi sang gói PT mới',
            so_tien_hoan: refundVal
          });

          const giaThucTeCu = activePT.gia_thuc_te || 0;
          structuredGhiChu = `Đổi từ gói: ${activePT.ten_goi_pt || 'Gói PT'} (ID: ${activePT.id}, Giá cũ: ${giaThucTeCu}, Khấu trừ: ${refundVal})${note ? ' | ' + note : ''}`;
        }

        const payload = {
          hoi_vien_id: member.id,
          pt_id: selectedTrainer.id,
          goi_pt_id: selectedPkg.id,
          so_buoi_dang_ky: sessions,
          tu_ngay: ymdStart,
          den_ngay: ymdEnd,
          gia_thuc_te: price,
          phuong_thuc_tt: paymentMethod,
          ghi_chu_tt: structuredGhiChu
        };

        const res = await api.post('/pt/registrations', payload);
        if (res.data?.success) {
          Alert.alert('Thành công', `Đăng ký gói PT thành công với HLV ${selectedTrainer.ho_ten}!`, [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        } else {
          Alert.alert('Lỗi', res.data?.message || 'Đăng ký PT thất bại.');
        }
      } catch (err) {
        console.error('[RegisterPT] error:', err?.response?.data || err?.message);
        Alert.alert('Lỗi', err?.response?.data?.message || 'Có lỗi xảy ra.');
      } finally {
        setSubmitting(false);
      }
    };

    if (activePT && registrationType === 'song_song') {
      Alert.alert(
        'Xác nhận kích hoạt song song',
        `Gói PT hiện tại (${activePT.ten_goi_pt || 'PT'}) sẽ bị kết thúc sớm. Bạn có chắc chắn muốn kích hoạt gói mới?`,
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Xác nhận', onPress: doRegister }
        ]
      );
    } else {
      doRegister();
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isRenew = !!activePT;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: insets.top, height: 60 + insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <X color={colors.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isRenew ? 'Gia hạn / Đổi gói PT' : 'Đăng ký gói PT'}
        </Text>
        <TouchableOpacity onPress={handleRegister} disabled={submitting} style={styles.headerBtn}>
          {submitting ? <ActivityIndicator size="small" color={colors.primary} /> : <Save color={colors.primary} size={20} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hội viên */}
        <View style={[styles.memberInfo, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.memberLabel, { color: colors.textSecondary }]}>Đăng ký cho hội viên:</Text>
          <Text style={[styles.memberName, { color: colors.text }]}>{member?.ho_ten} ({member?.ma_ho_so})</Text>
        </View>

        {/* Banner PT cũ đang hoạt động */}
        {activePT && (
          <View style={[styles.activePTBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Dumbbell color={colors.primary} size={18} />
              <Text style={{ fontWeight: '700', fontSize: 13, color: colors.text }}>Hợp đồng PT đang hoạt động</Text>
            </View>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>
              Gói: <Text style={{ fontWeight: '700', color: colors.text }}>{activePT.ten_goi_pt || 'Gói PT'}</Text>
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>
              HLV: <Text style={{ fontWeight: '700', color: colors.text }}>{activePT.ten_pt}</Text>
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>
              Thời hạn: {formatDate(activePT.tu_ngay)} - {formatDate(activePT.den_ngay)}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 10 }}>
              Số buổi còn lại: <Text style={{ fontWeight: '700', color: colors.text }}>{activePT.buoi_dang_ky - activePT.buoi_da_tap}</Text> buổi
            </Text>

            {/* Loại đăng ký */}
            <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 }}>Loại đăng ký:</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    { borderColor: registrationType === 'noi_tiep' ? colors.primary : colors.border },
                    registrationType === 'noi_tiep' && { backgroundColor: colors.primaryLight }
                  ]}
                  onPress={() => {
                    setRegistrationType('noi_tiep');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 11, color: registrationType === 'noi_tiep' ? colors.primary : colors.textSecondary, fontWeight: registrationType === 'noi_tiep' ? '700' : '500' }}>
                    Nối tiếp sau gói hiện tại
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    { borderColor: registrationType === 'song_song' ? colors.primary : colors.border },
                    registrationType === 'song_song' && { backgroundColor: colors.primaryLight }
                  ]}
                  onPress={() => {
                    setRegistrationType('song_song');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 11, color: registrationType === 'song_song' ? colors.primary : colors.textSecondary, fontWeight: registrationType === 'song_song' ? '700' : '500' }}>
                    Đổi gói PT
                  </Text>
                </TouchableOpacity>
              </View>
              {registrationType === 'noi_tiep' ? (
                <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 6 }}>
                  * Gói PT mới sẽ bắt đầu sau khi gói cũ hết hạn để tránh bị lỗi trùng lặp logic lịch tập.
                </Text>
              ) : (
                <Text style={{ fontSize: 11, color: '#d97706', marginTop: 6, fontWeight: '500' }}>
                  * Gói PT hiện tại sẽ bị hủy ngay lập tức và kích hoạt gói mới từ hôm nay. Số tiền hoàn trả tương ứng số buổi còn lại sẽ được tính trừ vào gói mới.
                </Text>
              )}
            </View>
          </View>
        )}


        {/* Danh sách HLV (PT) */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Chọn Huấn Luyện Viên (PT)</Text>
        <View style={styles.listContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {trainers.map((pt) => {
              const active = selectedTrainer?.id === pt.id;
              return (
                <TouchableOpacity
                  key={pt.id}
                  style={[
                    styles.trainerCard,
                    { backgroundColor: colors.surface, borderColor: active ? colors.primary : colors.border }
                  ]}
                  onPress={() => setSelectedTrainer(pt)}
                >
                  <User color={active ? colors.primary : colors.textSecondary} size={24} />
                  <Text style={[styles.trainerName, { color: colors.text }]} numberOfLines={1}>{pt.ho_ten}</Text>
                  <Text style={[styles.trainerSub, { color: colors.textSecondary }]} numberOfLines={1}>{pt.chuyen_mon || 'Gym/Fitness'}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Danh sách gói PT */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Chọn Gói tập PT</Text>
        <View style={styles.packageList}>
          {ptPackages.map((pkg) => {
            const active = selectedPkg?.id === pkg.id;
            const hasMonths = (pkg.so_thang || 0) > 0;
            return (
              <TouchableOpacity
                key={pkg.id}
                style={[
                  styles.packageItem,
                  { backgroundColor: colors.surface, borderColor: active ? colors.primary : colors.border },
                  active && { borderLeftWidth: 4, borderLeftColor: colors.primary }
                ]}
                onPress={() => handleSelectPackage(pkg)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.packageName, { color: colors.text }]}>{pkg.ten_goi}</Text>
                  <Text style={[styles.packageDetails, { color: colors.textSecondary }]}>
                    {hasMonths
                      ? `Thời hạn: ${pkg.so_thang} tháng`
                      : `Số buổi: ${pkg.so_buoi} buổi`}
                  </Text>
                </View>
                <Text style={[styles.packagePrice, { color: active ? colors.primary : colors.text, fontWeight: '800' }]}>
                  {formatPrice(pkg.gia)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedPkg && selectedTrainer && (
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <DatePickerField
              label={activePT && registrationType === 'noi_tiep' ? "Ngày bắt đầu (Tự động nối tiếp gói cũ)" : "Ngày bắt đầu"}
              required
              value={startDate}
              onChangeText={setStartDate}
              placeholder="Chọn ngày bắt đầu"
              colors={colors}
              returnFormat="DD/MM/YYYY"
              disabled={activePT && registrationType === 'noi_tiep'}
            />

            {activePT && registrationType === 'noi_tiep' && (
              <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '600', marginTop: -4, marginBottom: 4 }}>
                * Ngày bắt đầu được đặt tự động nối tiếp sau ngày kết thúc của hợp đồng PT hiện tại ({formatDate(activePT.den_ngay)})
              </Text>
            )}


            <DatePickerField
              label={`Ngày kết thúc${(selectedPkg.so_thang || 0) > 0 ? ' (Tự động tính)' : ''}`}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="Chọn ngày kết thúc"
              colors={colors}
              returnFormat="DD/MM/YYYY"
              disabled={(selectedPkg.so_thang || 0) > 0}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <FieldLabel
                  label={`Số buổi tập${(selectedPkg.so_thang || 0) > 0 ? ' — Tự động tính' : ''}`}
                  required colors={colors}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
                  value={sessionCount}
                  onChangeText={setSessionCount}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel label={activePT && registrationType === 'song_song' ? "Giá thực tế gói mới (đ)" : "Giá thanh toán (đ)"} required colors={colors} />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
                  value={actualPrice}
                  onChangeText={(val) => setActualPrice(formatInputMoney(val))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {activePT && registrationType === 'song_song' && (
              <View style={{ marginTop: 4 }}>
                <FieldLabel label="Khấu trừ gói cũ (đ)" required colors={colors} />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
                  value={refundAmount}
                  onChangeText={(val) => setRefundAmount(formatInputMoney(val))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            )}

            {activePT && registrationType === 'song_song' && (
              <View style={{ marginTop: 4 }}>
                {(() => {
                  const price = parseInputMoney(actualPrice) || 0;
                  const refund = parseInputMoney(refundAmount) || 0;
                  const oldPrice = activePT ? (activePT.gia_thuc_te || activePT.gia || 0) : 0;
                  const isUpgrade = price >= refund;
                  const label = isUpgrade ? 'Tiền đóng thêm (đ)' : 'Tiền hoàn trả khách (đ)';
                  const diff = isUpgrade ? Math.max(0, price - refund) : Math.max(0, refund - price);
                  const displayValue = formatPrice(diff);
                  const bgStyle = isUpgrade ? { backgroundColor: '#e6f4ea', borderColor: '#34a853' } : { backgroundColor: '#fce8e6', borderColor: '#ea4335' };
                  const textStyle = isUpgrade ? { color: '#137333' } : { color: '#c5221f' };

                  return (
                    <View style={[styles.diffContainer, bgStyle]}>
                      <Text style={[styles.diffLabel, textStyle]}>{label}</Text>
                      <Text style={[styles.diffValue, textStyle]}>{displayValue}</Text>
                    </View>
                  );
                })()}
              </View>
            )}

            <FieldLabel label="Phương thức thanh toán" required colors={colors} />
            <View style={styles.paymentMethodRow}>
              {[
                { key: 'tien_mat', label: 'Tiền mặt' },
                { key: 'chuyen_khoan', label: 'Chuyển khoản' }
              ].map((m) => {
                const active = paymentMethod === m.key;
                return (
                  <TouchableOpacity
                    key={m.key}
                    style={[
                      styles.paymentMethodBtn,
                      { borderColor: active ? colors.primary : colors.border },
                      active && { backgroundColor: colors.primaryLight }
                    ]}
                    onPress={() => setPaymentMethod(m.key)}
                  >
                    <Text style={{ color: active ? colors.primary : colors.textSecondary, fontWeight: active ? '700' : '500' }}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <FieldLabel label="Ghi chú" colors={colors} />
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              placeholder="Nhập ghi chú đăng ký..."
              placeholderTextColor={colors.textMuted}
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: (selectedPkg && selectedTrainer) ? 1 : 0.6 }]}
          onPress={handleRegister}
          disabled={submitting || !selectedPkg || !selectedTrainer}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>
              {isRenew
                ? (registrationType === 'noi_tiep' ? 'Đăng ký Nối tiếp' : 'Xác nhận đổi gói')
                : 'Đăng ký Gói PT'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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

  memberInfo: { padding: 12, borderRadius: 12, marginBottom: 16 },
  memberLabel: { fontSize: 11 },
  memberName: { fontSize: 14, fontWeight: '700', marginTop: 2 },

  activePTBanner: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  diffContainer: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  diffLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  diffValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  typeBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },

  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 12, marginBottom: 8, paddingLeft: 4 },
  listContainer: { marginVertical: 6 },
  trainerCard: {
    width: 110,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 4
  },
  trainerName: { fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  trainerSub: { fontSize: 10, textAlign: 'center' },

  packageList: { gap: 10, marginBottom: 16, marginTop: 4 },
  packageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1
  },
  packageName: { fontSize: 14, fontWeight: '700' },
  packageDetails: { fontSize: 11, marginTop: 2 },
  packagePrice: { fontSize: 15 },

  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.01,
    shadowRadius: 6,
    elevation: 1
  },
  label: { fontSize: 12, fontWeight: '600', marginTop: 8, marginBottom: 4 },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14
  },
  textArea: {
    height: 80,
    paddingTop: 10,
    textAlignVertical: 'top'
  },
  paymentMethodRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  paymentMethodBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  submitBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '800' }
});
