import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { lessonVocabApi } from '../../api/lessonVocabApi';
import { LessonVocab, Vocabulary } from '../../api/types';
import { Routes } from '../../constants/routes';

export default function LessonDetailScreen({ route, navigation }: any) {
  const { lesson } = route.params as { lesson: LessonVocab };
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVocabularies = async () => {
    try {
      const res = await lessonVocabApi.getVocabularies(lesson.id);
      setVocabularies(res.data || []);
    } catch (error) {
      console.error('Fetch vocab error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchVocabularies();
    }, [lesson.id])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchVocabularies();
  };

  const renderVocabItem = ({ item }: { item: Vocabulary }) => (
    <TouchableOpacity
      style={styles.vocabCard}
      onPress={() => navigation.navigate(Routes.VOCAB_DETAIL, { vocab: item })}
    >
      <View style={styles.vocabInfo}>
        <Text style={styles.termText}>{item.term}</Text>
        <Text style={styles.viText} numberOfLines={1}>{item.vi}</Text>
      </View>
      <MaterialCommunityIcons name="volume-high" size={24} color="#A0A7BA" />
    </TouchableOpacity>
  );

  const isUserSet = lesson.levelId === null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#1A1D26" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{lesson.name}</Text>
        {isUserSet ? (
          <TouchableOpacity 
            onPress={() => navigation.navigate(Routes.ADD_VOCAB, { lessonId: lesson.id })}
            style={styles.headerAction}
          >
            <MaterialCommunityIcons name="plus" size={24} color="#0066FF" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.flashcardBtn]}
          onPress={() => navigation.navigate(Routes.FLASHCARDS, { vocabularies })}
        >
          <MaterialCommunityIcons name="cards-outline" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Flashcards</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.quizBtn]}
          onPress={() => navigation.navigate(Routes.VOCAB_QUIZ, { vocabularies })}
        >
          <MaterialCommunityIcons name="head-question-outline" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Luyện tập</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0066FF" />
        </View>
      ) : (
        <FlatList
          data={vocabularies}
          renderItem={renderVocabItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={
            <Text style={styles.listTitle}>{vocabularies.length} từ vựng</Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="book-open-variant" size={64} color="#E0E5ED" />
              <Text style={styles.emptyText}>Chưa có từ vựng nào trong bài học này.</Text>
            </View>
          }
        />
      )}
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
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1D26',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerAction: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginVertical: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  flashcardBtn: {
    backgroundColor: '#0066FF',
  },
  quizBtn: {
    backgroundColor: '#8E54E9',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#70778C',
    marginBottom: 16,
    marginTop: 8,
  },
  vocabCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FD',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF0F6',
  },
  vocabInfo: {
    flex: 1,
  },
  termText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1D26',
    marginBottom: 2,
  },
  viText: {
    fontSize: 14,
    color: '#70778C',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    color: '#A0A7BA',
    textAlign: 'center',
  },
});
