import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Calendar, Home, QrCode, User, Users,
} from 'lucide-react-native';
import PTHomeScreen from '../screens/pt/PTHomeScreen';
import PTQRCodeScreen from '../screens/pt/PTQRCodeScreen';
import PTScheduleScreen from '../screens/pt/PTScheduleScreen';
import PTStudentsScreen from '../screens/pt/PTStudentsScreen';
import PTProfileScreen from '../screens/pt/PTProfileScreen';

const Tab = createBottomTabNavigator();

const BRAND_GREEN = '#1D9336';
const INACTIVE_COLOR = '#9CA3AF';

// Icon container
function TabIcon({ IconComponent, color, focused }) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
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
      {/* Tab 1: Tổng quan */}
      <Tab.Screen
        name="Home"
        component={PTHomeScreen}
        options={{
          tabBarLabel: ({ color, focused }) => <TabLabel label="Tổng quan" color={color} focused={focused} />,
          tabBarIcon: ({ color, focused }) => <TabIcon IconComponent={Home} color={color} focused={focused} />,
        }}
      />

      {/* Tab 2: Lịch dạy */}
      <Tab.Screen
        name="Schedule"
        component={PTScheduleScreen}
        options={{
          tabBarLabel: ({ color, focused }) => <TabLabel label="Lịch dạy" color={color} focused={focused} />,
          tabBarIcon: ({ color, focused }) => <TabIcon IconComponent={Calendar} color={color} focused={focused} />,
        }}
      />

      {/* Tab 3 (giữa, nổi bật): QR Check-in */}
      <Tab.Screen
        name="QRCode"
        component={PTQRCodeScreen}
        options={{
          tabBarLabel: ({ color, focused }) => (
            <Text style={[styles.tabLabelCenter, { color: focused ? BRAND_GREEN : INACTIVE_COLOR }]}>
              QR
            </Text>
          ),
          tabBarIcon: ({ focused }) => (
            <View style={[styles.centerTabIcon, focused && styles.centerTabIconActive]}>
              <QrCode
                color={focused ? '#fff' : INACTIVE_COLOR}
                size={24}
                strokeWidth={2}
              />
            </View>
          ),
        }}
      />

      {/* Tab 4: Học viên */}
      <Tab.Screen
        name="Members"
        component={PTStudentsScreen}
        options={{
          tabBarLabel: ({ color, focused }) => <TabLabel label="Học viên" color={color} focused={focused} />,
          tabBarIcon: ({ color, focused }) => <TabIcon IconComponent={Users} color={color} focused={focused} />,
        }}
      />

      {/* Tab 5: Cá nhân */}
      <Tab.Screen
        name="Profile"
        component={PTProfileScreen}
        options={{
          tabBarLabel: ({ color, focused }) => <TabLabel label="Cá nhân" color={color} focused={focused} />,
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
    backgroundColor: BRAND_GREEN,
    shadowColor: BRAND_GREEN,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});
