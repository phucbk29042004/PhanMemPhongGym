import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, QrCode, Calendar, User } from 'lucide-react-native';
import MemberHomeScreen from '../screens/member/MemberHomeScreen';
import MemberQRCodeScreen from '../screens/member/MemberQRCodeScreen';
import MemberScheduleScreen from '../screens/member/MemberScheduleScreen';
import MemberProfileScreen from '../screens/member/MemberProfileScreen';

const Tab = createBottomTabNavigator();

export default function MemberNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1D9336', // Sync with FE Main brand green
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { 
          height: 65, 
          paddingBottom: 10, 
          paddingTop: 8,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#ebeef3',
          elevation: 10,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2
        }
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={MemberHomeScreen} 
        options={{ 
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ color, size }) => <Home color={color} size={22} />
        }} 
      />
      <Tab.Screen 
        name="QR" 
        component={MemberQRCodeScreen} 
        options={{ 
          tabBarLabel: 'Check-in',
          tabBarIcon: ({ color, size }) => <QrCode color={color} size={22} />
        }} 
      />
      <Tab.Screen 
        name="Schedule" 
        component={MemberScheduleScreen} 
        options={{ 
          tabBarLabel: 'Lịch tập',
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={22} />
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={MemberProfileScreen} 
        options={{ 
          tabBarLabel: 'Cá nhân',
          tabBarIcon: ({ color, size }) => <User color={color} size={22} />
        }} 
      />
    </Tab.Navigator>
  );
}
