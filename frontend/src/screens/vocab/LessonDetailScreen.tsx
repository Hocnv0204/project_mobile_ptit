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
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { lessonVocabApi } from '../../api/lessonVocabApi';
import { vocabApi } from '../../api/vocabApi';
import { VocabularyWithStatus, VocabularyStatus } from '../../api/types';
import { Routes } from '../../constants/routes';

export default function LessonDetailScreen({ route, navigation }: any) {
  const { lesson, isPersonal } = route.params;
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [vocabularies, setVocabularies] = useState<VocabularyWithStatus[]>([]);
  const [activeTab, setActiveTab] = useState<'flashcard' | 'practice'>('flashcard');
  const [statusFilter, setStatusFilter] = useState<'TODAY' | 'OVERDUE' | 'NEW' | 'ALL'>('ALL');
  const [isAddOptionsVisible, setAddOptionsVisible] = useState(false);
  const [isManualModalVisible, setManualModalVisible] = useState(false);
  const [manualTerm, setManualTerm] = useState('');
  const [manualVi, setManualVi] = useState('');
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [playingAudioForId, setPlayingAudioForId] = useState<number | null>(null);
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    if (isFocused) {
      fetchVocabularies();
    }
  }, [isFocused]);

  useEffect(() => {
    if (status.didJustFinish) {
      setPlayingAudioForId(null);
    }
  }, [status.didJustFinish]);

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

  const handlePlayAudioByItem = async (item: VocabularyWithStatus) => {
    const url = item.audioUrl;
    if (!url) return;
    if (playingAudioForId === item.id) return;

    try {
      setPlayingAudioForId(item.id);
      player.replace(url);
      player.play();
    } catch (e: any) {
      setPlayingAudioForId(null);
      Alert.alert('Lỗi', e?.message || 'Không thể phát audio');
    }
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

  const renderItem = ({ item }: { item: VocabularyWithStatus }) => (
    <View style={styles.vocabCard}>
      <View style={styles.vocabContent}>
        <View style={styles.vocabRow}>
          <Text style={styles.vocabTerm}>{item.term.toUpperCase()}</Text>
          <View style={[styles.statusBadge, badgeStyle(item.status)]}>
            <Text style={styles.statusText}>{nextReviewLabel(item.daysUntilReview)}</Text>
          </View>
        </View>
        <Text style={styles.vocabVi}>{item.vi}</Text>
      </View>
      <Pressable
        onPress={() => handlePlayAudioByItem(item)}
        style={styles.audioBtn}
        disabled={!item.audioUrl || playingAudioForId === item.id}
      >
        {playingAudioForId === item.id ? (
          <ActivityIndicator size="small" color="#0066FF" />
        ) : (
          <MaterialCommunityIcons
            name="volume-high"
            size={24}
            color={item.audioUrl ? '#A0A7BA' : '#E2E8F0'}
          />
        )}
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
              navigation.navigate(Routes.FLASHCARD, { lessonVocabId: lesson.id, lessonName: lesson.name });
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
          data={filterVocabularies(vocabularies, statusFilter)}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có từ vựng nào.</Text>
            </View>
          }
          ListHeaderComponent={
            <View style={styles.filterRow}>
              <Pressable
                style={[styles.filterChip, statusFilter === 'TODAY' && styles.filterChipActive]}
                onPress={() => setStatusFilter('TODAY')}
              >
                <Text style={[styles.filterChipText, statusFilter === 'TODAY' && styles.filterChipTextActive]}>
                  Hôm nay
                </Text>
              </Pressable>
              <Pressable
                style={[styles.filterChip, statusFilter === 'OVERDUE' && styles.filterChipActive]}
                onPress={() => setStatusFilter('OVERDUE')}
              >
                <Text style={[styles.filterChipText, statusFilter === 'OVERDUE' && styles.filterChipTextActive]}>
                  Quá hạn
                </Text>
              </Pressable>
              <Pressable
                style={[styles.filterChip, statusFilter === 'NEW' && styles.filterChipActive]}
                onPress={() => setStatusFilter('NEW')}
              >
                <Text style={[styles.filterChipText, statusFilter === 'NEW' && styles.filterChipTextActive]}>
                  Mới
                </Text>
              </Pressable>
              <Pressable
                style={[styles.filterChip, statusFilter === 'ALL' && styles.filterChipActive]}
                onPress={() => setStatusFilter('ALL')}
              >
                <Text style={[styles.filterChipText, statusFilter === 'ALL' && styles.filterChipTextActive]}>
                  Tất cả
                </Text>
              </Pressable>
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

const nextReviewLabel = (daysUntilReview?: number) => {
  const d = typeof daysUntilReview === 'number' ? daysUntilReview : 0;
  if (d <= 0) return 'Hôm nay';
  return `${d} ngày`;
};

const badgeStyle = (status?: VocabularyStatus) => {
  switch (status) {
    case 'OVERDUE':
      return { backgroundColor: '#FEE2E2' };
    case 'DUE_TODAY':
      return { backgroundColor: '#DBEAFE' };
    case 'NEW':
      return { backgroundColor: '#DCFCE7' };
    case 'UPCOMING':
    default:
      return { backgroundColor: '#F1F5F9' };
  }
};

const filterVocabularies = (list: VocabularyWithStatus[], filter: 'TODAY' | 'OVERDUE' | 'NEW' | 'ALL') => {
  switch (filter) {
    case 'TODAY':
      return list.filter((v) => v.status === 'DUE_TODAY');
    case 'OVERDUE':
      return list.filter((v) => v.status === 'OVERDUE');
    case 'NEW':
      return list.filter((v) => v.status === 'NEW');
    case 'ALL':
    default:
      return list;
  }
};

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
  filterRow: { flexDirection: 'row', gap: 10, paddingBottom: 12, paddingHorizontal: 0 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: { backgroundColor: '#1A1D26' },
  filterChipText: { fontSize: 13, fontWeight: '800', color: '#1A1D26' },
  filterChipTextActive: { color: '#FFFFFF' },
  vocabCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  vocabContent: { flex: 1 },
  vocabRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  vocabTerm: { fontSize: 16, fontWeight: '700', color: '#1A1D26', marginBottom: 4 },
  vocabVi: { fontSize: 14, color: '#70778C' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: '800', color: '#1A1D26' },
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
