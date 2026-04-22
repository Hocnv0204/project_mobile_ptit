import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { vocabApi } from '../../api/vocabApi';
import { Vocabulary } from '../../api/types';
import { useToast } from '../../components/ToastProvider';

function errorMessage(e: any): string {
  if (!e) return 'Không thể lưu từ vựng';
  if (typeof e === 'string') return e;
  if (typeof e?.message === 'string' && e.message.trim()) return e.message;
  // axios raw error (trường hợp chưa qua chuẩn hoá)
  const m1 = e?.response?.data?.message;
  if (typeof m1 === 'string' && m1.trim()) return m1;
  const m2 = e?.data?.message;
  if (typeof m2 === 'string' && m2.trim()) return m2;
  return 'Không thể lưu từ vựng';
}

export default function AiVocabResultScreen({ route, navigation }: any) {
  const { lesson, vocabularies: initialVocabularies } = route.params;
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [vocabularies, setVocabularies] = useState<Vocabulary[]>(initialVocabularies || []);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const successOpacity = useRef(new Animated.Value(0)).current;

  const handleRemove = (index: number) => {
    const newList = [...vocabularies];
    newList.splice(index, 1);
    setVocabularies(newList);
  };

  const showSuccessOverlay = () => {
    setShowSuccess(true);
    Animated.sequence([
      Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(successOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setShowSuccess(false);
      // Pop back 2 screens (AiVocabResult -> AddVocabAi -> LessonDetail)
      // LessonDetail's useIsFocused will trigger a reload of the word list
      navigation.pop(2);
    });
  };

  const handleSaveAll = async () => {
    if (vocabularies.length === 0) {
      toast.show('Danh sách trống. Không có gì để lưu.', { type: 'info' });
      return;
    }

    try {
      setSaving(true);
      const payload = { listVocabRequest: vocabularies };
      await vocabApi.createListVocab(lesson.id, payload);
      showSuccessOverlay();
    } catch (e: any) {
      toast.show(errorMessage(e), { type: 'error', durationMs: 4500 });
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item, index }: { item: Vocabulary, index: number }) => (
    <View style={styles.card}>
      <Pressable onPress={() => handleRemove(index)} style={styles.removeBtn}>
        <MaterialCommunityIcons name="close-circle" size={24} color="#EF4444" />
      </Pressable>
      <Text style={styles.term}>{item.term.toUpperCase()}</Text>
      <Text style={styles.phoneticType}>
        {item.pronunciation} • {item.type}
      </Text>
      <Text style={styles.meaning}>{item.vi}</Text>
      {item.example ? (
        <Text style={styles.example}>"{item.example}"</Text>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1D26" />
        </Pressable>
        <Text style={styles.headerTitle}>Thêm từ vựng bằng AI</Text>
        <View style={styles.placeholder} />
      </View>

      <Text style={styles.resultTitle}>Kết quả chuẩn hoá ({vocabularies.length})</Text>

      <FlatList
        data={vocabularies}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Đã xóa hết từ vựng.</Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <Pressable 
          style={styles.btnRetry} 
          onPress={() => navigation.goBack()}
          disabled={saving}
        >
          <MaterialCommunityIcons name="refresh" size={20} color="#70778C" />
          <Text style={styles.btnRetryText}>Làm lại</Text>
        </Pressable>
        
        <Pressable 
          style={[styles.btnSave, saving && styles.btnSaveDisabled]} 
          onPress={handleSaveAll}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.btnSaveText}>Lưu tất cả</Text>
          )}
        </Pressable>
      </View>

      {/* Success overlay */}
      {showSuccess && (
        <Animated.View style={[styles.successOverlay, { opacity: successOpacity }]}>
          <View style={styles.successBox}>
            <View style={styles.successIconCircle}>
              <MaterialCommunityIcons name="check" size={40} color="#FFF" />
            </View>
            <Text style={styles.successTitle}>Thành công!</Text>
            <Text style={styles.successSubtitle}>Đã lưu {vocabularies.length} từ vựng</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  successBox: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1D26',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#70778C',
    textAlign: 'center',
  },
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
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1D26',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  listContent: { paddingHorizontal: 24, paddingBottom: 24 },
  card: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  removeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 4,
  },
  term: { fontSize: 18, fontWeight: 'bold', color: '#0066FF', marginBottom: 4 },
  phoneticType: { fontSize: 13, color: '#70778C', fontStyle: 'italic', marginBottom: 8 },
  meaning: { fontSize: 16, fontWeight: '600', color: '#1A1D26', marginBottom: 4 },
  example: { fontSize: 14, color: '#A0A7BA', fontStyle: 'italic' },
  emptyContainer: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#A0A7BA', fontSize: 16 },
  footer: {
    flexDirection: 'row',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#EEF0F6',
    backgroundColor: '#FFF',
    gap: 16,
  },
  btnRetry: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  btnRetryText: { color: '#70778C', fontSize: 16, fontWeight: '600' },
  btnSave: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#0066FF',
  },
  btnSaveDisabled: { backgroundColor: '#A0C2FF' },
  btnSaveText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
