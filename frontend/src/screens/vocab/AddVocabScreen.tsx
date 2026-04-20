import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Snackbar } from 'react-native-paper';
import { aiApi } from '../../api/aiApi';
import { vocabApi } from '../../api/vocabApi';
import { Vocabulary } from '../../api/types';

export default function AddVocabScreen({ route, navigation }: any) {
  const { lessonId } = route.params;
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewList, setPreviewList] = useState<Vocabulary[]>([]);
  const [mode, setMode] = useState<'INPUT' | 'PREVIEW'>('INPUT');
  const [visible, setVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  const handleFormat = async () => {
    if (!input.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập danh sách từ vựng');
      return;
    }

    try {
      setLoading(true);
      Keyboard.dismiss();
      const res = await aiApi.formatTerms(input.trim());
      setPreviewList(res.data || []);
      setMode('PREVIEW');
    } catch (error: any) {
      Alert.alert('Lỗi AI', error?.message || 'Không thể chuẩn hoá từ vựng. Thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      // Backend expects CreateVocabRequest[] inside CreateListVocabRequest
      const vocabData = previewList.map(v => ({
        term: v.term,
        vi: v.vi,
        type: v.type,
        pronunciation: v.pronunciation,
        example: v.example,
      }));

      const res = await vocabApi.createListVocab(lessonId, { listVocabRequest: vocabData });
      setSnackbarMsg(res.message || 'Đã thêm từ vựng thành công!');
      setVisible(true);
      
      // Navigate back after a short delay to allow snackbar to be seen
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error: any) {
      Alert.alert('Lỗi lưu trữ', error?.message || 'Không thể lưu từ vựng.');
    } finally {
      setSaving(false);
    }
  };

  const removeItem = (index: number) => {
    const newList = [...previewList];
    newList.splice(index, 1);
    setPreviewList(newList);
    if (newList.length === 0) setMode('INPUT');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#1A1D26" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm từ vựng bằng AI</Text>
        <View style={{ width: 40 }} />
      </View>

      {mode === 'INPUT' ? (
        <View style={styles.content}>
          <Text style={styles.label}>Nhập danh sách các từ tiếng Việt</Text>
          <Text style={styles.subLabel}>Tách các từ bằng dấu phẩy. Ví dụ: con chó, con mèo, cái bàn...</Text>
          
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={10}
            placeholder="Nhập tại đây..."
            value={input}
            onChangeText={setInput}
            textAlignVertical="top"
          />

          <TouchableOpacity 
            style={[styles.btnPrimary, { marginTop: 24 }, loading && styles.btnDisabled]}
            onPress={handleFormat}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="auto-fix" size={20} color="#FFFFFF" />
                <Text style={styles.btnPrimaryText}>Chuẩn hoá bằng Gemini AI</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.listContainer}>
            <Text style={styles.previewTitle}>Kết quả chuẩn hoá ({previewList.length})</Text>
            {previewList.map((item, index) => (
              <View key={index} style={styles.previewCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.previewTerm}>{item.term}</Text>
                  <TouchableOpacity onPress={() => removeItem(index)}>
                    <MaterialCommunityIcons name="close-circle" size={20} color="#E91E63" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.previewPronun}>{item.pronunciation} • {item.type}</Text>
                <Text style={styles.previewVi}>{item.vi}</Text>
                <Text style={styles.previewEx} numberOfLines={2}>"{item.example}"</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.btnSecondary} 
              onPress={() => setMode('INPUT')}
              disabled={saving}
            >
              <MaterialCommunityIcons name="refresh" size={20} color="#70778C" />
              <Text style={styles.btnSecondaryText}>Làm lại</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btnPrimary, { flex: 2 }, saving && styles.btnDisabled]}
              onPress={handleSaveAll}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.btnPrimaryText}>Lưu tất cả</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={2000}
        style={styles.snackbar}
      >
        {snackbarMsg}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1D26',
  },
  content: {
    padding: 24,
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1D26',
    marginBottom: 4,
  },
  subLabel: {
    fontSize: 13,
    color: '#70778C',
    marginBottom: 16,
  },
  textArea: {
    backgroundColor: '#F8F9FD',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#1A1D26',
    minHeight: 200,
    borderWidth: 1,
    borderColor: '#E0E5ED',
  },
  btnPrimary: {
    backgroundColor: '#0066FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15, // Reduced by 1 to account for 1px border on top/bottom
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E5ED',
    backgroundColor: '#F8F9FD',
    gap: 6,
  },
  btnSecondaryText: {
    color: '#70778C',
    fontWeight: '700',
    fontSize: 16,
  },
  btnDisabled: {
    backgroundColor: '#80B3FF',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  listContainer: {
    padding: 24,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1D26',
    marginBottom: 16,
  },
  previewCard: {
    backgroundColor: '#F8F9FD',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF0F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  previewTerm: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0066FF',
  },
  previewPronun: {
    fontSize: 13,
    color: '#70778C',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  previewVi: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1D26',
    marginBottom: 4,
  },
  previewEx: {
    fontSize: 13,
    color: '#A0A7BA',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F5FF',
    backgroundColor: '#FFFFFF',
  },
  snackbar: {
    backgroundColor: '#4CAF50',
    marginBottom: 80,
  },
});
