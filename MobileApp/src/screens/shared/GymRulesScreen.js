import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { ArrowLeft, ChevronDown, ChevronUp, BookOpen, User, Users, GraduationCap, Building2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

// Kích hoạt LayoutAnimation trên Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const BRAND = {
  primary: '#1D9336',
  primaryDark: '#155f27',
  primaryLight: '#e6f4ea',
  danger: '#dc2626',
};

export default function GymRulesScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tat_ca'); // tat_ca, hoi_vien, pt, nhan_vien
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await api.get('/config/rules');
      if (res.data?.success) {
        setRules(res.data.data || []);
      }
    } catch (err) {
      console.error('[GymRulesScreen] fetch rules error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAccordion = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  const filterRules = (target) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(target);
    setExpandedId(null);
  };

  // Lọc nội quy theo tab hiện tại
  const displayRules = rules.filter(r => r.ap_dung_cho === activeTab);

  const tabs = [
    { id: 'tat_ca', label: 'Quy định chung', icon: Building2 },
    { id: 'hoi_vien', label: 'Hội viên', icon: Users },
    { id: 'pt', label: 'PT / HLV', icon: GraduationCap },
    { id: 'nhan_vien', label: 'Nhân viên', icon: User },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      
      {/* ── Custom Header ──────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft color={colors.text} size={22} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Nội quy phòng tập</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Tab Bar ────────────────────────────────────────────── */}
      <View style={[styles.tabBarContainer, { backgroundColor: colors.surface }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarScroll}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;
            
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabItem,
                  isActive && { backgroundColor: isDark ? '#155f27' : BRAND.primaryLight }
                ]}
                onPress={() => filterRules(tab.id)}
                activeOpacity={0.8}
              >
                <TabIcon 
                  color={isActive ? BRAND.primary : colors.textMuted} 
                  size={16} 
                  strokeWidth={2.5} 
                />
                <Text 
                  style={[
                    styles.tabLabel, 
                    { color: colors.textMuted },
                    isActive && { color: BRAND.primary, fontWeight: '800' }
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Main Content Area ──────────────────────────────────── */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={BRAND.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Đang tải nội quy...
          </Text>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
        >
          {displayRules.length === 0 ? (
            <View style={styles.emptyBox}>
              <BookOpen color={colors.textMuted} size={48} strokeWidth={1.5} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                Không có quy định riêng nào
              </Text>
              <Text style={[styles.emptySubText, { color: colors.textMuted }]}>
                Mời bạn tham khảo quy định chung của phòng tập.
              </Text>
            </View>
          ) : (
            displayRules.map((rule, idx) => {
              const isExpanded = expandedId === rule.id;
              
              return (
                <View 
                  key={rule.id} 
                  style={[
                    styles.card, 
                    { 
                      backgroundColor: colors.surface,
                      borderColor: colors.border
                    },
                    isExpanded && {
                      borderColor: BRAND.primary,
                      shadowColor: BRAND.primary,
                      shadowOpacity: 0.08,
                      shadowRadius: 10,
                      elevation: 4
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={styles.cardHeader}
                    onPress={() => toggleAccordion(rule.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardHeaderTitleRow}>
                      <View style={[styles.indexBadge, { backgroundColor: isDark ? '#1b3a24' : BRAND.primaryLight }]}>
                        <Text style={[styles.indexText, { color: BRAND.primary }]}>
                          {rule.thu_tu || (idx + 1)}
                        </Text>
                      </View>
                      <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                        {rule.tieu_de}
                      </Text>
                    </View>
                    
                    <View style={styles.chevronBox}>
                      {isExpanded ? (
                        <ChevronUp color={BRAND.primary} size={20} strokeWidth={2.5} />
                      ) : (
                        <ChevronDown color={colors.textMuted} size={20} strokeWidth={2.5} />
                      )}
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={[styles.cardContent, { borderTopColor: colors.border }]}>
                      <Text style={[styles.cardDescription, { color: colors.text }]}>
                        {rule.noi_dung}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  tabBarContainer: {
    height: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e3e8',
  },
  tabBarScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 12
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
    gap: 12
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  cardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  indexBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    fontSize: 12,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    lineHeight: 18,
  },
  chevronBox: {
    marginLeft: 10,
  },
  cardContent: {
    borderTopWidth: 1,
    padding: 14,
    backgroundColor: 'rgba(0,0,0,0.01)',
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
});
