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

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  username: z.string().optional(),
  fullName: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [submitting, setSubmitting] = useState(false);

  const defaultValues = useMemo<FormValues>(() => ({ email: '', password: '', username: '', fullName: '' }), []);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues, resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSubmitting(true);
      const body = {
        email: values.email.trim(),
        password: values.password,
        username: values.username?.trim() || undefined,
        fullName: values.fullName?.trim() || undefined,
      };
      const res = await authApi.register(body);
      Alert.alert('Thành công', res.message || 'Vui lòng kiểm tra email để lấy OTP');
      navigation.navigate('EmailVerify', { email: body.email });
    } catch (e: any) {
      const msg = e?.message || 'Đăng ký thất bại';
      Alert.alert('Lỗi', msg);
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
            <Text style={styles.title}>Đăng ký</Text>
            <Text style={styles.subtitle}>Tạo tài khoản và xác thực OTP qua email</Text>
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

            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, value, onBlur } }) => (
                <View style={styles.field}>
                  <TextInput
                    mode="outlined"
                    label="Username (không bắt buộc)"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="none"
                    autoCorrect={false}
                    outlineColor={Colors.border}
                    activeOutlineColor={Colors.primary}
                    textColor={Colors.textPrimary}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, value, onBlur } }) => (
                <View style={styles.field}>
                  <TextInput
                    mode="outlined"
                    label="Họ và tên (không bắt buộc)"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    outlineColor={Colors.border}
                    activeOutlineColor={Colors.primary}
                    textColor={Colors.textPrimary}
                  />
                </View>
              )}
            />

            <Button mode="contained" onPress={onSubmit} loading={submitting} disabled={submitting} style={styles.btn}>
              Tạo tài khoản
            </Button>

            <Pressable onPress={() => navigation.navigate('Login')} style={styles.linkRow}>
              <Text style={styles.linkTextMuted}>Đã có tài khoản?</Text>
              <Text style={styles.linkText}> Đăng nhập</Text>
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
  linkTextMuted: { color: Colors.textSecondary, fontFamily: Typography.fontFamily.medium },
  linkText: { color: Colors.primary, fontFamily: Typography.fontFamily.bold },
});

