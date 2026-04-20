import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Snackbar } from 'react-native-paper';
import { lessonVocabApi } from '../../api/lessonVocabApi';

export default function CreateLessonScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Vui lòng nhập tên bộ từ vựng');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await lessonVocabApi.createSimple({ name: name.trim() });
      setSuccessMsg(res.message || 'Tạo bộ từ vựng thành công!');
      setVisible(true);
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi tạo bộ từ vựng');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="close" size={28} color="#1A1D26" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tạo bộ từ vựng mới</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.container}>
          <Text style={styles.label}>Tên bộ từ vựng</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: Động vật, Đồ dùng học tập..."
            value={name}
            onChangeText={(val) => {
              setName(val);
              setError(null);
            }}
            autoFocus
          />
          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.btnPrimary, submitting && styles.btnDisabled]}
            onPress={handleCreate}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.btnPrimaryText}>Tạo ngay</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={2000}
        style={styles.snackbar}
      >
        {successMsg}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1D26',
  },
  container: {
    padding: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FD',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E5ED',
    color: '#1A1D26',
  },
  errorText: {
    color: '#E91E63',
    fontSize: 13,
    marginTop: 8,
  },
  btnPrimary: {
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  btnDisabled: {
    backgroundColor: '#80B3FF',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  snackbar: {
    backgroundColor: '#4CAF50',
    marginBottom: 20,
  },
});
