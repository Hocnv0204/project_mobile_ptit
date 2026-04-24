import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { HelperText, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authApi } from '../../api/authApi';
import { useToast } from '../../components/ToastProvider';
import { toApiError } from '../../utils/apiErrors';
import DateTimePicker from '@react-native-community/datetimepicker';

const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string()
    .min(8, 'Mật khẩu tối thiểu 8 ký tự')
    .max(50, 'Mật khẩu tối đa 50 ký tự')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Phải có chữ hoa, chữ thường và số'),
  confirmPassword: z.string(),
  fullName: z.string().min(1, 'Vui lòng nhập họ và tên'),
  username: z.string().min(1, 'Vui lòng nhập username'),
  phoneNumber: z.string().optional().or(z.literal('')).refine(
    (v) => !v || /^\d+$/.test(v),
    { message: 'Số điện thoại chỉ được chứa chữ số' },
  ),
  dateOfBirth: z.string().optional().or(z.literal('')),
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: 'Vui lòng đồng ý với điều khoản' }),
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Xác nhận mật khẩu không khớp",
  path: ["confirmPassword"]
});

type FormValues = z.infer<typeof registerSchema>;

export default function RegisterScreen({ navigation }: any) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [tempDob, setTempDob] = useState<Date>(new Date(2000, 0, 1));

  const { control, handleSubmit, watch } = useForm<FormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      username: '',
      phoneNumber: '',
      dateOfBirth: '',
      agreedToTerms: false,
    },
    mode: 'onChange',
  });

  const passwordValue = watch('password') || '';
  const emailValue = watch('email') || '';

  const isValidLength = passwordValue.length >= 8 && passwordValue.length <= 50;
  const isNotEmail = passwordValue.length > 0 && passwordValue !== emailValue;
  const hasMixedChars = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordValue);

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);
      const body = {
        email: values.email.trim(),
        password: values.password,
        username: values.username.trim(),
        fullName: values.fullName.trim(),
        phoneNumber: values.phoneNumber?.trim() ? values.phoneNumber.trim() : undefined,
        dateOfBirth: values.dateOfBirth?.trim() ? values.dateOfBirth.trim() : undefined,
      };
      const res = await authApi.register(body) as any;
      toast.show('Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP.', { type: 'success', durationMs: 3500 });
      navigation.navigate('EmailVerify', { email: body.email });
    } catch (e: any) {
      const apiError = toApiError(e);
      toast.show(apiError.message || 'Đăng ký thất bại', { type: 'error', durationMs: 4500 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
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
          <Text style={styles.screenTitle}>Đăng ký tài khoản</Text>

          <Text style={styles.label}>Email *</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
              <View style={styles.field}>
                <TextInput
                  mode="outlined"
                  placeholder="Nhập email của bạn"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  keyboardType="email-address"
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

          <Text style={styles.label}>Số điện thoại</Text>
          <Controller
            control={control}
            name="phoneNumber"
            render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
              <View style={styles.field}>
                <TextInput
                  mode="outlined"
                  placeholder="Nhập số điện thoại"
                  value={value}
                  onChangeText={(t) => onChange(t.replace(/[^\d]/g, ''))}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
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

          <Text style={styles.label}>Ngày sinh</Text>
          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View style={styles.field}>
                <Pressable
                  onPress={() => {
                    const d = value ? new Date(value) : new Date(2000, 0, 1);
                    setTempDob(d);
                    setShowDobPicker(true);
                  }}
                >
                  <View pointerEvents="none">
                    <TextInput
                      mode="outlined"
                      placeholder="Chọn ngày sinh"
                      value={value ? value.split('-').reverse().join('/') : ''}
                      editable={false}
                      outlineColor="#E0E5ED"
                      activeOutlineColor="#0066FF"
                      style={styles.input}
                      theme={{ colors: { background: '#FFFFFF' } }}
                      textColor="#1A1D26"
                      right={<TextInput.Icon icon="calendar" />}
                    />
                  </View>
                </Pressable>
                <HelperText type="error" visible={!!error} style={styles.errorText}>
                  {error?.message}
                </HelperText>

                {/* Android: show inline picker. iOS: show modal picker to avoid layout jump */}
                {showDobPicker && Platform.OS !== 'ios' && (
                  <DateTimePicker
                    value={tempDob}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={(_, selected) => {
                      setShowDobPicker(false);
                      if (!selected) return;
                      const yyyy = selected.getFullYear();
                      const mm = String(selected.getMonth() + 1).padStart(2, '0');
                      const dd = String(selected.getDate()).padStart(2, '0');
                      onChange(`${yyyy}-${mm}-${dd}`);
                    }}
                  />
                )}

                {showDobPicker && Platform.OS === 'ios' && (
                  <Modal transparent animationType="fade" visible={showDobPicker}>
                    <View style={styles.dobOverlay}>
                      <View style={styles.dobSheet}>
                        <View style={styles.dobHeader}>
                          <Text style={styles.dobTitle}>Chọn ngày sinh</Text>
                          <Pressable
                            onPress={() => {
                              const yyyy = tempDob.getFullYear();
                              const mm = String(tempDob.getMonth() + 1).padStart(2, '0');
                              const dd = String(tempDob.getDate()).padStart(2, '0');
                              onChange(`${yyyy}-${mm}-${dd}`);
                              setShowDobPicker(false);
                            }}
                            style={styles.dobDoneBtn}
                          >
                            <Text style={styles.dobDoneText}>Xong</Text>
                          </Pressable>
                        </View>

                        <DateTimePicker
                          value={tempDob}
                          mode="date"
                          display="spinner"
                          themeVariant="light"
                          style={{ height: 216, width: '100%' }}
                          maximumDate={new Date()}
                          onChange={(_, selected) => {
                            if (selected) setTempDob(selected);
                          }}
                        />
                      </View>
                    </View>
                  </Modal>
                )}
              </View>
            )}
          />

          <Text style={styles.label}>Mật khẩu *</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
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
                <HelperText type="error" visible={!!error} style={styles.errorText}>
                  {error?.message}
                </HelperText>
              </View>
            )}
          />

          <Text style={styles.label}>Xác nhận mật khẩu *</Text>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
              <View style={styles.field}>
                <TextInput
                  mode="outlined"
                  placeholder="Xác nhận mật khẩu"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={!showConfirmPassword}
                  outlineColor="#E0E5ED"
                  activeOutlineColor="#0066FF"
                  style={styles.input}
                  theme={{ colors: { background: '#FFFFFF' } }}
                  textColor="#1A1D26"
                  right={
                    <TextInput.Icon
                      icon={showConfirmPassword ? "eye-off" : "eye"}
                      color="#A0A7BA"
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                  }
                />
                <HelperText type="error" visible={!!error} style={styles.errorText}>
                  {error?.message}
                </HelperText>
              </View>
            )}
          />

          <View style={styles.checklist}>
            <View style={styles.checkItem}>
              <MaterialCommunityIcons name="check" size={20} color={isValidLength ? "#10B981" : "#A0A7BA"} />
              <Text style={styles.checkText}>Mật khẩu trong khoảng 8-50 ký tự</Text>
            </View>
            <View style={styles.checkItem}>
              <MaterialCommunityIcons name="check" size={20} color={isNotEmail ? "#10B981" : "#A0A7BA"} />
              <Text style={styles.checkText}>Mật khẩu không được trùng email</Text>
            </View>
            <View style={styles.checkItem}>
              <MaterialCommunityIcons name="check" size={20} color={hasMixedChars ? "#10B981" : "#A0A7BA"} />
              <Text style={styles.checkText}>Mật khẩu bắt buộc phải bao gồm ít nhất 1 chữ viết thường, 1 số và 1 chữ viết hoa</Text>
            </View>
          </View>

          <Text style={styles.label}>Họ và tên *</Text>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
              <View style={styles.field}>
                <TextInput
                  mode="outlined"
                  placeholder="Nhập họ và tên của bạn"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
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

          <Text style={styles.label}>Username *</Text>
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
              <View style={styles.field}>
                <TextInput
                  mode="outlined"
                  placeholder="Nhập username của bạn"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
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

          <Controller
            control={control}
            name="agreedToTerms"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View>
                <TouchableOpacity 
                  style={styles.checkboxRow} 
                  onPress={() => onChange(!value)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons 
                    name={value ? "checkbox-marked" : "checkbox-blank-outline"} 
                    size={24} 
                    color={value ? "#0066FF" : "#A0A7BA"} 
                  />
                  <Text style={styles.checkboxText}>
                    Tôi đã đọc và đồng ý với <Text style={styles.linkText}>Điều khoản & Điều kiện</Text> cùng <Text style={styles.linkText}>Chính sách bảo mật</Text> của PTIT English
                  </Text>
                </TouchableOpacity>
                {!!error && (
                  <HelperText type="error" visible={!!error} style={styles.checkboxErrorText}>
                    {error.message}
                  </HelperText>
                )}
              </View>
            )}
          />

          <TouchableOpacity 
            style={[styles.btnPrimary, submitting && styles.btnPrimaryDisabled]} 
            onPress={handleSubmit(onSubmit, (errors) => console.log('Form errors:', errors))}
            disabled={submitting}
          >
            <Text style={styles.btnPrimaryText}>{submitting ? 'Đang đăng ký...' : 'Đăng ký'}</Text>
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
    paddingTop: 8,
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1D26',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 8,
    fontWeight: '600',
  },
  field: { 
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    fontSize: 15,
  },
  dobOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  dobSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 16,
    paddingTop: 4,
  },
  dobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F6',
  },
  dobTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1D26',
  },
  dobDoneBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#0066FF',
  },
  dobDoneText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  errorText: {
    marginTop: -4,
  },
  checkboxErrorText: {
    marginTop: -20,
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    marginBottom: 24,
    paddingRight: 20,
  },
  checkboxText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    flex: 1,
  },
  linkText: {
    color: '#0066FF',
    fontWeight: '600',
  },
  checklist: {
    marginBottom: 24,
    gap: 8,
    paddingHorizontal: 4,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkText: {
    flex: 1,
    fontSize: 13,
    color: '#70778C',
    lineHeight: 18,
  },
  btnPrimary: {
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnPrimaryDisabled: {
    backgroundColor: '#80B3FF',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
