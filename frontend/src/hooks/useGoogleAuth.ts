import { useState } from 'react';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/authStore';
import { toApiError } from '../utils/apiErrors';
import { API_BASE_URL } from '../config/env';
import { http } from '../api/http';

// Chỉ dùng native GoogleSignin khi là native build (không phải Expo Go, không phải web)
const isWeb = Platform.OS === 'web';
const isExpoGo = Constants.executionEnvironment === 'storeClient';
export const canUseGoogleSignIn = !isWeb && !isExpoGo;

let GoogleSignin: any = null;
let statusCodes: any = {};

if (canUseGoogleSignIn) {
  try {
    const pkg = require('@react-native-google-signin/google-signin');
    GoogleSignin = pkg.GoogleSignin;
    statusCodes = pkg.statusCodes;
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      offlineAccess: false,
    });
  } catch (e) {
    console.warn('GoogleSignin native module not available:', e);
  }
}

export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((state) => state.setAuth);

  const sendToBackend = async (idToken: string) => {
    try {
      const res = await http.post('/api/auth/google', { idToken });
      const authData = (res.data as any).data;
      setAuth({
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
        user: authData.user,
      });
    } catch (err: any) {
      const apiError = toApiError(err, API_BASE_URL);
      const message = apiError.message || 'Xác thực với server thất bại';
      setError(message);
      Alert.alert('Lỗi', message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    // Web hoặc Expo Go: không hỗ trợ Google Sign-In client-side
    if (!canUseGoogleSignIn || !GoogleSignin) {
      const env = isWeb ? 'trình duyệt web' : 'Expo Go';
      Alert.alert(
        'Không hỗ trợ',
        `Đăng nhập Google không khả dụng trên ${env}.\nVui lòng sử dụng ứng dụng native (build từ source).`,
        [{ text: 'Đã hiểu' }]
      );
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) throw new Error('Không nhận được ID token từ Google');

      await sendToBackend(idToken);
    } catch (err: any) {
      let message = 'Đăng nhập Google thất bại';

      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        // Người dùng tự thoát, không cần hiện lỗi
        setLoading(false);
        return;
      } else if (err.code === statusCodes.IN_PROGRESS) {
        message = 'Đăng nhập đang được xử lý...';
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        message = 'Google Play Services không khả dụng';
      } else {
        const apiError = toApiError(err, API_BASE_URL);
        message = apiError.message || message;
      }

      console.error('Google Sign-In Error:', err);
      setError(message);
      Alert.alert('Lỗi', message);
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (canUseGoogleSignIn && GoogleSignin) {
      try {
        await GoogleSignin.signOut();
      } catch (err) {
        console.error('Google Sign-Out Error:', err);
      }
    }
  };

  return { signInWithGoogle, signOut, loading, error, canUseGoogleSignIn };
};
