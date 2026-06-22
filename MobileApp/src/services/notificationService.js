import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './api';

// Thiết lập cách hiển thị thông báo khi app đang mở (Foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Đăng ký nhận thông báo đẩy và lấy Push Token
 */
export async function registerForPushNotificationsAsync() {
  let token = null;

  if (!Device.isDevice) {
    console.log('[PushNotification] Phải chạy trên thiết bị thật để nhận Push Token');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[PushNotification] Không có quyền gửi thông báo đẩy!');
      return null;
    }

    // Lấy Token của Expo
    const expoTokenObj = await Notifications.getExpoPushTokenAsync();
    token = expoTokenObj.data;
    console.log('[PushNotification] Expo Push Token:', token);

    // Gửi token này lên backend để lưu vào hồ sơ user
    await api.post('/auth/save-push-token', { token });
  } catch (err) {
    console.error('[PushNotification] Lỗi đăng ký token:', err.message);
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}
