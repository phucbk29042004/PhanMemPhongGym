import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Award, CreditCard, Building2, Calendar, Save } from 'lucide-react-native';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import DatePickerField from '../../components/DatePickerField';

function formatPrice(val) {
  if (val == null) return '0đ';
  return Number(val).toLocaleString('vi-VN') + 'đ';
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

function formatDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
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

export default function AdminRegisterPackageScreen({ route, navigation }) {
  const { member, activePkg } = route.params || {};
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Calculate old package details
  let oldPkgRemainingDays = 0;
  let oldPkgTotalDays = 30;
  let oldPkgCredit = 0;
  let hasActiveOldPkg = false;

  if (activePkg) {
    const today = new Date(); today.setHours(0,0,0,0);
    const tuNgayVal = activePkg.tu_ngay ? new Date(activePkg.tu_ngay) : null;
    const denNgayVal = activePkg.den_ngay ? new Date(activePkg.den_ngay) : null;
    if (denNgayVal) {
      denNgayVal.setHours(0,0,0,0);
      oldPkgRemainingDays = Math.max(0, Math.round((denNgayVal - today) / 86400000));
      if (oldPkgRemainingDays > 0) {
        hasActiveOldPkg = true;
      }
      if (tuNgayVal) {
        tuNgayVal.setHours(0,0,0,0);
        oldPkgTotalDays = Math.max(1, Math.round((denNgayVal - tuNgayVal) / 86400000));
      }
      const giaThucTe = activePkg.gia_thuc_te || activePkg.gia || 0;
      oldPkgCredit = Math.round((giaThucTe * oldPkgRemainingDays) / oldPkgTotalDays);
    }
  }

  // States
  const [packages, setPackages] = useState([]);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form inputs
  const [startDate, setStartDate] = useState(() => {
    if (activePkg && oldPkgRemainingDays > 0 && activePkg.den_ngay) {
      const nextDay = new Date(activePkg.den_ngay);
      nextDay.setDate(nextDay.getDate() + 1);
      return `${String(nextDay.getDate()).padStart(2, '0')}/${String(nextDay.getMonth() + 1).padStart(2, '0')}/${nextDay.getFullYear()}`;
    }
    const today = new Date();
    return `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  }); // DD/MM/YYYY

  const [endDate, setEndDate] = useState(''); // DD/MM/YYYY
  const [actualPrice, setActualPrice] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('tien_mat'); // 'tien_mat' | 'chuyen_khoan'
  const [branch, setBranch] = useState(member.chi_nhanh || 'go-vap');
  const [note, setNote] = useState('');

  // Switch package specific states
  const [isSwitch, setIsSwitch] = useState(!!activePkg);
  const [refundAmount, setRefundAmount] = useState(activePkg ? formatInputMoney(String(oldPkgCredit)) : '0');
  const [switchReason, setSwitchReason] = useState('Đổi sang gói mới');

  const DEFAULT_BRANCHES = [
    { id: 'go-vap', ten: 'Chi nhánh Gò Vấp' },
    { id: 'binh-thanh', ten: 'Chi nhánh Bình Thạnh' },
    { id: 'tan-binh', ten: 'Chi nhánh Tân Bình' },
    { id: 'quan-1', ten: 'Chi nhánh Quận 1' }
  ];
  const [branches, setBranches] = useState(DEFAULT_BRANCHES);

  useEffect(() => {
    const loadInitData = async () => {
      try {
        const [pkgRes, branchRes] = await Promise.all([
          api.get('/packages'),
          api.get('/branches')
        ]);
        if (pkgRes.data?.success) {
          // Lọc gói tập đang hoạt động ra nếu là đổi gói để không chọn lại đúng gói cũ
          const list = pkgRes.data.data || [];
          if (activePkg) {
            setPackages(list.filter(g => !g.is_deleted && g.id !== activePkg.goi_tap_id));
          } else {
            setPackages(list.filter(g => !g.is_deleted));
          }
        }
        const branchArr = branchRes.data?.data;
        if (Array.isArray(branchArr) && branchArr.length > 0) {
          setBranches(branchArr);
        }
      } catch (err) {
        console.error('[RegisterPackage] init error:', err?.message);
      } finally {
        setLoading(false);
      }
    };
    loadInitData();
  }, [activePkg]);

  // Tự động tính ngày kết thúc dựa trên gói và ngày bắt đầu
  useEffect(() => {
    if (!selectedPkg) return;

    const startParsed = parseDMY(startDate);
    if (!startParsed) return;

    const soThang = selectedPkg.so_thang || 0;
    const soNgayThem = selectedPkg.so_ngay_them || 0;
    
    if (soThang > 0 || soNgayThem > 0) {
      const end = new Date(startParsed);
      end.setMonth(end.getMonth() + soThang);
      end.setDate(end.getDate() + soNgayThem);
      setEndDate(dateToDMY(end));
    } else {
      setEndDate('');
    }
  }, [selectedPkg, startDate]);

  const handleSelectPackage = (pkg) => {
    setSelectedPkg(pkg);
    setActualPrice(formatInputMoney(String(pkg.gia)));
    if (!activePkg) {
      setPaidAmount(formatInputMoney(String(pkg.gia)));
    }
  };

  const handleRegister = async () => {
    if (!selectedPkg) {
      Alert.alert('Lỗi', 'Vui lòng chọn một gói tập Gym.');
      return;
    }

    const ymdStart = convertDMYToYMD(startDate);
    if (!ymdStart || !/^\d{4}-\d{2}-\d{2}$/.test(ymdStart)) {
      Alert.alert('Lỗi', 'Ngày bắt đầu phải đúng định dạng DD/MM/YYYY (VD: 25/05/2026).');
      return;
    }

    const price = parseInputMoney(actualPrice);
    if (price < 0) {
      Alert.alert('Lỗi', 'Giá thực tế không hợp lệ.');
      return;
    }

    setSubmitting(true);
    try {
      if (isSwitch) {
        const refundVal = parseInputMoney(refundAmount) || 0;
        const maxRefund = activePkg ? (activePkg.gia_thuc_te || activePkg.gia || 0) : 0;
        if (refundVal > maxRefund) {
          Alert.alert('Lỗi', `Số tiền khấu trừ không được vượt quá giá trị gói cũ (${formatPrice(maxRefund)}).`);
          setSubmitting(false);
          return;
        }

        const payload = {
          pkg_id_cu: activePkg.id,
          goi_tap_id_moi: selectedPkg.id,
          tu_ngay: ymdStart,
          ly_do_huy: switchReason.trim() || 'Đổi sang gói mới',
          so_tien_hoan: refundVal,
          gia_thuc_te: price,
          phuong_thuc_tt: paymentMethod,
          ghi_chu_tt: note || 'Đổi gói qua di động'
        };

        const res = await api.post(`/members/${member.id}/package/switch`, payload);
        if (res.data?.success) {
          Alert.alert('Thành công', `Đổi sang gói ${selectedPkg.ten_goi} thành công!`, [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        } else {
          Alert.alert('Lỗi', res.data?.message || 'Đổi gói tập thất bại.');
        }
      } else {
        const paid = parseInputMoney(paidAmount);
        if (paid < 0) {
          Alert.alert('Lỗi', 'Số tiền thu thực tế không hợp lệ.');
          setSubmitting(false);
          return;
        }
        if (paid < price) {
          Alert.alert('Lỗi', `Số tiền thu thực tế không được nhỏ hơn giá thực tế của gói tập (${formatPrice(price)}).`);
          setSubmitting(false);
          return;
        }

        const payload = {
          goi_tap_id: selectedPkg.id,
          tu_ngay: ymdStart,
          gia_thuc_te: price,
          so_tien_da_thu: paid,
          phuong_thuc_tt: paymentMethod,
          ghi_chu_tt: note || 'Đăng ký trực tiếp qua di động',
          chi_nhanh_mua: branch
        };

        const res = await api.post(`/members/${member.id}/package`, payload);
        if (res.data?.success) {
          Alert.alert('Thành công', `Đăng ký gói ${selectedPkg.ten_goi} thành công!`, [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        } else {
          Alert.alert('Lỗi', res.data?.message || 'Đăng ký thất bại.');
        }
      }
    } catch (err) {
      console.error('[RegisterPackage] error:', err?.response?.data || err?.message);
      Alert.alert('Lỗi', err?.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: insets.top, height: 60 + insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <X color={colors.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isSwitch ? 'Đổi Gói Gym' : 'Đăng ký Gói Gym'}
        </Text>
        <TouchableOpacity onPress={handleRegister} disabled={submitting} style={styles.headerBtn}>
          {submitting ? <ActivityIndicator size="small" color={colors.primary} /> : <Save color={colors.primary} size={20} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hội viên */}
        <View style={[styles.memberInfo, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.memberLabel, { color: colors.textSecondary }]}>Đăng ký cho hội viên:</Text>
          <Text style={[styles.memberName, { color: colors.text }]}>{member.ho_ten} ({member.ma_ho_so})</Text>
        </View>

        {/* Banner gói cũ hoạt động và chọn loại giao dịch */}
        {activePkg && (
          <View style={[styles.switchBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Award color={colors.primary} size={18} />
              <Text style={{ fontWeight: '700', fontSize: 13, color: colors.text }}>Gói Gym đang hoạt động</Text>
            </View>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>
              Gói: <Text style={{ fontWeight: '700', color: colors.text }}>{activePkg.ten_goi}</Text> ({formatPrice(activePkg.gia_thuc_te)})
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>
              Thời hạn: {formatDate(activePkg.tu_ngay)} - {formatDate(activePkg.den_ngay)}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 8 }}>
              Còn lại: <Text style={{ fontWeight: '700', color: colors.text }}>{oldPkgRemainingDays} ngày</Text> (Bảo lưu gợi ý: <Text style={{ fontWeight: '700', color: colors.primary }}>{formatPrice(oldPkgCredit)}</Text>)
            </Text>

            <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8, paddingTop: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 }}>Loại giao dịch:</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[
                    styles.txTypeBtn,
                    { borderColor: isSwitch ? colors.primary : colors.border },
                    isSwitch && { backgroundColor: colors.primaryLight }
                  ]}
                  onPress={() => {
                    setIsSwitch(true);
                    setRefundAmount(String(oldPkgCredit));
                  }}
                >
                  <Text style={{ fontSize: 12, color: isSwitch ? colors.primary : colors.textSecondary, fontWeight: isSwitch ? '700' : '500' }}>
                    Đổi gói tập
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.txTypeBtn,
                    { borderColor: !isSwitch ? colors.primary : colors.border },
                    !isSwitch && { backgroundColor: colors.primaryLight }
                  ]}
                  onPress={() => {
                    setIsSwitch(false);
                  }}
                >
                  <Text style={{ fontSize: 12, color: !isSwitch ? colors.primary : colors.textSecondary, fontWeight: !isSwitch ? '700' : '500' }}>
                    Đăng ký song song
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Danh sách gói Gym */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          {isSwitch ? 'Chọn gói tập mới' : 'Chọn gói tập Gym'}
        </Text>
        <View style={styles.packageList}>
          {packages.map((pkg) => {
            const active = selectedPkg?.id === pkg.id;
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
                    Thời hạn: {pkg.so_thang} tháng {pkg.so_ngay_them > 0 ? `+ ${pkg.so_ngay_them} ngày` : ''}
                  </Text>
                </View>
                <Text style={[styles.packagePrice, { color: active ? colors.primary : colors.text, fontWeight: '800' }]}>
                  {formatPrice(pkg.gia)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedPkg && (
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <DatePickerField
              label={activePkg && !isSwitch && oldPkgRemainingDays > 0 ? "Ngày bắt đầu (Tự động nối tiếp gói cũ)" : "Ngày bắt đầu"}
              required
              value={startDate}
              onChangeText={setStartDate}
              placeholder="Chọn ngày bắt đầu"
              colors={colors}
              returnFormat="DD/MM/YYYY"
              disabled={activePkg && !isSwitch && oldPkgRemainingDays > 0}
            />

            {activePkg && !isSwitch && oldPkgRemainingDays > 0 && (
              <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '600', marginTop: -4, marginBottom: 4 }}>
                * Ngày bắt đầu được đặt tự động nối tiếp sau ngày hết hạn của gói hiện tại ({formatDate(activePkg.den_ngay)})
              </Text>
            )}

            <DatePickerField
              label={`Ngày kết thúc${(selectedPkg.so_thang || 0) > 0 || (selectedPkg.so_ngay_them || 0) > 0 ? ' (Tự động tính)' : ''}`}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="Chọn ngày kết thúc"
              colors={colors}
              returnFormat="DD/MM/YYYY"
              disabled={(selectedPkg.so_thang || 0) > 0 || (selectedPkg.so_ngay_them || 0) > 0}
            />


            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <FieldLabel label={isSwitch ? "Giá thực tế gói mới (đ)" : "Giá thực tế (đ)"} required colors={colors} />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
                  value={actualPrice}
                  onChangeText={(val) => setActualPrice(formatInputMoney(val))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              {isSwitch ? (
                <View style={{ flex: 1 }}>
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
              ) : (
                <View style={{ flex: 1 }}>
                  <FieldLabel label="Số tiền thu thực tế (đ)" required colors={colors} />
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
                    value={paidAmount}
                    onChangeText={(val) => setPaidAmount(formatInputMoney(val))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              )}
            </View>

            {isSwitch && (
              <View style={{ marginTop: 4 }}>
                {(() => {
                  const price = parseInputMoney(actualPrice) || 0;
                  const refund = parseInputMoney(refundAmount) || 0;
                  const oldPrice = activePkg ? (activePkg.gia_thuc_te || activePkg.gia || 0) : 0;
                  const isUpgrade = price >= oldPrice;
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

            {isSwitch && (
              <View style={{ marginTop: 4 }}>
                <FieldLabel label="Lý do đổi gói" required colors={colors} />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
                  value={switchReason}
                  onChangeText={setSwitchReason}
                  placeholder="VD: Đổi sang gói lớn hơn"
                  placeholderTextColor={colors.textMuted}
                />
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

            <FieldLabel label="Chi nhánh thanh toán" required colors={colors} />
            <View style={styles.branchSelectRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {branches.map((b) => {
                  const active = branch === b.ten || branch === b.id;
                  return (
                    <TouchableOpacity
                      key={b.id}
                      style={[
                        styles.branchBtn,
                        { borderColor: active ? colors.primary : colors.border },
                        active && { backgroundColor: colors.primaryLight }
                      ]}
                      onPress={() => setBranch(b.ten || b.id)}
                    >
                      <Text style={{ color: active ? colors.primary : colors.textSecondary, fontSize: 12, fontWeight: active ? '700' : '500' }}>
                        {b.ten}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <FieldLabel label="Ghi chú" colors={colors} />
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              placeholder="VD: Duyệt tại quầy, KM giảm giá..."
              placeholderTextColor={colors.textMuted}
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: selectedPkg ? 1 : 0.6 }]}
          onPress={handleRegister}
          disabled={submitting || !selectedPkg}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>
              {isSwitch ? 'Xác nhận Đổi gói' : 'Đăng ký Gói tập'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  switchBanner: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  txTypeBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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

  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 12, marginBottom: 8, paddingLeft: 4 },
  packageList: { gap: 10, marginBottom: 16 },
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
  branchSelectRow: { marginVertical: 6 },
  branchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
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
