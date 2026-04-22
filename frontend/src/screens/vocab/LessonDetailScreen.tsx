import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { lessonVocabApi } from '../../api/lessonVocabApi';
import { vocabApi } from '../../api/vocabApi';
import { Vocabulary } from '../../api/types';
import { Routes } from '../../constants/routes';

export default function LessonDetailScreen({ route, navigation }: any) {
  const { lesson, isPersonal } = route.params;
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [activeTab, setActiveTab] = useState<'flashcard' | 'practice'>('flashcard');
  const [isAddOptionsVisible, setAddOptionsVisible] = useState(false);
  const [isManualModalVisible, setManualModalVisible] = useState(false);
  const [manualTerm, setManualTerm] = useState('');
  const [manualVi, setManualVi] = useState('');
  const [isSavingManual, setIsSavingManual] = useState(false);

  useEffect(() => {
    if (isFocused) {
      fetchVocabularies();
    }
  }, [isFocused]);

  const fetchVocabularies = async () => {
    try {
      setLoading(true);
      const res = await lessonVocabApi.getVocabularies(lesson.id);
      setVocabularies(res.data || []);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể tải danh sách từ vựng');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAudio = (url?: string) => {
    if (!url) {
      // Alert.alert('Thông báo', 'Từ vựng này chưa có âm thanh');
      return;
    }
    // TODO: Implement Expo AV to play audio url
  };

  const openManualModal = () => {
    setAddOptionsVisible(false);
    setManualTerm('');
    setManualVi('');
    setManualModalVisible(true);
  };

  const handleCreateManualVocab = async () => {
    const term = manualTerm.trim();
    const vi = manualVi.trim();
    if (!term || !vi) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ Từ (term) và Nghĩa (vi).');
      return;
    }
    try {
      setIsSavingManual(true);
      await vocabApi.createVocabSimple(lesson.id, { term, vi });
      setManualModalVisible(false);
      setManualTerm('');
      setManualVi('');
      fetchVocabularies();
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể thêm từ vựng');
    } finally {
      setIsSavingManual(false);
    }
  };

  const renderItem = ({ item }: { item: Vocabulary }) => (
    <View style={styles.vocabCard}>
      <View style={styles.vocabContent}>
        <Text style={styles.vocabTerm}>{item.term.toUpperCase()}</Text>
        <Text style={styles.vocabVi}>{item.vi}</Text>
      </View>
      <Pressable onPress={() => handlePlayAudio(item.audioUrl)} style={styles.audioBtn}>
        <MaterialCommunityIcons name="volume-high" size={24} color="#A0A7BA" />
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1D26" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{lesson.name}</Text>
        {isPersonal ? (
          <Pressable onPress={() => setAddOptionsVisible(true)} style={styles.addBtn}>
            <MaterialCommunityIcons name="plus" size={24} color="#0066FF" />
          </Pressable>
        ) : (
          <View style={styles.addBtnPlaceholder} />
        )}
      </View>

      <View style={styles.tabContainer}>
        <Pressable 
          style={[styles.tabBtn, activeTab === 'flashcard' && styles.tabBtnActiveFlashcard]}
          onPress={() => {
            setActiveTab('flashcard');
            if (vocabularies.length > 0) {
              navigation.navigate(Routes.FLASHCARD, { vocabularies });
            } else {
              Alert.alert('Thông báo', 'Chưa có từ vựng nào để học Flashcard');
            }
          }}
        >
          <MaterialCommunityIcons name="cards-outline" size={20} color={activeTab === 'flashcard' ? '#FFF' : '#0066FF'} />
          <Text style={[styles.tabBtnText, activeTab === 'flashcard' && styles.tabBtnTextActive]}>
            Flashcards
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.tabBtn, activeTab === 'practice' && styles.tabBtnActivePractice]}
          onPress={() => {
            if (vocabularies.length === 0) {
              Alert.alert('Thông báo', 'Chưa có từ vựng nào để luyện tập.');
              return;
            }
            navigation.navigate(Routes.QUIZ_MODE_SELECT, { lesson, vocabularies });
          }}
        >
          <MaterialCommunityIcons name="head-question-outline" size={20} color={activeTab === 'practice' ? '#FFF' : '#8B5CF6'} />
          <Text style={[styles.tabBtnText, activeTab === 'practice' && styles.tabBtnTextActive]}>
            Luyện tập
          </Text>
        </Pressable>
      </View>

      <Text style={styles.vocabCount}>{vocabularies.length} từ vựng</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0066FF" />
        </View>
      ) : (
        <FlatList
          data={vocabularies}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có từ vựng nào.</Text>
            </View>
          }
        />
      )}

      {/* Add options modal */}
      <Modal visible={isAddOptionsVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setAddOptionsVisible(false)}>
          <View style={styles.optionSheet}>
            <Text style={styles.optionTitle}>Thêm từ vựng</Text>

            <Pressable
              style={styles.optionBtn}
              onPress={() => {
                setAddOptionsVisible(false);
                navigation.navigate(Routes.ADD_VOCAB_AI, { lesson });
              }}
            >
              <MaterialCommunityIcons name="robot-outline" size={22} color="#10B981" />
              <Text style={styles.optionText}>Thêm bằng AI</Text>
            </Pressable>

            <Pressable style={styles.optionBtn} onPress={openManualModal}>
              <MaterialCommunityIcons name="pencil-outline" size={22} color="#2563EB" />
              <Text style={styles.optionText}>Thêm thủ công</Text>
            </Pressable>

            <Pressable style={[styles.optionBtn, styles.optionCancel]} onPress={() => setAddOptionsVisible(false)}>
              <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              <Text style={[styles.optionText, { color: '#64748B' }]}>Huỷ</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Manual add modal */}
      <Modal visible={isManualModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlayCenter}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => !isSavingManual && setManualModalVisible(false)} />

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.manualScrollContent,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            <View style={styles.manualModal}>
              <Text style={styles.manualTitle}>Thêm từ vựng thủ công</Text>
              <TextInput
                style={styles.manualInput}
                placeholder="Term (tiếng Anh)"
                placeholderTextColor="#A0A7BA"
                value={manualTerm}
                onChangeText={setManualTerm}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                style={styles.manualInput}
                placeholder="Nghĩa (tiếng Việt)"
                placeholderTextColor="#A0A7BA"
                value={manualVi}
                onChangeText={setManualVi}
              />

              <View style={styles.manualActions}>
                <Pressable
                  style={[styles.manualBtn, styles.manualBtnCancel]}
                  onPress={() => {
                    if (isSavingManual) return;
                    setManualModalVisible(false);
                  }}
                  disabled={isSavingManual}
                >
                  <Text style={styles.manualBtnCancelText}>Huỷ</Text>
                </Pressable>
                <Pressable
                  style={[styles.manualBtn, styles.manualBtnSubmit, isSavingManual && styles.manualBtnDisabled]}
                  onPress={handleCreateManualVocab}
                  disabled={isSavingManual}
                >
                  {isSavingManual ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.manualBtnSubmitText}>Thêm</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1D26', flex: 1, textAlign: 'center' },
  addBtn: { padding: 8 },
  addBtnPlaceholder: { width: 40 },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F0F5FF',
    gap: 8,
  },
  tabBtnActiveFlashcard: { backgroundColor: '#0066FF' },
  tabBtnActivePractice: { backgroundColor: '#8B5CF6' },
  tabBtnText: { fontSize: 14, fontWeight: '600', color: '#0066FF' },
  tabBtnTextActive: { color: '#FFF' },
  vocabCount: {
    paddingHorizontal: 24,
    fontSize: 14,
    fontWeight: '600',
    color: '#70778C',
    marginBottom: 8,
  },
  listContent: { paddingHorizontal: 24, paddingBottom: 40 },
  vocabCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  vocabContent: { flex: 1 },
  vocabTerm: { fontSize: 16, fontWeight: '700', color: '#1A1D26', marginBottom: 4 },
  vocabVi: { fontSize: 14, color: '#70778C' },
  audioBtn: { padding: 8 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#A0A7BA', fontSize: 16 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  optionSheet: {
    backgroundColor: '#FFF',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 10,
  },
  optionTitle: { fontSize: 16, fontWeight: '800', color: '#1A1D26', marginBottom: 4 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F8F9FA',
  },
  optionCancel: { backgroundColor: '#F1F5F9' },
  optionText: { fontSize: 15, fontWeight: '700', color: '#1A1D26' },

  manualScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  manualModal: {
    backgroundColor: '#FFF',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderRadius: 20,
  },
  manualTitle: { fontSize: 16, fontWeight: '800', color: '#1A1D26', marginBottom: 12 },
  manualInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    marginBottom: 10,
    color: '#1A1D26',
  },
  manualActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  manualBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  manualBtnCancel: { backgroundColor: '#F1F5F9' },
  manualBtnSubmit: { backgroundColor: '#0066FF' },
  manualBtnDisabled: { opacity: 0.6 },
  manualBtnCancelText: { fontSize: 15, fontWeight: '800', color: '#64748B' },
  manualBtnSubmitText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
});
