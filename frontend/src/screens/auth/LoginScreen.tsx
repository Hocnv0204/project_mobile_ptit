import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { HelperText, Snackbar, TextInput } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';

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
  const setAuth = useAuthStore((state) => state.setAuth);
  const { signInWithGoogle, loading: googleLoading, error: googleError } = useGoogleAuth();
  
  const [submitting, setSubmitting] = useState(false);
  const [authErrorSnackbar, setAuthErrorSnackbar] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (googleError) {
      setAuthErrorSnackbar(googleError);
    }
  }, [googleError]);

  const defaultValues = useMemo<FormValues>(() => ({ username: '', password: '' }), []);
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({ defaultValues, resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSubmitting(true);
      const res = await authApi.login(values);
      const auth = res.data;

      setAuth({
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        user: auth.user,
      });

      // Navigation is usually handled by an auth listener or manually if needed
      // navigation.navigate('Home'); 

    } catch (e: unknown) {
      setAuthErrorSnackbar(getApiErrorMessage(e, 'Đăng nhập thất bại'));
    } finally {
      setSubmitting(false);
    }
  });

  const onGoogleLogin = async () => {
    const result = await signInWithGoogle();
    if (result) {
      // Success is handled by the hook updating the store
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            onPress={() => navigation.canGoBack() && navigation.goBack()} 
            style={[styles.backButton, !navigation.canGoBack() && { opacity: 0 }]}
            disabled={!navigation.canGoBack()}
          >
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
            <TouchableOpacity 
              style={[styles.googleBtn, googleLoading && styles.socialBtnDisabled]}
              onPress={onGoogleLogin}
              disabled={googleLoading}
              activeOpacity={0.8}
            >
              <View style={styles.googleIconContainer}>
                <MaterialCommunityIcons name="google" size={24} color="#EA4335" />
              </View>
              <Text style={styles.googleBtnText}>Tiếp tục với Google</Text>
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
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E5ED',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  googleIconContainer: {
    marginRight: 12,
  },
  googleBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1D26',
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
