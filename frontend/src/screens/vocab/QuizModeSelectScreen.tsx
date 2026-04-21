import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Routes } from '../../constants/routes';
import { Vocabulary } from '../../api/types';
import { QuizMode } from '../../api/quizApi';

const MIN_VOCAB_FOR_QUIZ = 4;

type Mode = { key: QuizMode; label: string; desc: string };
const MODES: Mode[] = [
  { key: 'EN_TO_VI', label: 'Anh → Việt', desc: 'Đọc từ tiếng Anh, chọn nghĩa tiếng Việt' },
  { key: 'VI_TO_EN', label: 'Việt → Anh', desc: 'Đọc nghĩa tiếng Việt, chọn từ tiếng Anh' },
  { key: 'MIXED',    label: 'Hỗn hợp',   desc: 'Ngẫu nhiên cả hai chiều' },
];

export default function QuizModeSelectScreen({ route, navigation }: any) {
  const { lesson, vocabularies } = route.params as {
    lesson: { id: number; name: string };
    vocabularies: Vocabulary[];
  };
  const insets = useSafeAreaInsets();
  const [selectedMode, setSelectedMode] = useState<QuizMode>('MIXED');

  const handleStartMultipleChoice = () => {
    if (vocabularies.length < MIN_VOCAB_FOR_QUIZ) {
      Alert.alert(
        'Không đủ từ vựng',
        `Cần ít nhất ${MIN_VOCAB_FOR_QUIZ} từ vựng để làm trắc nghiệm. Bài này có ${vocabularies.length} từ.`,
      );
      return;
    }
    navigation.navigate(Routes.QUIZ_SESSION, {
      lesson,
      vocabularies,
      type: 'MULTIPLE_CHOICE',
      mode: selectedMode,
    });
  };

  const handleStartEssay = () => {
    if (vocabularies.length === 0) {
      Alert.alert('Thông báo', 'Bài này chưa có từ vựng nào.');
      return;
    }
    navigation.navigate(Routes.QUIZ_SESSION, {
      lesson,
      vocabularies,
      type: 'ESSAY',
      mode: 'EN_TO_VI', // Tự luận mặc định: đọc từ Anh → gõ nghĩa Việt
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1D26" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Luyện tập
        </Text>
        <View style={styles.backBtn} />
      </View>

      <Text style={styles.lessonName} numberOfLines={2}>{lesson.name}</Text>
      <Text style={styles.vocabCount}>{vocabularies.length} từ vựng</Text>

      {/* Mode Selector (chỉ hiện khi chọn trắc nghiệm) */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Chọn hướng câu hỏi</Text>
        <View style={styles.modeRow}>
          {MODES.map((m) => (
            <Pressable
              key={m.key}
              style={[styles.modeChip, selectedMode === m.key && styles.modeChipActive]}
              onPress={() => setSelectedMode(m.key)}
            >
              <Text
                style={[styles.modeChipText, selectedMode === m.key && styles.modeChipTextActive]}
              >
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.modeDesc}>
          {MODES.find((m) => m.key === selectedMode)?.desc}
        </Text>
      </View>

      {/* Cards */}
      <View style={styles.cardsContainer}>
        {/* Trắc nghiệm */}
        <Pressable
          style={({ pressed }) => [styles.card, styles.cardMC, pressed && styles.cardPressed]}
          onPress={handleStartMultipleChoice}
        >
          <View style={[styles.cardIconWrap, styles.cardIconWrapMC]}>
            <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={36} color="#8B5CF6" />
          </View>
          <Text style={styles.cardTitle}>Trắc nghiệm</Text>
          <Text style={styles.cardDesc}>
            Chọn 1 trong 4 đáp án dựa trên từ vựng trong bài
          </Text>
          <View style={styles.cardBadge}>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#8B5CF6" />
          </View>
        </Pressable>

        {/* Tự luận */}
        <Pressable
          style={({ pressed }) => [styles.card, styles.cardEssay, pressed && styles.cardPressed]}
          onPress={handleStartEssay}
        >
          <View style={[styles.cardIconWrap, styles.cardIconWrapEssay]}>
            <MaterialCommunityIcons name="pencil-outline" size={36} color="#F59E0B" />
          </View>
          <Text style={styles.cardTitle}>Tự luận</Text>
          <Text style={styles.cardDesc}>
            Đọc từ tiếng Anh rồi tự gõ nghĩa tiếng Việt
          </Text>
          <View style={styles.cardBadge}>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#F59E0B" />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  backBtn: { padding: 8, width: 40 },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1D26',
    flex: 1,
    textAlign: 'center',
  },
  lessonName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1D26',
    marginTop: 24,
    marginHorizontal: 24,
    textAlign: 'center',
  },
  vocabCount: {
    fontSize: 14,
    color: '#70778C',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#70778C',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  modeChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modeChipActive: { backgroundColor: '#8B5CF6' },
  modeChipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  modeChipTextActive: { color: '#FFF' },
  modeDesc: { fontSize: 13, color: '#70778C', textAlign: 'center' },
  cardsContainer: { paddingHorizontal: 24, gap: 16 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    position: 'relative',
  },
  cardMC: { borderLeftWidth: 4, borderLeftColor: '#8B5CF6' },
  cardEssay: { borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  cardPressed: { opacity: 0.85 },
  cardIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconWrapMC: { backgroundColor: '#F3F0FF' },
  cardIconWrapEssay: { backgroundColor: '#FFFBEB' },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#1A1D26', marginBottom: 6 },
  cardDesc: { fontSize: 14, color: '#70778C', lineHeight: 20 },
  cardBadge: {
    position: 'absolute',
    right: 20,
    top: '50%',
  },
});
