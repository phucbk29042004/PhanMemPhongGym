import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, RefreshControl,
  StatusBar, StyleSheet, Text, TouchableOpacity, View,
  Modal, TextInput, Platform, KeyboardAvoidingView, ScrollView
} from 'react-native';
import {
  AlertTriangle, Calendar, CheckCircle2, ChevronRight,
  Clock, CreditCard, DollarSign, ShieldAlert, X, XCircle, Building2, MessageSquare
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

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

function formatInputMoney(val) {
  if (val == null || val === '') return '';
  const clean = String(val).replace(/\D/g, '');
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseInputMoney(val) {
  if (!val) return 0;
  return Number(String(val).replace(/\./g, '')) || 0;
}

export default function AdminPackageRequestsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Form states for approval
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('tien_mat'); // 'tien_mat' | 'chuyen_khoan'
  const [note, setNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.get('/members/package-requests');
      if (res.data?.success) {
        setRequests(res.data.data || []);
      }
    } catch (err) {
      console.error('[AdminPackageRequests] fetch error:', err?.message);
      Alert.alert('Lỗi', 'Không thể lấy danh sách yêu cầu chờ duyệt.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchRequests();
  }, [fetchRequests]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const openApproveModal = (req) => {
    setSelectedReq(req);
    setPaidAmount(formatInputMoney(String(req.gia_thuc_te)));
    setPaymentMethod(req.phuong_thuc_tt || 'tien_mat');
    setNote(req.ghi_chu_gia || 'Duyệt thủ công qua di động');
    setModalVisible(true);
  };

  const handleAction = async (actionType) => {
    if (!selectedReq) return;

    let amount = 0;
    if (actionType === 'approve') {
      amount = parseInputMoney(paidAmount);
      if (amount < 0) {
        Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ.');
        return;
      }
    }

    setActionLoading(true);
    try {
      const payload = actionType === 'approve' 
        ? {
            action: 'approve',
            gia_thuc_te: amount,
            phuong_thuc_tt: paymentMethod,
            ghi_chu_tt: note
          }
        : { action: 'reject' };

      const res = await api.put(`/members/package-requests/${selectedReq.id}/approve`, payload);
      
      if (res.data?.success) {
        Alert.alert('Thành công', actionType === 'approve' ? 'Đã duyệt yêu cầu gia hạn!' : 'Đã từ chối yêu cầu.');
        setModalVisible(false);
        fetchRequests();
      } else {
        Alert.alert('Lỗi', res.data?.message || 'Không thể xử lý yêu cầu.');
      }
    } catch (err) {
      console.error('[AdminPackageRequests] action error:', err?.response?.data || err?.message);
      Alert.alert('Lỗi', err?.response?.data?.message || 'Có lỗi xảy ra khi gọi API.');
    } finally {
      setActionLoading(false);
    }
  };

  const renderRequestItem = ({ item }) => {
    const isPayOS = item.payos_order_code != null;
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => openApproveModal(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatarLetterBox}>
            <Text style={styles.avatarLetter}>
              {item.ho_ten ? item.ho_ten.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <View style={styles.cardHeaderInfo}>
            <Text style={[styles.memberName, { color: colors.text }]}>{item.ho_ten}</Text>
            <Text style={[styles.memberSub, { color: colors.textSecondary }]}>
              {item.ma_ho_so} • {item.chi_nhanh_mua || 'Không chi nhánh'}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
            <Clock color={colors.primary} size={11} strokeWidth={2.5} />
            <Text style={[styles.badgeText, { color: colors.primary }]}>Chờ duyệt</Text>
          </View>
        </View>

        <View style={[styles.cardDivider, { backgroundColor: colors.borderLight }]} />

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Gói đăng ký:</Text>
            <Text style={[styles.infoVal, { color: colors.text, fontWeight: '700' }]}>{item.ten_goi_tap}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Thời gian:</Text>
            <Text style={[styles.infoVal, { color: colors.text }]}>
              {formatDate(item.tu_ngay)} - {formatDate(item.den_ngay)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Thanh toán:</Text>
            <Text style={[styles.infoVal, { color: colors.text }]}>
              {item.phuong_thuc_tt === 'chuyen_khoan' ? 'Chuyển khoản' : 'Tiền mặt'} 
              {isPayOS ? ' (PayOS)' : ''}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Số tiền đề xuất:</Text>
            <Text style={[styles.infoVal, { color: colors.primary, fontWeight: '800', fontSize: 15 }]}>
              {formatPrice(item.gia_thuc_te)}
            </Text>
          </View>
          {item.ghi_chu_gia ? (
            <View style={[styles.noteContainer, { backgroundColor: colors.surfaceVariant }]}>
              <MessageSquare color={colors.textSecondary} size={12} />
              <Text style={[styles.noteText, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.ghi_chu_gia}
              </Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity 
          style={[styles.actionBtnInline, { backgroundColor: colors.primary }]}
          onPress={() => openApproveModal(item)}
        >
          <Text style={styles.actionBtnInlineText}>Xử lý yêu cầu</Text>
          <ChevronRight color="#ffffff" size={16} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setPage(1);
  }, [requests.length]);

  const totalPages = Math.ceil(requests.length / itemsPerPage) || 1;
  const paginatedRequests = requests.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />
      
      {/* Custom Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <X color={colors.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Yêu cầu gia hạn chờ duyệt</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Đang tải danh sách yêu cầu…</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={paginatedRequests}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderRequestItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Clock color={colors.textMuted} size={48} strokeWidth={1.5} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  Không có yêu cầu gia hạn nào chờ duyệt
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface }}>
              <TouchableOpacity
                disabled={page === 1}
                onPress={() => setPage(p => Math.max(1, p - 1))}
                style={{ paddingHorizontal: 16, paddingVertical: 8, opacity: page === 1 ? 0.4 : 1 }}
              >
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Trước</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.text, marginHorizontal: 16, fontWeight: '600' }}>
                Trang {page} / {totalPages}
              </Text>
              <TouchableOpacity
                disabled={page === totalPages}
                onPress={() => setPage(p => Math.min(totalPages, p + 1))}
                style={{ paddingHorizontal: 16, paddingVertical: 8, opacity: page === totalPages ? 0.4 : 1 }}
              >
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Sau</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}


      {/* Modal Xử lý Yêu cầu (Bottom Sheet Style) */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {/* Header Modal */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Xử lý yêu cầu</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  {selectedReq?.ho_ten} ({selectedReq?.ma_ho_so})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <X color={colors.text} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              <View style={[styles.reqSummary, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                <Text style={[styles.reqSummaryText, { color: colors.text }]}>
                  Đăng ký gói: <Text style={{ fontWeight: '700' }}>{selectedReq?.ten_goi_tap}</Text>
                </Text>
                <Text style={[styles.reqSummaryText, { color: colors.text, marginTop: 4 }]}>
                  Thời hạn: <Text style={{ fontWeight: '600' }}>{formatDate(selectedReq?.tu_ngay)} - {formatDate(selectedReq?.den_ngay)}</Text>
                </Text>
                <Text style={[styles.reqSummaryText, { color: colors.text, marginTop: 4 }]}>
                  Chi nhánh: <Text style={{ fontWeight: '600' }}>{selectedReq?.chi_nhanh_mua || '—'}</Text>
                </Text>
              </View>

              {/* Form Duyệt */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Số tiền thực tế thu (đ)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
                value={paidAmount}
                onChangeText={(val) => setPaidAmount(formatInputMoney(val))}
                keyboardType="numeric"
                placeholder="Nhập số tiền thực tế..."
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Phương thức thanh toán</Text>
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
                      <Text style={[
                        styles.paymentMethodBtnText, 
                        { color: active ? colors.primary : colors.textSecondary, fontWeight: active ? '700' : '500' }
                      ]}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Ghi chú duyệt</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
                placeholder="Nhập ghi chú thu tiền..."
                placeholderTextColor={colors.textMuted}
              />
            </ScrollView>

            {/* Modal Actions */}
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn, { borderColor: colors.danger }]}
                onPress={() => handleAction('reject')}
                disabled={actionLoading}
              >
                <XCircle color={colors.danger} size={16} />
                <Text style={[styles.actionBtnText, { color: colors.danger }]}>Từ chối</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.approveBtn, { backgroundColor: colors.primary }]}
                onPress={() => handleAction('approve')}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <CheckCircle2 color="#ffffff" size={16} />
                    <Text style={[styles.actionBtnText, { color: '#ffffff' }]}>Duyệt gói</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  listContent: { padding: 16, paddingBottom: 32 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 13 },
  emptyBox: { paddingVertical: 100, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },

  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden'
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarLetterBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1D933622',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarLetter: { color: '#1D9336', fontSize: 16, fontWeight: '800' },
  cardHeaderInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '700' },
  memberSub: { fontSize: 11, marginTop: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  cardDivider: { height: 1, marginVertical: 12 },
  cardBody: { gap: 6, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 12 },
  infoVal: { fontSize: 12, fontWeight: '600' },
  noteContainer: {
    flexDirection: 'row',
    gap: 6,
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
    alignItems: 'center'
  },
  noteText: { fontSize: 11, flex: 1 },
  actionBtnInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  actionBtnInlineText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },

  // Modal styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  modalTitle: { fontSize: 17, fontWeight: '800' },
  modalSubtitle: { fontSize: 12, marginTop: 2 },
  modalCloseBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#f0f2f511' },
  modalScroll: { padding: 20, gap: 14 },
  reqSummary: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 4 },
  reqSummaryText: { fontSize: 12 },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
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
  paymentMethodRow: { flexDirection: 'row', gap: 10 },
  paymentMethodBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  paymentMethodBtnText: { fontSize: 13 },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  rejectBtn: { borderWidth: 1 },
  approveBtn: {},
  actionBtnText: { fontSize: 14, fontWeight: '800' }
});
