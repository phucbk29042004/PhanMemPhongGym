import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';
import { connectSocket, disconnectSocket } from '../services/socket';

import LoginScreen from '../screens/auth/LoginScreen';
import MemberNavigator from './MemberNavigator';
import PTNavigator from './PTNavigator';
import AdminNavigator from './AdminNavigator';
import AIAssistantBubble from '../components/AIAssistantBubble';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { token, role, user, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Kết nối / ngắt Socket.IO theo trạng thái đăng nhập
  useEffect(() => {
    if (token && user) {
      connectSocket(user);
    } else {
      disconnectSocket();
    }
  }, [token, user]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token == null ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (role === 'admin' || role === 'nhan_vien') ? (
          <Stack.Screen name="AdminApp" component={AdminNavigator} />
        ) : role === 'pt' ? (
          <Stack.Screen name="PTApp" component={PTNavigator} />
        ) : (
          <Stack.Screen name="MemberApp" component={MemberNavigator} />
        )}
      </Stack.Navigator>
      {token != null && <AIAssistantBubble />}
    </View>
  );
}
