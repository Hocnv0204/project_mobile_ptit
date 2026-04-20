import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, HelperText, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { AuthLayout } from './AuthLayout';
import { authApi } from '../../api/authApi';
import { useAppDispatch } from '../../store';
import { setAuth, persistAuth } from '../../store/slices/authSlice';
import { setTokens } from '../../api/authStorage';

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  otp: z.string().regex(/^\d{6}$/, 'OTP gồm đúng 6 chữ số'),
});

type FormValues = z.infer<typeof schema>;

export default function EmailVerifyScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const emailFromRoute = route?.params?.email as string | undefined;

  const defaultValues = useMemo<FormValues>(
    () => ({ email: emailFromRoute || '', otp: '' }),
    [emailFromRoute],
  );

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues, resolver: zodResolver(schema) });

  const onResend = async () => {
    try {
      setResending(true);
      const email = getValues('email').trim();
      const res = await authApi.resendOtp({ email });
      Alert.alert('Đã gửi lại', res.message || 'OTP mới đã được gửi về email');
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Gửi lại OTP thất bại');
    } finally {
      setResending(false);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSubmitting(true);
      const res = await authApi.verifyOtp({ email: values.email.trim(), otp: values.otp.trim() });
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

      Alert.alert('Thành công', 'Xác thực OTP thành công');
      navigation.popToTop();
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Xác thực OTP thất bại');
    } finally {
      setSubmitting(false);
    }
  });

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
            <Text style={styles.title}>Xác thực OTP</Text>
            <Text style={styles.subtitle}>Nhập mã OTP 6 số đã gửi về email</Text>
          </View>

          <LinearGradient colors={['rgba(26,26,46,0.45)', 'rgba(26,26,46,0.25)']} style={styles.card}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value, onBlur } }) => (
                <View style={styles.field}>
                  <TextInput
                    mode="outlined"
                    label="Email"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    outlineColor={Colors.border}
                    activeOutlineColor={Colors.primary}
                    textColor={Colors.textPrimary}
                  />
                  <HelperText type="error" visible={!!errors.email}>
                    {errors.email?.message}
                  </HelperText>
                </View>
              )}
            />

            <Controller
              control={control}
              name="otp"
              render={({ field: { onChange, value, onBlur } }) => (
                <View style={styles.field}>
                  <TextInput
                    mode="outlined"
                    label="OTP (6 số)"
                    value={value}
                    onChangeText={(t) => onChange(t.replace(/[^\d]/g, ''))}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                    outlineColor={Colors.border}
                    activeOutlineColor={Colors.primary}
                    textColor={Colors.textPrimary}
                  />
                  <HelperText type="error" visible={!!errors.otp}>
                    {errors.otp?.message}
                  </HelperText>
                </View>
              )}
            />

            <Button mode="contained" onPress={onSubmit} loading={submitting} disabled={submitting} style={styles.btn}>
              Xác thực
            </Button>

            <Pressable onPress={onResend} disabled={resending} style={styles.linkRow}>
              <Text style={[styles.linkText, resending && { opacity: 0.7 }]}>
                {resending ? 'Đang gửi lại...' : 'Gửi lại OTP'}
              </Text>
            </Pressable>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
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
    textAlign: 'center',
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
  linkRow: { marginTop: 14, flexDirection: 'row', justifyContent: 'center' },
  linkText: { color: Colors.accent, fontFamily: Typography.fontFamily.bold },
});

