import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Calendar, Users, User } from 'lucide-react-native';
import PTHomeScreen from '../screens/pt/PTHomeScreen';
import PTScheduleScreen from '../screens/pt/PTScheduleScreen';
import PTStudentsScreen from '../screens/pt/PTStudentsScreen';
import PTProfileScreen from '../screens/pt/PTProfileScreen';

const Tab = createBottomTabNavigator();

export default function PTNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1D9336', // Sync with FE Web green theme
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
        component={PTHomeScreen} 
        options={{ 
          tabBarLabel: 'Tổng quan',
          tabBarIcon: ({ color, size }) => <Home color={color} size={22} />
        }} 
      />
      <Tab.Screen 
        name="Schedule" 
        component={PTScheduleScreen} 
        options={{ 
          tabBarLabel: 'Lịch dạy',
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={22} />
        }} 
      />
      <Tab.Screen 
        name="Members" 
        component={PTStudentsScreen} 
        options={{ 
          tabBarLabel: 'Học viên',
          tabBarIcon: ({ color, size }) => <Users color={color} size={22} />
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={PTProfileScreen} 
        options={{ 
          tabBarLabel: 'Cá nhân',
          tabBarIcon: ({ color, size }) => <User color={color} size={22} />
        }} 
      />
    </Tab.Navigator>
  );
}
