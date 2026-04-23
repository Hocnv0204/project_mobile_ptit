import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { HelperText, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ToastProvider';


const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  otp: z.string().regex(/^\d{6}$/, 'OTP gồm đúng 6 chữ số'),
});

type FormValues = z.infer<typeof schema>;

export default function EmailVerifyScreen({ route, navigation }: any) {
  const setAuth = useAuthStore((state) => state.setAuth);
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const emailFromRoute = route?.params?.email as string | undefined;

  const defaultValues = useMemo<FormValues>(
    () => ({ email: emailFromRoute || '', otp: '' }),
    [emailFromRoute],
  );

  const { control, handleSubmit, getValues, formState: { errors } } = useForm<FormValues>({ defaultValues, resolver: zodResolver(schema) });

  const onResend = async () => {
    try {
      setResending(true);
      const email = getValues('email').trim();
      const res = await authApi.resendOtp({ email });
      toast.show(res.message || 'OTP mới đã được gửi về email', { type: 'success', durationMs: 3500 });
    } catch (e: any) {
      toast.show(e?.message || 'Gửi lại OTP thất bại', { type: 'error', durationMs: 4500 });
    } finally {
      setResending(false);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSubmitting(true);
      const res = await authApi.verifyOtp({ email: values.email.trim(), otp: values.otp.trim() });
      const auth = res.data;

      setAuth({
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        user: auth.user,
      });

      toast.show('Xác thực OTP thành công', { type: 'success', durationMs: 3000 });
      // Navigation will automatically update due to Zustand state change in RootNavigator
    } catch (e: any) {
      toast.show(e?.message || 'Xác thực OTP thất bại', { type: 'error', durationMs: 4500 });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="#1A1D26" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Xác thực OTP</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>Nhập mã OTP 6 số đã gửi về email của bạn</Text>

          <Text style={styles.label}>Email</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value, onBlur } }) => (
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
                <HelperText type="error" visible={!!errors.email} style={styles.errorText}>
                  {errors.email?.message}
                </HelperText>
              </View>
            )}
          />

          <Text style={styles.label}>Mã OTP</Text>
          <Controller
            control={control}
            name="otp"
            render={({ field: { onChange, value, onBlur } }) => (
              <View style={styles.field}>
                <TextInput
                  mode="outlined"
                  placeholder="Nhập 6 số OTP"
                  value={value}
                  onChangeText={(t) => onChange(t.replace(/[^\d]/g, ''))}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                  outlineColor="#E0E5ED"
                  activeOutlineColor="#0066FF"
                  style={styles.input}
                  theme={{ colors: { background: '#FFFFFF' } }}
                  textColor="#1A1D26"
                />
                <HelperText type="error" visible={!!errors.otp} style={styles.errorText}>
                  {errors.otp?.message}
                </HelperText>
              </View>
            )}
          />

          <TouchableOpacity 
            style={[styles.btnPrimary, submitting && styles.btnPrimaryDisabled]} 
            onPress={onSubmit}
            disabled={submitting}
          >
            <Text style={styles.btnPrimaryText}>{submitting ? 'Đang xác thực...' : 'Xác thực'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.resendButton} 
            onPress={onResend}
            disabled={resending}
          >
            <Text style={[styles.resendText, resending && { opacity: 0.7 }]}>
              {resending ? 'Đang gửi lại...' : 'Gửi lại mã OTP'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1D26',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  container: { 
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 15,
    color: '#70778C',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
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
  resendButton: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    color: '#0066FF',
    fontSize: 15,
    fontWeight: '600',
  },
});
