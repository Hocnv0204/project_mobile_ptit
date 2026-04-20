import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { HelperText, Snackbar, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useIdTokenAuthRequest } from 'expo-auth-session/providers/google';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authApi } from '../../api/authApi';
import { useAppDispatch } from '../../store';
import { setAuth, persistAuth } from '../../store/slices/authSlice';

import { GOOGLE_WEB_CLIENT_ID, resolveGoogleOAuthRedirectUri } from '../../config/google';

WebBrowser.maybeCompleteAuthSession();

const schema = z.object({
  username: z.string().min(1, 'Vui lòng nhập username'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type FormValues = z.infer<typeof schema>;

function getApiErrorMessage(e: unknown, fallback: string): string {
  if (e && typeof e === 'object' && 'message' in e) {
    const m = (e as { message?: string }).message;
    if (typeof m === 'string' && m.trim()) return mapBackendLoginMessage(m.trim());
  }
  if (e instanceof Error && e.message) return mapBackendLoginMessage(e.message);
  return fallback;
}

function mapBackendLoginMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid') && (lower.includes('email') || lower.includes('password'))) {
    return 'Sai username hoặc mật khẩu.';
  }
  return message;
}

export default function LoginScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [authErrorSnackbar, setAuthErrorSnackbar] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const handledGoogleIdTokenRef = useRef<string | null>(null);

  const googleRedirectUri = useMemo(() => resolveGoogleOAuthRedirectUri(), []);

  const [request, response, promptAsync] = useIdTokenAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    ...(googleRedirectUri ? { redirectUri: googleRedirectUri } : {}),
  });

  useEffect(() => {
    if (!__DEV__ || !request?.redirectUri) return;
  }, [request?.redirectUri, googleRedirectUri]);

  const defaultValues = useMemo<FormValues>(() => ({ username: '', password: '' }), []);
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({ defaultValues, resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSubmitting(true);
      const res = await authApi.login(values);
      const auth = res.data;

      dispatch(setAuth({
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        tokenType: auth.tokenType,
        accessTokenExpiresIn: auth.accessTokenExpiresIn,
        user: auth.user,
      }));

      await persistAuth({
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        tokenType: auth.tokenType,
        accessTokenExpiresIn: auth.accessTokenExpiresIn,
        user: auth.user,
      });

    } catch (e: unknown) {
      setAuthErrorSnackbar(getApiErrorMessage(e, 'Đăng nhập thất bại'));
    } finally {
      setSubmitting(false);
    }
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === 'error') {
      setGoogleSubmitting(false);
      const err = (response as any).error;
      setAuthErrorSnackbar(typeof err?.message === 'string' && err.message.trim() ? err.message : typeof err?.code === 'string' ? err.code : 'Đăng nhập Google thất bại');
      return;
    }
    if (response.type === 'dismiss' || response.type === 'cancel') {
      setGoogleSubmitting(false);
      return;
    }
    if (response.type !== 'success') return;
    const idToken = (response.params as { id_token?: string })?.id_token;
    if (!idToken) return;

    if (handledGoogleIdTokenRef.current === idToken) return;
    handledGoogleIdTokenRef.current = idToken;

    (async () => {
      try {
        setGoogleSubmitting(true);
        const apiRes = await authApi.google({ idToken });
        const auth = apiRes.data;

        dispatch(setAuth({
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          tokenType: auth.tokenType,
          accessTokenExpiresIn: auth.accessTokenExpiresIn,
          user: auth.user,
        }));

        await persistAuth({
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          tokenType: auth.tokenType,
          accessTokenExpiresIn: auth.accessTokenExpiresIn,
          user: auth.user,
        });
      } catch (e: unknown) {
        setAuthErrorSnackbar(getApiErrorMessage(e, 'Đăng nhập Google thất bại'));
      } finally {
        setGoogleSubmitting(false);
      }
    })();
  }, [response, dispatch]);

  const onGoogleLogin = async () => {
    if (!request) {
      Alert.alert('Chưa sẵn sàng', 'Đang khởi tạo Google OAuth. Thử lại sau vài giây.');
      return;
    }
    try {
      setGoogleSubmitting(true);
      const result = await promptAsync();
      if (result.type !== 'success') setGoogleSubmitting(false);
    } catch (e: any) {
      setGoogleSubmitting(false);
      Alert.alert('Lỗi', e?.message || 'Không mở được đăng nhập Google');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="#1A1D26" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="school" size={28} color="#0066FF" />
            <Text style={styles.logoText}>PTIT ENGLISH</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Tên đăng nhập / Email</Text>
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, value, onBlur } }) => (
              <View style={styles.field}>
                <TextInput
                  mode="outlined"
                  placeholder="Nhập tên đăng nhập của bạn"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  autoCorrect={false}
                  outlineColor="#E0E5ED"
                  activeOutlineColor="#0066FF"
                  style={styles.input}
                  theme={{ colors: { background: '#FFFFFF' } }}
                  textColor="#1A1D26"
                />
                <HelperText type="error" visible={!!errors.username} style={styles.errorText}>
                  {errors.username?.message}
                </HelperText>
              </View>
            )}
          />

          <Text style={styles.label}>Mật khẩu</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <View style={styles.field}>
                <TextInput
                  mode="outlined"
                  placeholder="Nhập mật khẩu"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={!showPassword}
                  outlineColor="#E0E5ED"
                  activeOutlineColor="#0066FF"
                  style={styles.input}
                  theme={{ colors: { background: '#FFFFFF' } }}
                  textColor="#1A1D26"
                  right={
                    <TextInput.Icon
                      icon={showPassword ? "eye-off" : "eye"}
                      color="#A0A7BA"
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                />
                <HelperText type="error" visible={!!errors.password} style={styles.errorText}>
                  {errors.password?.message}
                </HelperText>
              </View>
            )}
          />

          <TouchableOpacity 
            style={[styles.btnPrimary, submitting && styles.btnPrimaryDisabled]} 
            onPress={onSubmit}
            disabled={submitting}
          >
            <Text style={styles.btnPrimaryText}>{submitting ? 'Đang xử lý...' : 'Đăng nhập'}</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>Các tùy chọn đăng nhập khác</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn}>
              <MaterialCommunityIcons name="apple" size={28} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.socialBtn, googleSubmitting && styles.socialBtnDisabled]} 
              onPress={onGoogleLogin}
              disabled={googleSubmitting || !request}
            >
              <MaterialCommunityIcons name="google" size={28} color="#0066FF" />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomLinkRow}>
            <Text style={styles.bottomLinkText}>Chưa có tài khoản?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.bottomLinkAction}> Đăng ký</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <Snackbar
        visible={!!authErrorSnackbar}
        onDismiss={() => setAuthErrorSnackbar(null)}
        duration={5000}
        style={{ backgroundColor: '#E91E63' }}
        action={{ label: 'Đóng', onPress: () => setAuthErrorSnackbar(null), textColor: '#FFF' }}
      >
        <Text style={{ color: '#FFFFFF' }}>{authErrorSnackbar}</Text>
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0066FF',
    letterSpacing: 0.5,
  },
  container: { 
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 8,
    fontWeight: '600',
  },
  field: { 
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    fontSize: 15,
  },
  errorText: {
    marginTop: 4,
  },
  btnPrimary: {
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  btnPrimaryDisabled: {
    backgroundColor: '#80B3FF',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 40,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E5ED',
  },
  dividerText: {
    color: '#70778C',
    fontSize: 12,
    marginHorizontal: 16,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  socialBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E0E5ED',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  socialBtnDisabled: {
    opacity: 0.5,
  },
  bottomLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  bottomLinkText: {
    color: '#70778C',
    fontSize: 14,
  },
  bottomLinkAction: {
    color: '#0066FF',
    fontSize: 14,
    fontWeight: '700',
  },
});
