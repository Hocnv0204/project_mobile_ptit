import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, HelperText, Snackbar, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useIdTokenAuthRequest } from 'expo-auth-session/providers/google';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { AuthLayout } from './AuthLayout';
import { authApi } from '../../api/authApi';
import { useAppDispatch } from '../../store';
import { setAuth, persistAuth } from '../../store/slices/authSlice';
import { setTokens } from '../../api/authStorage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import {
  GOOGLE_WEB_CLIENT_ID,
  resolveGoogleOAuthRedirectUri,
} from '../../config/google';

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

/** Chuẩn hoá thông báo backend (tiếng Anh) sang tiếng Việt khi cần. */
function mapBackendLoginMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid') && (lower.includes('email') || lower.includes('password'))) {
    return 'Sai username hoặc mật khẩu.';
  }
  return message;
}

export default function LoginScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [authErrorSnackbar, setAuthErrorSnackbar] = useState<string | null>(null);
  const handledGoogleIdTokenRef = useRef<string | null>(null);

  const googleRedirectUri = useMemo(() => resolveGoogleOAuthRedirectUri(), []);

  const [request, response, promptAsync] = useIdTokenAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    ...(googleRedirectUri ? { redirectUri: googleRedirectUri } : {}),
  });

  useEffect(() => {
    if (!__DEV__ || !request?.redirectUri) return;

    if (Platform.OS === 'web') {
      console.warn(
        '[Google OAuth] Bạn đang chạy Web (bare). Thêm CHÍNH XÁC URI sau vào Google Cloud → OAuth client (Web) → Authorized redirect URIs:',
        request.redirectUri,
      );
      return;
    }

    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
      console.warn(
        '[Google OAuth] Expo Go: redirect proxy / .env =',
        googleRedirectUri ?? '(chưa có — cần EXPO_PUBLIC_EXPO_PROJECT_FULL_NAME hoặc EXPO_PUBLIC_GOOGLE_REDIRECT_URI)',
        '| URI thực tế:',
        request.redirectUri,
      );
      return;
    }

    console.warn(
      '[Google OAuth] Dev build / bare native: URI gửi lên Google =',
      request.redirectUri,
      '| Thêm URI này vào OAuth Web client trên GCP. executionEnvironment:',
      Constants.executionEnvironment,
    );
  }, [request?.redirectUri, googleRedirectUri]);

  const defaultValues = useMemo<FormValues>(() => ({ username: '', password: '' }), []);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues, resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSubmitting(true);
      const res = await authApi.login(values);
      const auth = res.data;

      dispatch(
        setAuth({
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          tokenType: auth.tokenType,
          accessTokenExpiresIn: auth.accessTokenExpiresIn,
          user: auth.user,
        }),
      );
      await setTokens({ accessToken: auth.accessToken, refreshToken: auth.refreshToken });
      await persistAuth({
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        tokenType: auth.tokenType,
        accessTokenExpiresIn: auth.accessTokenExpiresIn,
        user: auth.user,
      });

      Alert.alert('Thành công', 'Đăng nhập thành công');
      navigation.goBack();
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
      setAuthErrorSnackbar(
        typeof err?.message === 'string' && err.message.trim()
          ? err.message
          : typeof err?.code === 'string'
            ? err.code
            : 'Đăng nhập Google thất bại',
      );
      return;
    }

    if (response.type === 'dismiss' || response.type === 'cancel') {
      setGoogleSubmitting(false);
      return;
    }

    if (response.type !== 'success') return;

    const idToken = (response.params as { id_token?: string })?.id_token;
    if (!idToken) {
      // Android/iOS: đang đổi code → token; chờ lần cập nhật response có id_token
      return;
    }

    if (handledGoogleIdTokenRef.current === idToken) return;
    handledGoogleIdTokenRef.current = idToken;

    (async () => {
      try {
        setGoogleSubmitting(true);
        const apiRes = await authApi.google({ idToken });
        const auth = apiRes.data;

        dispatch(
          setAuth({
            accessToken: auth.accessToken,
            refreshToken: auth.refreshToken,
            tokenType: auth.tokenType,
            accessTokenExpiresIn: auth.accessTokenExpiresIn,
            user: auth.user,
          }),
        );
        await setTokens({ accessToken: auth.accessToken, refreshToken: auth.refreshToken });
        await persistAuth({
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          tokenType: auth.tokenType,
          accessTokenExpiresIn: auth.accessTokenExpiresIn,
          user: auth.user,
        });

        Alert.alert('Thành công', 'Đăng nhập Google thành công');
        navigation.goBack();
      } catch (e: unknown) {
        setAuthErrorSnackbar(getApiErrorMessage(e, 'Đăng nhập Google thất bại'));
      } finally {
        setGoogleSubmitting(false);
      }
    })();
  }, [response, dispatch, navigation]);

  const onGoogleLogin = async () => {
    if (!request) {
      Alert.alert('Chưa sẵn sàng', 'Đang khởi tạo Google OAuth. Thử lại sau vài giây.');
      return;
    }
    try {
      setGoogleSubmitting(true);
      const result = await promptAsync();
      if (result.type !== 'success') {
        setGoogleSubmitting(false);
      }
    } catch (e: any) {
      setGoogleSubmitting(false);
      Alert.alert('Lỗi', e?.message || 'Không mở được đăng nhập Google');
    }
  };

  return (
    <AuthLayout>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingTop: Math.max(insets.top + 20, 56), paddingBottom: Math.max(insets.bottom + 20, 32) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Đăng nhập</Text>
            <Text style={styles.subtitle}>Chào mừng bạn quay lại</Text>
          </View>

          <LinearGradient colors={['rgba(26,26,46,0.45)', 'rgba(26,26,46,0.25)']} style={styles.card}>
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, value, onBlur } }) => (
                <View style={styles.field}>
                  <TextInput
                    mode="outlined"
                    label="Username"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="none"
                    autoCorrect={false}
                    outlineColor={Colors.border}
                    activeOutlineColor={Colors.primary}
                    textColor={Colors.textPrimary}
                  />
                  <HelperText type="error" visible={!!errors.username}>
                    {errors.username?.message}
                  </HelperText>
                </View>
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value, onBlur } }) => (
                <View style={styles.field}>
                  <TextInput
                    mode="outlined"
                    label="Mật khẩu"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry
                    outlineColor={Colors.border}
                    activeOutlineColor={Colors.primary}
                    textColor={Colors.textPrimary}
                  />
                  <HelperText type="error" visible={!!errors.password}>
                    {errors.password?.message}
                  </HelperText>
                </View>
              )}
            />

            <Button mode="contained" onPress={onSubmit} loading={submitting} disabled={submitting} style={styles.btn}>
              Đăng nhập
            </Button>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>hoặc</Text>
              <View style={styles.divider} />
            </View>

            <Button
              mode="outlined"
              onPress={onGoogleLogin}
              loading={googleSubmitting}
              disabled={googleSubmitting || !request}
              style={styles.btnGoogle}
              textColor={Colors.textPrimary}
            >
              Đăng nhập với Google
            </Button>

            <Pressable onPress={() => navigation.navigate('Register')} style={styles.linkRow}>
              <Text style={styles.linkTextMuted}>Chưa có tài khoản?</Text>
              <Text style={styles.linkText}> Đăng ký</Text>
            </Pressable>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
      <Snackbar
        visible={!!authErrorSnackbar}
        onDismiss={() => setAuthErrorSnackbar(null)}
        duration={5000}
        style={{ backgroundColor: Colors.error }}
        action={{ label: 'Đóng', onPress: () => setAuthErrorSnackbar(null) }}
      >
        <Text style={{ color: '#FFFFFF', fontFamily: Typography.fontFamily.medium }}>{authErrorSnackbar}</Text>
      </Snackbar>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 18 },
  title: { fontSize: Typography.fontSize['3xl'], fontFamily: Typography.fontFamily.extraBold, color: Colors.textPrimary },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  card: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.18)',
    backgroundColor: 'rgba(26,26,46,0.35)',
  },
  field: { marginBottom: 4 },
  btn: { marginTop: 8, backgroundColor: Colors.primary, borderRadius: 14 },
  dividerRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  divider: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' },
  dividerText: { color: Colors.textSecondary, fontFamily: Typography.fontFamily.medium, fontSize: 12 },
  btnGoogle: { marginTop: 12, borderRadius: 14, borderColor: 'rgba(255,255,255,0.14)' },
  linkRow: { marginTop: 14, flexDirection: 'row', justifyContent: 'center' },
  linkTextMuted: { color: Colors.textSecondary, fontFamily: Typography.fontFamily.medium },
  linkText: { color: Colors.primary, fontFamily: Typography.fontFamily.bold },
});
