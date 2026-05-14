import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';

import LoginScreen from '../screens/auth/LoginScreen';
import MemberNavigator from './MemberNavigator';
import PTNavigator from './PTNavigator';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { token, role, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token == null ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : role === 'pt' ? (
        <Stack.Screen name="PTApp" component={PTNavigator} />
      ) : (
        <Stack.Screen name="MemberApp" component={MemberNavigator} />
      )}
    </Stack.Navigator>
  );
}
