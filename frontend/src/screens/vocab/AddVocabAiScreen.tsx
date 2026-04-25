import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { aiApi } from '../../api/aiApi';
import { Routes } from '../../constants/routes';

export default function AddVocabAiScreen({ route, navigation }: any) {
  const { lesson } = route.params;
  const insets = useSafeAreaInsets();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFormat = async () => {
    const text = input.trim();
    if (!text) {
      Alert.alert('Thông báo', 'Vui lòng nhập danh sách từ vựng');
      return;
    }

    try {
      setLoading(true);
      const res = await aiApi.formatTerms(text);
      
      if (res.data && res.data.length > 0) {
        navigation.navigate(Routes.AI_VOCAB_RESULT, { lesson, vocabularies: res.data });
      } else {
        Alert.alert('Thông báo', 'Không thể trích xuất từ vựng từ dữ liệu bạn nhập.');
      }
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Có lỗi xảy ra khi gọi AI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1D26" />
          </Pressable>
          <Text style={styles.headerTitle}>Thêm từ vựng bằng AI</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.labelTitle}>Nhập danh sách các từ tiếng Việt</Text>
          <Text style={styles.labelSubtitle}>Tách các từ bằng dấu phẩy. Ví dụ: con chó, con mèo, cái bàn...</Text>

          <TextInput
            style={styles.textInput}
            multiline
            placeholder="Nhập tại đây..."
            value={input}
            onChangeText={setInput}
            textAlignVertical="top"
          />

          <Pressable 
            style={[styles.btn, loading && styles.btnDisabled]} 
            onPress={handleFormat}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="magic-staff" size={20} color="#FFF" />
                <Text style={styles.btnText}>Chuẩn hoá bằng Gemini AI</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1D26' },
  placeholder: { width: 40 },
  content: { padding: 24 },
  labelTitle: { fontSize: 16, fontWeight: '700', color: '#1A1D26', marginBottom: 4 },
  labelSubtitle: { fontSize: 13, color: '#70778C', marginBottom: 24, lineHeight: 18 },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    height: 200,
    marginBottom: 24,
  },
  btn: {
    backgroundColor: '#0066FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  btnDisabled: { backgroundColor: '#A0C2FF' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
