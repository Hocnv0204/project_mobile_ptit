import { useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import { apiClient } from '../services/apiClient';
import { useAuthStore } from '../store/authStore';
import { Alert, Platform } from 'react-native';
import { toApiError } from '../utils/apiErrors';
import { API_BASE_URL } from '../config/env';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((state) => state.setAuth);

  // Ép sử dụng đường dẫn HTTPS đã khai báo trong .env
  const redirectUri = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI;

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    responseType: 'id_token',
    nonce: 'linguaboost_nonce',
    redirectUri,
  });

  useEffect(() => {
    console.log('MANUAL Redirect URI:', redirectUri);
    
    if (response?.type === 'success') {
      // Thử lấy từ authentication hoặc params (tùy cấu hình Google)
      const idToken = response.authentication?.idToken || response.params?.id_token;
      
      if (idToken) {
        handleBackendAuth(idToken);
      } else {
        console.error('Response details:', JSON.stringify(response, null, 2));
        setError('Không nhận được mã xác thực từ Google');
      }
    } else if (response?.type === 'error') {
      setError('Google Sign-In Error');
      setLoading(false);
    }
  }, [response]);

  const handleBackendAuth = async (idToken: string) => {
    setLoading(true);
    try {
      console.log('Sending ID token to backend...', idToken);
      const res = await apiClient.post('/api/auth/google', { idToken });
      const authData = res.data.data;

      setAuth({
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
        user: authData.user,
      });
      
      console.log('Login success');
    } catch (err: any) {
      console.error('Backend Auth Error:', err);
      const apiError = toApiError(err, API_BASE_URL);
      setError(apiError.message);
      Alert.alert('Lỗi', apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await promptAsync();
    } catch (err) {
      setLoading(false);
      setError('Failed to open browser');
    }
  };

  const signOut = async () => {
    // Với expo-auth-session, logout đơn giản là xóa token ở local
  };

  return { signInWithGoogle, signOut, loading, error };
};
