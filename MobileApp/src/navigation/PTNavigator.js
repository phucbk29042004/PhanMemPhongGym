import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Bell, Calendar, Home, QrCode, User,
} from 'lucide-react-native';
import PTHomeScreen from '../screens/pt/PTHomeScreen';
import PTQRCodeScreen from '../screens/pt/PTQRCodeScreen';
import PTScheduleScreen from '../screens/pt/PTScheduleScreen';
import PTNotificationScreen from '../screens/pt/PTNotificationScreen';
import PTProfileScreen from '../screens/pt/PTProfileScreen';
import GymRulesScreen from '../screens/shared/GymRulesScreen';
import { useNotificationStore } from '../store/useNotificationStore';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

// Icon container
function TabIcon({ IconComponent, color, focused, colors }) {
  const activeBg = colors?.primaryLight || '#e6f4ea';
  return (
    <View style={[styles.iconContainer, focused && { backgroundColor: activeBg }]}>
      <IconComponent color={color} size={22} strokeWidth={focused ? 2.5 : 1.8} />
    </View>
  );
}

// Label tab
function TabLabel({ label, color, focused }) {
  return (
    <Text style={[styles.tabLabel, { color, fontWeight: focused ? '700' : '500' }]}>
      {label}
    </Text>
  );
}

export default function PTNavigator() {
  const { colors } = useTheme();
  const unreadCount = useNotificationStore(state => state.unreadCount);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: [styles.tabBar, { backgroundColor: colors.surface, borderTopColor: colors.border }],
      }}
    >
      {/* Tab 1: Tổng quan */}
      <Tab.Screen
        name="Home"
        component={PTHomeScreen}
        options={{
          tabBarLabel: ({ color, focused }) => <TabLabel label="Tổng quan" color={color} focused={focused} />,
          tabBarIcon: ({ color, focused }) => <TabIcon IconComponent={Home} color={color} focused={focused} colors={colors} />,
        }}
      />

      {/* Tab 2: Lịch dạy */}
      <Tab.Screen
        name="Schedule"
        component={PTScheduleScreen}
        options={{
          tabBarLabel: ({ color, focused }) => <TabLabel label="Lịch dạy" color={color} focused={focused} />,
          tabBarIcon: ({ color, focused }) => <TabIcon IconComponent={Calendar} color={color} focused={focused} colors={colors} />,
        }}
      />

      {/* Tab 3 (giữa, nổi bật): QR Check-in */}
      <Tab.Screen
        name="QRCode"
        component={PTQRCodeScreen}
        options={{
          tabBarLabel: ({ color, focused }) => (
            <Text style={[styles.tabLabelCenter, { color: focused ? colors.primary : colors.textMuted }]}>
              QR
            </Text>
          ),
          tabBarIcon: ({ focused }) => (
            <View style={[
              styles.centerTabIcon,
              { backgroundColor: colors.primaryLight },
              focused && { backgroundColor: colors.primary, shadowColor: colors.primary }
            ]}>
              <QrCode
                color={focused ? '#fff' : colors.textMuted}
                size={24}
                strokeWidth={2}
              />
            </View>
          ),
        }}
      />

      {/* Tab 4: Thông báo */}
      <Tab.Screen
        name="Notifications"
        component={PTNotificationScreen}
        options={{
          tabBarLabel: ({ color, focused }) => <TabLabel label="Thông báo" color={color} focused={focused} />,
          tabBarIcon: ({ color, focused }) => <TabIcon IconComponent={Bell} color={color} focused={focused} colors={colors} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : null,
          tabBarBadgeStyle: {
            backgroundColor: '#dc2626',
            fontSize: 10,
            lineHeight: 14,
          }
        }}
      />

      {/* Tab 5: Cá nhân */}
      <Tab.Screen
        name="Profile"
        component={PTProfileScreen}
        options={{
          tabBarLabel: ({ color, focused }) => <TabLabel label="Cá nhân" color={color} focused={focused} />,
          tabBarIcon: ({ color, focused }) => <TabIcon IconComponent={User} color={color} focused={focused} colors={colors} />,
        }}
      />

      {/* Màn hình ẩn khỏi tab bar: Nội quy phòng tập */}
      <Tab.Screen
        name="GymRules"
        component={GymRulesScreen}
        options={{
          tabBarItemStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    paddingBottom: 10,
    paddingTop: 6,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f2f5',
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  tabLabelCenter: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  iconContainer: {
    width: 40,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  iconContainerActive: {
    backgroundColor: '#e6f4ea',
  },
  centerTabIcon: {
    width: 50,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e6f4ea',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -6,
  },
  centerTabIconActive: {
    backgroundColor: '#1D9336',
    shadowColor: '#1D9336',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});
