import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { flashcardApi, FlashcardCard } from '../../api/flashcardApi';

export default function FlashcardScreen({ route, navigation }: any) {
  const { lessonVocabId, lessonName } = route.params as { lessonVocabId: number; lessonName?: string };
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<FlashcardCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonVocabId]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const res = await flashcardApi.getSession(lessonVocabId);
      setCards(res.data?.dueCards || []);
      setCurrentIndex(0);
      resetFlip();
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể tải phiên flashcard');
    } finally {
      setLoading(false);
    }
  };

  const handleFlip = () => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const resetFlip = () => {
    flipAnim.setValue(0);
    setIsFlipped(false);
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      resetFlip();
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      resetFlip();
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? (currentIndex + 1) / cards.length : 0;

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = { transform: [{ rotateY: frontInterpolate }] };
  const backAnimatedStyle = { transform: [{ rotateY: backInterpolate }] };

  const submitQuality = async (quality: number) => {
    if (!currentCard) return;
    try {
      setSubmitting(true);
      await flashcardApi.submitReview({ vocabularyId: currentCard.vocabularyId, quality });
      await fetchSession();
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể lưu kết quả ôn thẻ');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  if (!currentCard) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={24} color="#1A1D26" />
          </Pressable>
          <Text style={styles.emptyTitle}>{lessonName || 'Flashcards'}</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Hôm nay bạn không có thẻ nào cần ôn.</Text>
          <Pressable style={styles.reloadBtn} onPress={fetchSession}>
            <Text style={styles.reloadBtnText}>Tải lại</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={24} color="#1A1D26" />
        </Pressable>
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1}/{cards.length}
        </Text>
      </View>

      {/* Card Area */}
      <View style={styles.cardContainer}>
        <Pressable style={styles.cardWrapper} onPress={handleFlip}>
          {/* Front Card */}
          <Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle]}>
            <Text style={styles.cardLabel}>TỪ VỰNG</Text>
            <Text style={styles.term}>{currentCard.term.toUpperCase()}</Text>
            <Text style={styles.pronunciation}>{currentCard.pronunciation || '---'}</Text>
            
            <View style={styles.hintContainer}>
              <MaterialCommunityIcons name="gesture-tap" size={20} color="#A0A7BA" />
              <Text style={styles.hintText}>Chạm để xem nghĩa</Text>
            </View>
          </Animated.View>

          {/* Back Card */}
          <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
            <Text style={styles.cardLabel}>NGHĨA</Text>
            <Text style={styles.meaning}>{currentCard.vi}</Text>
            <Text style={styles.type}>Loại từ: {currentCard.type || '---'}</Text>
            {currentCard.example ? (
              <Text style={styles.example}>Ví dụ: {currentCard.example}</Text>
            ) : null}
          </Animated.View>
        </Pressable>
      </View>

      {/* Quality Buttons (SM-2) */}
      <View style={styles.qualityRow}>
        <Pressable style={[styles.qBtn, styles.qAgain, submitting && styles.qDisabled]} onPress={() => submitQuality(0)} disabled={submitting}>
          <Text style={styles.qText}>Again</Text>
        </Pressable>
        <Pressable style={[styles.qBtn, styles.qHard, submitting && styles.qDisabled]} onPress={() => submitQuality(3)} disabled={submitting}>
          <Text style={styles.qText}>Hard</Text>
        </Pressable>
        <Pressable style={[styles.qBtn, styles.qGood, submitting && styles.qDisabled]} onPress={() => submitQuality(4)} disabled={submitting}>
          <Text style={styles.qText}>Good</Text>
        </Pressable>
        <Pressable style={[styles.qBtn, styles.qEasy, submitting && styles.qDisabled]} onPress={() => submitQuality(5)} disabled={submitting}>
          <Text style={styles.qText}>Easy</Text>
        </Pressable>
      </View>

      {/* Footer Controls */}
      <View style={styles.footer}>
        <Pressable 
          style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]} 
          onPress={handlePrev}
          disabled={currentIndex === 0}
        >
          <MaterialCommunityIcons name="arrow-left" size={28} color={currentIndex === 0 ? '#E2E8F0' : '#0066FF'} />
        </Pressable>

        <Pressable style={styles.flipBtn} onPress={handleFlip}>
          <MaterialCommunityIcons name="sync" size={24} color="#FFF" />
          <Text style={styles.flipBtnText}>Lật thẻ</Text>
        </Pressable>

        <Pressable 
          style={[styles.navBtn, currentIndex === cards.length - 1 && styles.navBtnDisabled]} 
          onPress={handleNext}
          disabled={currentIndex === cards.length - 1}
        >
          <MaterialCommunityIcons name="arrow-right" size={28} color={currentIndex === cards.length - 1 ? '#E2E8F0' : '#0066FF'} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  closeBtn: { padding: 8 },
  progressContainer: {
    flex: 1,
    marginHorizontal: 16,
    justifyContent: 'center',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0066FF',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#70778C',
    width: 32,
    textAlign: 'center',
  },
  emptyTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#1A1D26' },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#70778C', textAlign: 'center', marginBottom: 16 },
  reloadBtn: { backgroundColor: '#0066FF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  reloadBtnText: { color: '#FFF', fontWeight: '800' },
  cardContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  cardWrapper: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    backfaceVisibility: 'hidden',
  },
  cardFront: {},
  cardBack: {},
  cardLabel: {
    position: 'absolute',
    top: 32,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#A0A7BA',
    letterSpacing: 1.5,
  },
  term: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1A1D26',
    marginBottom: 8,
    textAlign: 'center',
  },
  pronunciation: {
    fontSize: 18,
    color: '#70778C',
    fontStyle: 'italic',
  },
  meaning: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0066FF',
    marginBottom: 16,
    textAlign: 'center',
  },
  type: {
    fontSize: 16,
    color: '#70778C',
    marginBottom: 8,
  },
  example: {
    fontSize: 16,
    color: '#1A1D26',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
  hintContainer: {
    position: 'absolute',
    bottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hintText: {
    fontSize: 14,
    color: '#A0A7BA',
  },
  qualityRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  qBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  qText: { fontSize: 14, fontWeight: '800', color: '#1A1D26' },
  qAgain: { backgroundColor: '#FEE2E2' },
  qHard: { backgroundColor: '#FEF3C7' },
  qGood: { backgroundColor: '#DBEAFE' },
  qEasy: { backgroundColor: '#DCFCE7' },
  qDisabled: { opacity: 0.6 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  navBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  navBtnDisabled: {
    backgroundColor: '#F8F9FA',
    shadowOpacity: 0,
    elevation: 0,
  },
  flipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1D26',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#1A1D26',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  flipBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
