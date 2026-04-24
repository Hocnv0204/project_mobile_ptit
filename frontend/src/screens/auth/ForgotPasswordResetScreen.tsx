import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { HelperText, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authApi } from '../../api/authApi';
import { useToast } from '../../components/ToastProvider';
import { useNavigation } from '@react-navigation/native';
import { Routes } from '../../constants/routes';

const schema = z
  .object({
    email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
    otp: z.preprocess(
      (v) => String(v ?? '').replace(/\s+/g, '').trim(),
      z.string().regex(/^\d{6}$/, 'OTP gồm đúng 6 chữ số'),
    ),
    newPassword: z.string().min(8, 'Mật khẩu mới tối thiểu 8 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Xác nhận mật khẩu không khớp',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordResetScreen({ route }: any) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const emailFromRoute = (route?.params?.email as string | undefined) ?? '';
  const defaultValues = useMemo<FormValues>(
    () => ({ email: emailFromRoute, otp: '', newPassword: '', confirmPassword: '' }),
    [emailFromRoute],
  );

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues,
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSubmitting(true);
      const res = await authApi.forgotPasswordReset({
        email: values.email.trim().toLowerCase(),
        otp: values.otp.trim(),
        newPassword: values.newPassword,
      });
      toast.show(res.message || 'Đặt lại mật khẩu thành công', { type: 'success', durationMs: 3500 });
      navigation.reset({ index: 0, routes: [{ name: Routes.LOGIN }] });
    } catch (e: any) {
      toast.show(e?.message || 'Không thể đặt lại mật khẩu', { type: 'error', durationMs: 4500 });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.headerRow, { paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="#1A1D26" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đặt lại mật khẩu</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.subtitle}>
            Nhập mã OTP đã gửi về email và mật khẩu mới.
          </Text>

          <Text style={styles.label}>Email</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
              <View style={styles.field}>
                <TextInput
                  mode="outlined"
                  placeholder="Nhập email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  outlineColor="#E0E5ED"
                  activeOutlineColor="#0066FF"
                  style={styles.input}
                  theme={{ colors: { background: '#FFFFFF' } }}
                  textColor="#1A1D26"
                />
                <HelperText type="error" visible={!!error} style={styles.errorText}>
                  {error?.message}
                </HelperText>
              </View>
            )}
          />

          <Text style={styles.label}>OTP</Text>
          <Controller
            control={control}
            name="otp"
            render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
              <View style={styles.field}>
                <TextInput
                  mode="outlined"
                  placeholder="Nhập OTP 6 số"
                  value={value}
                  onChangeText={(t) => onChange(t.replace(/\s+/g, ''))}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                  maxLength={6}
                  outlineColor="#E0E5ED"
                  activeOutlineColor="#0066FF"
                  style={styles.input}
                  theme={{ colors: { background: '#FFFFFF' } }}
                  textColor="#1A1D26"
                />
                <HelperText type="error" visible={!!error} style={styles.errorText}>
                  {error?.message}
                </HelperText>
              </View>
            )}
          />

          <Text style={styles.label}>Mật khẩu mới</Text>
          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
              <View style={styles.field}>
                <TextInput
                  mode="outlined"
                  placeholder="Nhập mật khẩu mới"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={!showNew}
                  outlineColor="#E0E5ED"
                  activeOutlineColor="#0066FF"
                  style={styles.input}
                  theme={{ colors: { background: '#FFFFFF' } }}
                  textColor="#1A1D26"
                  right={<TextInput.Icon icon={showNew ? 'eye-off' : 'eye'} onPress={() => setShowNew((s) => !s)} />}
                />
                <HelperText type="error" visible={!!error} style={styles.errorText}>
                  {error?.message}
                </HelperText>
              </View>
            )}
          />

          <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
              <View style={styles.field}>
                <TextInput
                  mode="outlined"
                  placeholder="Nhập lại mật khẩu mới"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={!showConfirm}
                  outlineColor="#E0E5ED"
                  activeOutlineColor="#0066FF"
                  style={styles.input}
                  theme={{ colors: { background: '#FFFFFF' } }}
                  textColor="#1A1D26"
                  right={<TextInput.Icon icon={showConfirm ? 'eye-off' : 'eye'} onPress={() => setShowConfirm((s) => !s)} />}
                />
                <HelperText type="error" visible={!!error} style={styles.errorText}>
                  {error?.message}
                </HelperText>
              </View>
            )}
          />

          <TouchableOpacity
            style={[styles.btnPrimary, submitting && styles.btnPrimaryDisabled]}
            onPress={onSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>{submitting ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A1D26' },
  container: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },
  subtitle: { fontSize: 14, color: '#70778C', lineHeight: 20, marginBottom: 18 },
  label: { fontSize: 14, color: '#4A5568', marginBottom: 8, fontWeight: '700' },
  field: { marginBottom: 10 },
  input: { backgroundColor: '#FFFFFF', fontSize: 15 },
  errorText: { marginTop: -4 },
  btnPrimary: {
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  btnPrimaryDisabled: { opacity: 0.7 },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});

