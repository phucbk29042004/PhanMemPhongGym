import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MemberHomeScreen from '../screens/member/MemberHomeScreen';

// Stub screens
const QRScreen = () => <View style={s.center}><Text>QR Check-in</Text></View>;
const ScheduleScreen = () => <View style={s.center}><Text>Lịch tập</Text></View>;
const ProfileScreen = () => <View style={s.center}><Text>Cá nhân</Text></View>;

const s = StyleSheet.create({ center: { flex: 1, justifyContent: 'center', alignItems: 'center' } });

const Tab = createBottomTabNavigator();

export default function MemberNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { height: 60, paddingBottom: 8 },
      }}
    >
      <Tab.Screen name="Home" component={MemberHomeScreen} options={{ tabBarLabel: 'Trang chủ' }} />
      <Tab.Screen name="QR" component={QRScreen} options={{ tabBarLabel: 'QR Check-in' }} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ tabBarLabel: 'Lịch tập' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Cá nhân' }} />
    </Tab.Navigator>
  );
}
