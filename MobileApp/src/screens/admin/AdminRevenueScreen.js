import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  Activity,
  Award,
  Zap,
} from 'lucide-react-native';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
  Line,
  Rect,
} from 'react-native-svg';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

function formatPrice(val) {
  if (val == null) return '0đ';
  return Number(val).toLocaleString('vi-VN') + 'đ';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
}

export default function AdminRevenueScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [filter, setFilter] = useState('7'); // 'today' | '7' | '30'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);

  const fetchRevenueData = useCallback(async (selectedFilter) => {
    try {
      if (selectedFilter === 'today') {
        const res = await api.get('/revenue/today');
        if (res.data?.success) {
          setData({ type: 'today', ...res.data.data });
        }
      } else {
        const days = parseInt(selectedFilter);
        const res = await api.get(`/revenue?days=${days}`);
        if (res.data?.success) {
          setData({ type: 'period', ...res.data.data });
        }
      }
    } catch (err) {
      console.error('[AdminRevenue] fetch error:', err?.message);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu doanh thu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchRevenueData(filter);
  }, [filter, fetchRevenueData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRevenueData(filter);
  };

  // Render Stat Cards
  const renderStats = () => {
    if (!data) return null;

    let total = 0;
    let gymRev = 0;
    let ptRev = 0;
    let subVal = '';
    let subLabel = '';

    if (data.type === 'today') {
      total = data.tong_tien || 0;
      gymRev = data.tien_goi_tap || 0;
      ptRev = data.tien_goi_pt || 0;
      const diff = total - (data.hom_qua || 0);
      const isUp = diff >= 0;
      subVal = formatPrice(Math.abs(diff));
      subLabel = isUp ? 'tăng so với hôm qua' : 'giảm so với hôm qua';
    } else {
      total = data.summary?.tong_doanh_thu || 0;
      gymRev = data.summary?.tong_goi_tap || 0;
      ptRev = data.summary?.tong_goi_pt || 0;
      subVal = formatPrice(data.summary?.trung_binh_ngay || 0);
      subLabel = 'trung bình mỗi ngày';
    }

    return (
      <View style={styles.statsGrid}>
        {/* Tổng doanh thu */}
        <View style={[styles.statCard, { backgroundColor: colors.surface, width: '100%' }]}>
          <View style={styles.statHeader}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              {data.type === 'today' ? 'Doanh thu hôm nay' : `Doanh thu ${filter} ngày qua`}
            </Text>
            <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
              <DollarSign size={20} color={colors.primary} />
            </View>
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{formatPrice(total)}</Text>
          <View style={styles.statFooter}>
            <TrendingUp size={12} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.statSubText, { color: colors.primary }]}>{subVal} </Text>
            <Text style={[styles.statSubLabel, { color: colors.textMuted }]}>{subLabel}</Text>
          </View>
        </View>

        {/* Gói Gym */}
        <View style={[styles.statCard, { backgroundColor: colors.surface, width: '48%' }]}>
          <View style={styles.statHeader}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Gói Gym</Text>
            <View style={[styles.iconContainer, { backgroundColor: '#e0f2fe' }]}>
              <Award size={16} color="#0284c7" />
            </View>
          </View>
          <Text style={[styles.statValueSmall, { color: colors.text }]}>{formatPrice(gymRev)}</Text>
          <Text style={[styles.statPercent, { color: colors.textMuted }]}>
            {total > 0 ? ((gymRev / total) * 100).toFixed(0) : 0}% tỷ trọng
          </Text>
        </View>

        {/* Gói PT */}
        <View style={[styles.statCard, { backgroundColor: colors.surface, width: '48%' }]}>
          <View style={styles.statHeader}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Gói PT</Text>
            <View style={[styles.iconContainer, { backgroundColor: '#f3e8ff' }]}>
              <Zap size={16} color="#7c3aed" />
            </View>
          </View>
          <Text style={[styles.statValueSmall, { color: colors.text }]}>{formatPrice(ptRev)}</Text>
          <Text style={[styles.statPercent, { color: colors.textMuted }]}>
            {total > 0 ? ((ptRev / total) * 100).toFixed(0) : 0}% tỷ trọng
          </Text>
        </View>
      </View>
    );
  };

  // Draw line/area chart using react-native-svg
  const renderChart = () => {
    if (!data || data.type === 'today' || !data.daily || data.daily.length < 2) {
      return null;
    }

    const chartHeight = 180;
    const paddingLeft = 45;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 30;
    const chartWidth = screenWidth - 32;

    const dailyData = data.daily;
    const maxVal = Math.max(...dailyData.map((d) => d.tong_tien || 0), 1000000);
    const pointsCount = dailyData.length;

    // Generate x, y coordinates
    const points = dailyData.map((item, idx) => {
      const x = paddingLeft + (idx * (chartWidth - paddingLeft - paddingRight)) / (pointsCount - 1);
      const y = chartHeight - paddingBottom - ((item.tong_tien || 0) / maxVal) * (chartHeight - paddingTop - paddingBottom);
      return { x, y, value: item.tong_tien || 0, label: formatDate(item.ngay) };
    });

    // Create Path commands
    let pathD = '';
    let areaD = '';

    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      areaD = `M ${points[0].x} ${chartHeight - paddingBottom} L ${points[0].x} ${points[0].y}`;

      for (let i = 1; i < points.length; i++) {
        pathD += ` L ${points[i].x} ${points[i].y}`;
        areaD += ` L ${points[i].x} ${points[i].y}`;
      }

      areaD += ` L ${points[points.length - 1].x} ${chartHeight - paddingBottom} Z`;
    }

    // Grid lines count
    const gridLines = 4;
    const gridYValues = Array.from({ length: gridLines }, (_, i) => {
      const val = (maxVal / (gridLines - 1)) * i;
      const y = chartHeight - paddingBottom - (val / maxVal) * (chartHeight - paddingTop - paddingBottom);
      return { y, label: formatPrice(val) };
    });

    // Sub-select points for date labels to avoid crowding
    const labelStep = Math.max(1, Math.floor(pointsCount / 5));

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Biểu đồ doanh thu hàng ngày</Text>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.25} />
              <Stop offset="100%" stopColor={colors.primary} stopOpacity={0.0} />
            </LinearGradient>
          </Defs>

          {/* Grid lines & Y labels */}
          {gridYValues.map((line, idx) => (
            <React.Fragment key={idx}>
              <Line
                x1={paddingLeft}
                y1={line.y}
                x2={chartWidth - paddingRight}
                y2={line.y}
                stroke={isDark ? '#374151' : '#e5e7eb'}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <SvgText
                x={paddingLeft - 8}
                y={line.y + 4}
                fill={colors.textMuted}
                fontSize={9}
                fontWeight="500"
                textAnchor="end"
              >
                {line.label}
              </SvgText>
            </React.Fragment>
          ))}

          {/* Area Chart Fill */}
          {areaD !== '' && <Path d={areaD} fill="url(#areaGradient)" />}

          {/* Line Chart Stroke */}
          {pathD !== '' && (
            <Path d={pathD} fill="none" stroke={colors.primary} strokeWidth={2.5} />
          )}

          {/* Circle markers */}
          {points.map((pt, idx) => {
            // Draw circle marker only if N is not too large or on selected intervals
            const showMarker = pointsCount <= 15 || idx % labelStep === 0 || idx === pointsCount - 1;
            if (!showMarker) return null;

            return (
              <Circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r={4}
                fill={colors.surface}
                stroke={colors.primary}
                strokeWidth={2}
              />
            );
          })}

          {/* X axis labels */}
          {points.map((pt, idx) => {
            if (idx % labelStep === 0 || idx === pointsCount - 1) {
              return (
                <SvgText
                  key={idx}
                  x={pt.x}
                  y={chartHeight - 10}
                  fill={colors.textMuted}
                  fontSize={9}
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {pt.label}
                </SvgText>
              );
            }
            return null;
          })}
        </Svg>
      </View>
    );
  };

  // Render Table List
  const renderList = () => {
    if (!data) return null;

    if (data.type === 'today') {
      const txs = data.giao_dich || [];
      return (
        <View style={styles.listSection}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Chi tiết giao dịch hôm nay</Text>
          {txs.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>Chưa có giao dịch nào hôm nay</Text>
            </View>
          ) : (
            <View style={[styles.listCard, { backgroundColor: colors.surface }]}>
              {txs.map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.txRow,
                    { borderBottomColor: idx < txs.length - 1 ? colors.border : 'transparent' },
                  ]}
                >
                  <View style={styles.txLeft}>
                    <Text style={[styles.txTitle, { color: colors.text }]} numberOfLines={1}>
                      {item.khach_hang}
                    </Text>
                    <Text style={[styles.txSubtitle, { color: colors.textSecondary }]}>
                      {item.san_pham} •{' '}
                      <Text
                        style={{
                          fontWeight: '700',
                          color: item.loai === 'goi_tap' ? colors.primary : '#8b5cf6',
                        }}
                      >
                        {item.loai === 'goi_tap' ? 'Gym' : 'PT'}
                      </Text>
                    </Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, { color: colors.primary }]}>
                      {formatPrice(item.gia_thuc_te)}
                    </Text>
                    <Text style={[styles.txTime, { color: colors.textMuted }]}>
                      {new Date(item.thoi_gian).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    } else {
      const stats = data.packageStats || [];
      return (
        <View style={styles.listSection}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Doanh số theo gói Gym</Text>
          {stats.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>Chưa bán được gói nào kỳ này</Text>
            </View>
          ) : (
            <View style={[styles.listCard, { backgroundColor: colors.surface }]}>
              {stats.map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.txRow,
                    { borderBottomColor: idx < stats.length - 1 ? colors.border : 'transparent' },
                  ]}
                >
                  <View style={styles.txLeft}>
                    <Text style={[styles.txTitle, { color: colors.text }]} numberOfLines={1}>
                      {item.ten_goi}
                    </Text>
                    <Text style={[styles.txSubtitle, { color: colors.textSecondary }]}>
                      {item.so_dang_ky} lượt đăng ký
                    </Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, { color: colors.text, fontWeight: '700' }]}>
                      {formatPrice(item.tong_tien)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            paddingTop: insets.top,
            height: 60 + insets.top,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft color={colors.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Phân tích doanh thu</Text>
        <View style={styles.headerBtn} />
      </View>

      {/* Pill Filters */}
      <View style={[styles.filterBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {[
          { key: 'today', label: 'Hôm nay' },
          { key: '7', label: '7 ngày' },
          { key: '30', label: '30 ngày' },
        ].map((item) => {
          const active = filter === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.filterPill,
                { backgroundColor: active ? colors.primary : colors.surfaceVariant },
              ]}
              onPress={() => setFilter(item.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: active ? '#ffffff' : colors.textSecondary, fontWeight: active ? '700' : '500' },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.scroll}
      >
        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 12, color: colors.textMuted, fontSize: 13 }}>
              Đang tải báo cáo doanh thu…
            </Text>
          </View>
        ) : (
          <>
            {/* Stat cards */}
            {renderStats()}

            {/* SVG line chart (for 7d / 30d views) */}
            {renderChart()}

            {/* List / detail sections */}
            {renderList()}

            <View style={{ height: 24 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800' },

  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: { fontSize: 13 },

  scroll: { padding: 16 },
  loaderBox: { paddingVertical: 100, alignItems: 'center' },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statLabel: { fontSize: 12, fontWeight: '600' },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: 26, fontWeight: '900' },
  statValueSmall: { fontSize: 20, fontWeight: '800', marginVertical: 4 },
  statFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statSubText: { fontSize: 11, fontWeight: '700' },
  statSubLabel: { fontSize: 11 },
  statPercent: { fontSize: 11, fontWeight: '600', marginTop: 2 },

  chartContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '800',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },

  listSection: { marginTop: 8 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingLeft: 2,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  txLeft: { flex: 1, marginRight: 16 },
  txTitle: { fontSize: 14, fontWeight: '700' },
  txSubtitle: { fontSize: 12, marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 14, fontWeight: '800' },
  txTime: { fontSize: 11, marginTop: 2 },
});
