import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import { Routes } from '../constants/routes';

export interface PushNotificationState {
  expoPushToken?: Notifications.ExpoPushToken;
  notification?: Notifications.Notification;
}

// Config behavior when notification is received in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const usePushNotifications = (): PushNotificationState => {
  const [expoPushToken, setExpoPushToken] = useState<Notifications.ExpoPushToken | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  
  const navigation = useNavigation<any>();

  async function registerForPushNotificationsAsync() {
    let token;
    
    // Check if it's a physical device
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      // Lấy projectId từ app.json (nếu có cấu hình EAS)
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;
        
      if (!projectId) {
        console.warn('Vui lòng chạy lệnh `npx eas init` để tạo projectId cho tính năng Push Notification.');
      }
      
      try {
        // Cần truyền projectId vào hàm getExpoPushTokenAsync, nếu chưa có thì để fallback tạm thời
        token = await Notifications.getExpoPushTokenAsync({
          projectId: projectId || 'b320df44-dc2a-4dfc-a988-75050f0ec5f9', // Một ID ảo để bypass lỗi, NHƯNG BẠN CẦN CHẠY eas init ĐỂ CÓ ID THẬT
        });
      } catch (error) {
        console.error('Error getting push token:', error);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    // Android 8+ requires a channel
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  }

  useEffect(() => {
    // 1. Register and get token
    registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token);
    });

    // 2. Foreground notification listener
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    // 3. Background/tapped notification listener (Navigate)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      // Handle Navigation
      if (data && data.screen) {
        // e.g., Navigate to StreakDetailsScreen
        if (data.screen === 'StreakDetailsScreen') {
          navigation.navigate(Routes.STREAK_DETAILS, { userId: data.userId });
        }
      }
    });

    // Cleanup listeners
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [navigation]);

  return {
    expoPushToken,
    notification,
  };
};
