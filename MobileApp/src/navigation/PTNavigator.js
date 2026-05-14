import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import PTHomeScreen from '../screens/pt/PTHomeScreen';

// Stub screens
const ScheduleScreen = () => <View style={s.center}><Text>Lịch dạy</Text></View>;
const MembersScreen = () => <View style={s.center}><Text>Danh sách học viên</Text></View>;
const ProfileScreen = () => <View style={s.center}><Text>Cá nhân</Text></View>;

const s = StyleSheet.create({ center: { flex: 1, justifyContent: 'center', alignItems: 'center' } });

const Tab = createBottomTabNavigator();

export default function PTNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { height: 60, paddingBottom: 8 },
      }}
    >
      <Tab.Screen name="Home" component={PTHomeScreen} options={{ tabBarLabel: 'Trang chủ' }} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ tabBarLabel: 'Lịch dạy' }} />
      <Tab.Screen name="Members" component={MembersScreen} options={{ tabBarLabel: 'Học viên' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Cá nhân' }} />
    </Tab.Navigator>
  );
}
