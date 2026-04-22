import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { lessonVocabApi } from '../../api/lessonVocabApi';
import { Vocabulary } from '../../api/types';
import { Routes } from '../../constants/routes';

export default function LessonDetailScreen({ route, navigation }: any) {
  const { lesson, isPersonal } = route.params;
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [activeTab, setActiveTab] = useState<'flashcard' | 'practice'>('flashcard');

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
          <Pressable onPress={() => navigation.navigate(Routes.ADD_VOCAB_AI, { lesson })} style={styles.addBtn}>
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
});
