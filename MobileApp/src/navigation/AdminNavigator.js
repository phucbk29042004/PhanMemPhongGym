import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  BarChart3, Package, Users, User, LayoutDashboard,
} from 'lucide-react-native';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminMembersScreen from '../screens/admin/AdminMembersScreen';
import AdminPTScreen from '../screens/admin/AdminPTScreen';
import AdminPackagesScreen from '../screens/admin/AdminPackagesScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';

const Tab = createBottomTabNavigator();

const BRAND_GREEN = '#1D9336';
const INACTIVE_COLOR = '#9CA3AF';

function TabIcon({ IconComponent, color, focused }) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
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

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: BRAND_GREEN,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          tabBarLabel: ({ color, focused }) => <TabLabel label="Tổng quan" color={color} focused={focused} />,
          tabBarIcon: ({ color, focused }) => <TabIcon IconComponent={LayoutDashboard} color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="AdminMembers"
        component={AdminMembersScreen}
        options={{
          tabBarLabel: ({ color, focused }) => <TabLabel label="Hội viên" color={color} focused={focused} />,
          tabBarIcon: ({ color, focused }) => <TabIcon IconComponent={Users} color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="AdminPT"
        component={AdminPTScreen}
        options={{
          tabBarLabel: ({ color, focused }) => <TabLabel label="PT" color={color} focused={focused} />,
          tabBarIcon: ({ color, focused }) => <TabIcon IconComponent={BarChart3} color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="AdminPackages"
        component={AdminPackagesScreen}
        options={{
          tabBarLabel: ({ color, focused }) => <TabLabel label="Gói tập" color={color} focused={focused} />,
          tabBarIcon: ({ color, focused }) => <TabIcon IconComponent={Package} color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="AdminProfile"
        component={AdminProfileScreen}
        options={{
          tabBarLabel: ({ color, focused }) => <TabLabel label="Tài khoản" color={color} focused={focused} />,
          tabBarIcon: ({ color, focused }) => <TabIcon IconComponent={User} color={color} focused={focused} />,
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
  tabLabel: { fontSize: 10, marginTop: 2, letterSpacing: 0.1 },
  iconContainer: {
    width: 40, height: 28,
    alignItems: 'center', justifyContent: 'center', borderRadius: 14,
  },
  iconContainerActive: { backgroundColor: '#e6f4ea' },
});
