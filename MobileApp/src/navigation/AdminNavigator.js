import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Package, Users, User, LayoutDashboard, UserCog,
} from 'lucide-react-native';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminMembersScreen from '../screens/admin/AdminMembersScreen';
import AdminPTScreen from '../screens/admin/AdminPTScreen';
import AdminPackagesScreen from '../screens/admin/AdminPackagesScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';
import AdminStaffScreen from '../screens/admin/AdminStaffScreen';

// Màn hình stack phụ (không có tab bar)
import AdminPackageRequestsScreen from '../screens/admin/AdminPackageRequestsScreen';
import AdminMemberDetailScreen from '../screens/admin/AdminMemberDetailScreen';
import AdminAddEditMemberScreen from '../screens/admin/AdminAddEditMemberScreen';
import AdminRegisterPackageScreen from '../screens/admin/AdminRegisterPackageScreen';
import AdminRegisterPTScreen from '../screens/admin/AdminRegisterPTScreen';
import AdminAddEditPTScreen from '../screens/admin/AdminAddEditPTScreen';
import AdminAddEditPackageScreen from '../screens/admin/AdminAddEditPackageScreen';
import AdminRevenueScreen from '../screens/admin/AdminRevenueScreen';
import AdminRegisterPTScheduleScreen from '../screens/admin/AdminRegisterPTScheduleScreen';
import AdminExpiredMembersScreen from '../screens/admin/AdminExpiredMembersScreen';
import GymRulesScreen from '../screens/shared/GymRulesScreen';

import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ IconComponent, color, focused, colors }) {
  const activeBg = colors?.primaryLight || '#e6f4ea';
  return (
    <View style={[styles.iconContainer, focused && { backgroundColor: activeBg }]}>
      <IconComponent color={color} size={22} strokeWidth={focused ? 2.5 : 1.8} />
    </View>
  );
}

function TabLabel({ label, color, focused }) {
  return (
    <Text style={[styles.tabLabel, { color, fontWeight: focused ? '700' : '500' }]}>
      {label}
    </Text>
  );
}

// ── Tab Navigator (5 tab chính, KHÔNG có màn hình phụ) ──────────────
function AdminTabs() {
  const { colors } = useTheme();

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
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          tabBarLabel: ({ color, focused }) => <TabLabel label="Tổng quan" color={color} focused={focused} />,
          tabBarIcon: ({ color, focused }) => <TabIcon IconComponent={LayoutDashboard} color={color} focused={focused} colors={colors} />,
        }}
      />
      <Tab.Screen
        name="AdminMembers"
        component={AdminMembersScreen}
        options={{
          tabBarLabel: ({ color, focused }) => <TabLabel label="Hội viên" color={color} focused={focused} />,
          tabBarIcon: ({ color, focused }) => <TabIcon IconComponent={Users} color={color} focused={focused} colors={colors} />,
        }}
      />
      <Tab.Screen
        name="AdminStaffTab"
        component={AdminStaffScreen}
        options={{
          tabBarLabel: ({ color, focused }) => <TabLabel label="Nhân viên" color={color} focused={focused} />,
          tabBarIcon: ({ color, focused }) => <TabIcon IconComponent={UserCog} color={color} focused={focused} colors={colors} />,
        }}
      />
      <Tab.Screen
        name="AdminPackages"
        component={AdminPackagesScreen}
        options={{
          tabBarLabel: ({ color, focused }) => <TabLabel label="Gói tập" color={color} focused={focused} />,
          tabBarIcon: ({ color, focused }) => <TabIcon IconComponent={Package} color={color} focused={focused} colors={colors} />,
        }}
      />
      <Tab.Screen
        name="AdminProfile"
        component={AdminProfileScreen}
        options={{
          tabBarLabel: ({ color, focused }) => <TabLabel label="Tài khoản" color={color} focused={focused} />,
          tabBarIcon: ({ color, focused }) => <TabIcon IconComponent={User} color={color} focused={focused} colors={colors} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ── Stack Navigator bao ngoài (gồm Tab + các màn hình detail/form) ──
export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Màn hình chính với Tab bar */}
      <Stack.Screen name="AdminTabs" component={AdminTabs} />

      {/* Màn hình phụ — KHÔNG có tab bar */}
      <Stack.Screen name="AdminPackageRequests" component={AdminPackageRequestsScreen} />
      <Stack.Screen name="AdminMemberDetail" component={AdminMemberDetailScreen} />
      <Stack.Screen name="AdminAddEditMember" component={AdminAddEditMemberScreen} />
      <Stack.Screen name="AdminRegisterPackage" component={AdminRegisterPackageScreen} />
      <Stack.Screen name="AdminRegisterPT" component={AdminRegisterPTScreen} />
      <Stack.Screen name="AdminAddEditPT" component={AdminAddEditPTScreen} />
      <Stack.Screen name="AdminAddEditPackage" component={AdminAddEditPackageScreen} />
      <Stack.Screen name="AdminRevenue" component={AdminRevenueScreen} />
      <Stack.Screen name="AdminRegisterPTSchedule" component={AdminRegisterPTScheduleScreen} />
      <Stack.Screen name="AdminExpiredMembers" component={AdminExpiredMembersScreen} />
      <Stack.Screen name="AdminPT" component={AdminPTScreen} />
      <Stack.Screen name="AdminStaff" component={AdminStaffScreen} />
      <Stack.Screen name="GymRules" component={GymRulesScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    paddingBottom: 10,
    paddingTop: 6,
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
  },
  tabLabel: { fontSize: 10, marginTop: 2, letterSpacing: 0.1 },
  iconContainer: {
    width: 40, height: 28,
    alignItems: 'center', justifyContent: 'center', borderRadius: 14,
  },
});
