import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { quizApi, QuizQuestion, QuizSession } from '../../api/quizApi';
import { Vocabulary } from '../../api/types';

type QuizType = 'MULTIPLE_CHOICE' | 'ESSAY';

// ─── Result Screen ─────────────────────────────────────────────────────────────
function ResultScreen({
  score,
  total,
  onRetry,
  onBack,
}: {
  score: number;
  total: number;
  onRetry: () => void;
  onBack: () => void;
}) {
  const percent = Math.round((score / total) * 100);
  const emoji = percent >= 80 ? '🎉' : percent >= 50 ? '👍' : '💪';
  const color = percent >= 80 ? '#22C55E' : percent >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <View style={resultStyles.container}>
      <Text style={resultStyles.emoji}>{emoji}</Text>
      <Text style={resultStyles.title}>Kết quả luyện tập</Text>
      <View style={[resultStyles.scoreCard, { borderColor: color }]}>
        <Text style={[resultStyles.scoreNum, { color }]}>
          {score}/{total}
        </Text>
        <Text style={resultStyles.scorePercent}>{percent}%</Text>
        <Text style={resultStyles.scoreLabel}>câu trả lời đúng</Text>
      </View>
      <Pressable style={[resultStyles.btn, resultStyles.btnRetry]} onPress={onRetry}>
        <MaterialCommunityIcons name="refresh" size={20} color="#FFF" />
        <Text style={resultStyles.btnText}>Làm lại</Text>
      </Pressable>
      <Pressable style={[resultStyles.btn, resultStyles.btnBack]} onPress={onBack}>
        <MaterialCommunityIcons name="arrow-left" size={20} color="#8B5CF6" />
        <Text style={[resultStyles.btnText, { color: '#8B5CF6' }]}>Quay về bài học</Text>
      </Pressable>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function QuizSessionScreen({ route, navigation }: any) {
  const { lesson, vocabularies, type, mode } = route.params as {
    lesson: { id: number; name: string };
    vocabularies: Vocabulary[];
    type: QuizType;
    mode: string;
  };
  const insets = useSafeAreaInsets();

  // ── Trắc nghiệm state ──
  const [session, setSession] = useState<QuizSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(type === 'MULTIPLE_CHOICE');

  // ── Tự luận state ──
  const [essayVocabs] = useState<Vocabulary[]>(() => [...vocabularies].sort(() => Math.random() - 0.5));

  // ── Chung ──
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [checkResult, setCheckResult] = useState<{ correct: boolean; correctAnswer: string; explanation?: string } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'answering' | 'finished'>('answering');

  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const autoNextTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load session cho trắc nghiệm
  useEffect(() => {
    if (type === 'MULTIPLE_CHOICE') {
      fetchSession();
    }
    return () => {
      if (autoNextTimer.current) clearTimeout(autoNextTimer.current);
    };
  }, []);

  const fetchSession = async () => {
    try {
      setLoadingSession(true);
      const res = await quizApi.generateSession(lesson.id, mode as any);
      setSession(res.data);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể tải câu hỏi');
      navigation.goBack();
    } finally {
      setLoadingSession(false);
    }
  };

  const questions: QuizQuestion[] = session?.questions ?? [];
  const totalQuestions = type === 'MULTIPLE_CHOICE' ? questions.length : essayVocabs.length;
  const progress = totalQuestions > 0 ? (currentIndex + 1) / totalQuestions : 0;

  // Animate feedback overlay
  const showFeedback = (result: typeof checkResult) => {
    setCheckResult(result);
    feedbackAnim.setValue(0);
    Animated.spring(feedbackAnim, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
  };

  const handleNext = () => {
    if (autoNextTimer.current) clearTimeout(autoNextTimer.current);
    setCheckResult(null);
    setSelectedOption(null);
    setTypedAnswer('');
    feedbackAnim.setValue(0);

    if (currentIndex + 1 >= totalQuestions) {
      setPhase('finished');
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // ── Trắc nghiệm: chọn đáp án ──
  const handleSelectOption = async (option: string) => {
    if (checkResult || isChecking) return;
    const q = questions[currentIndex];
    setSelectedOption(option);
    try {
      setIsChecking(true);
      const res = await quizApi.checkAnswer(q.vocabularyId, q.mode as any, option);
      const result = res.data;
      if (result.correct) setScore((s) => s + 1);
      showFeedback(result);
      // Auto-next sau 1.8s
      autoNextTimer.current = setTimeout(handleNext, 1800);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể kiểm tra đáp án');
    } finally {
      setIsChecking(false);
    }
  };

  // ── Tự luận: submit ──
  const handleSubmitEssay = async () => {
    if (!typedAnswer.trim() || checkResult || isChecking) return;
    const vocab = essayVocabs[currentIndex];
    try {
      setIsChecking(true);
      const res = await quizApi.checkAnswer(vocab.id, 'EN_TO_VI', typedAnswer.trim());
      const result = res.data;
      if (result.correct) setScore((s) => s + 1);
      showFeedback(result);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể kiểm tra đáp án');
    } finally {
      setIsChecking(false);
    }
  };

  const handleShowAnswer = async () => {
    if (checkResult || isChecking) return;
    try {
      setIsChecking(true);
      if (type === 'MULTIPLE_CHOICE') {
        const q = questions[currentIndex];
        const res = await quizApi.checkAnswer(q.vocabularyId, q.mode as any, '@@@@@');
        showFeedback(res.data);
      } else {
        const vocab = essayVocabs[currentIndex];
        const res = await quizApi.checkAnswer(vocab.id, 'EN_TO_VI', '@@@@@');
        showFeedback(res.data);
      }
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể lấy đáp án');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSkip = () => {
    if (isChecking) return;
    if (autoNextTimer.current) {
      clearTimeout(autoNextTimer.current);
    }
    handleNext();
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setTypedAnswer('');
    setCheckResult(null);
    setScore(0);
    setPhase('answering');
    feedbackAnim.setValue(0);
    if (type === 'MULTIPLE_CHOICE') {
      fetchSession();
    }
  };

  // ── Loading ──
  if (loadingSession) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Đang tạo câu hỏi...</Text>
      </View>
    );
  }

  // ── Kết quả ──
  if (phase === 'finished') {
    return (
      <ResultScreen
        score={score}
        total={totalQuestions}
        onRetry={handleRetry}
        onBack={() => navigation.goBack()}
      />
    );
  }

  // ── Render câu hỏi ──
  const currentQuestion = type === 'MULTIPLE_CHOICE' ? questions[currentIndex] : null;
  const currentEssayVocab = type === 'ESSAY' ? essayVocabs[currentIndex] : null;

  const questionText = currentQuestion
    ? currentQuestion.question
    : currentEssayVocab?.term ?? '';

  const feedbackScale = feedbackAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
            {currentIndex + 1}/{totalQuestions}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Mode badge */}
          <View style={styles.modeBadge}>
            <MaterialCommunityIcons
              name={type === 'MULTIPLE_CHOICE' ? 'checkbox-marked-circle-outline' : 'pencil-outline'}
              size={14}
              color={type === 'MULTIPLE_CHOICE' ? '#8B5CF6' : '#F59E0B'}
            />
            <Text style={[styles.modeBadgeText, type === 'ESSAY' && { color: '#F59E0B' }]}>
              {type === 'MULTIPLE_CHOICE'
                ? (currentQuestion?.mode === 'EN_TO_VI' ? 'Anh → Việt' : 'Việt → Anh')
                : 'Tự luận • Anh → Việt'}
            </Text>
          </View>

          {/* Question Card */}
          <View style={[styles.questionCard, type === 'ESSAY' && styles.questionCardEssay]}>
            <Text style={styles.questionLabel}>CÂU HỎI</Text>
            <Text style={styles.questionText}>{questionText}</Text>
            {type === 'MULTIPLE_CHOICE' && currentQuestion?.mode === 'EN_TO_VI' && (
              <Text style={styles.questionSub}>Nghĩa tiếng Việt là?</Text>
            )}
            {type === 'MULTIPLE_CHOICE' && currentQuestion?.mode === 'VI_TO_EN' && (
              <Text style={styles.questionSub}>Từ tiếng Anh là?</Text>
            )}
            {type === 'ESSAY' && (
              <Text style={styles.questionSub}>Gõ nghĩa tiếng Việt</Text>
            )}
          </View>

          {/* Options — Trắc nghiệm */}
          {type === 'MULTIPLE_CHOICE' && currentQuestion && (
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedOption === option;
                const isCorrect = checkResult && option === checkResult.correctAnswer;
                const isWrong = checkResult && isSelected && !checkResult.correct;

                return (
                  <Pressable
                    key={idx}
                    style={[
                      styles.optionBtn,
                      isSelected && !checkResult && styles.optionBtnSelected,
                      isCorrect && styles.optionBtnCorrect,
                      isWrong && styles.optionBtnWrong,
                    ]}
                    onPress={() => handleSelectOption(option)}
                    disabled={!!checkResult || isChecking}
                  >
                    <View style={styles.optionLetter}>
                      <Text style={styles.optionLetterText}>
                        {String.fromCharCode(65 + idx)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.optionText,
                        isCorrect && styles.optionTextCorrect,
                        isWrong && styles.optionTextWrong,
                      ]}
                    >
                      {option}
                    </Text>
                    {isCorrect && (
                      <MaterialCommunityIcons name="check-circle" size={22} color="#22C55E" />
                    )}
                    {isWrong && (
                      <MaterialCommunityIcons name="close-circle" size={22} color="#EF4444" />
                    )}
                  </Pressable>
                );
              })}
              
              {!checkResult && (
                <View style={[styles.actionContainer, { marginTop: 16 }]}>
                  <View style={styles.secondaryActionRow}>
                    <Pressable
                      style={[styles.secondaryBtn, isChecking && styles.secondaryBtnDisabled]}
                      onPress={handleSkip}
                      disabled={isChecking}
                    >
                      <MaterialCommunityIcons name="debug-step-over" size={18} color="#64748B" />
                      <Text style={styles.secondaryBtnText}>Bỏ qua</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.secondaryBtn, isChecking && styles.secondaryBtnDisabled]}
                      onPress={handleShowAnswer}
                      disabled={isChecking}
                    >
                      <MaterialCommunityIcons name="eye-outline" size={18} color="#64748B" />
                      <Text style={styles.secondaryBtnText}>Hiện đáp án</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Input — Tự luận */}
          {type === 'ESSAY' && (
            <View style={styles.essayContainer}>
              <TextInput
                style={[
                  styles.essayInput,
                  checkResult?.correct && styles.essayInputCorrect,
                  checkResult && !checkResult.correct && styles.essayInputWrong,
                ]}
                placeholder="Nhập nghĩa tiếng Việt..."
                value={typedAnswer}
                onChangeText={setTypedAnswer}
                editable={!checkResult && !isChecking}
                returnKeyType="done"
                onSubmitEditing={handleSubmitEssay}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {!checkResult && (
                <View style={styles.actionContainer}>
                  <View style={styles.secondaryActionRow}>
                    <Pressable
                      style={[styles.secondaryBtn, isChecking && styles.secondaryBtnDisabled]}
                      onPress={handleSkip}
                      disabled={isChecking}
                    >
                      <MaterialCommunityIcons name="debug-step-over" size={18} color="#64748B" />
                      <Text style={styles.secondaryBtnText}>Bỏ qua</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.secondaryBtn, isChecking && styles.secondaryBtnDisabled]}
                      onPress={handleShowAnswer}
                      disabled={isChecking}
                    >
                      <MaterialCommunityIcons name="eye-outline" size={18} color="#64748B" />
                      <Text style={styles.secondaryBtnText}>Hiện đáp án</Text>
                    </Pressable>
                  </View>
                  <Pressable
                    style={[styles.submitBtn, (!typedAnswer.trim() || isChecking) && styles.submitBtnDisabled]}
                    onPress={handleSubmitEssay}
                    disabled={!typedAnswer.trim() || isChecking}
                  >
                    {isChecking ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="check" size={20} color="#FFF" />
                        <Text style={styles.submitBtnText}>Kiểm tra</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {/* Feedback overlay */}
          {checkResult && (
            <Animated.View
              style={[
                styles.feedbackCard,
                checkResult.correct ? styles.feedbackCorrect : styles.feedbackWrong,
                { transform: [{ scale: feedbackScale }], opacity: feedbackAnim },
              ]}
            >
              <View style={styles.feedbackRow}>
                <MaterialCommunityIcons
                  name={checkResult.correct ? 'check-circle' : 'close-circle'}
                  size={28}
                  color={checkResult.correct ? '#22C55E' : '#EF4444'}
                />
                <Text
                  style={[
                    styles.feedbackTitle,
                    { color: checkResult.correct ? '#22C55E' : '#EF4444' },
                  ]}
                >
                  {checkResult.correct ? 'Chính xác!' : 'Sai rồi!'}
                </Text>
              </View>
              {!checkResult.correct && (
                <Text style={styles.feedbackAnswer}>
                  Đáp án đúng: <Text style={styles.feedbackAnswerBold}>{checkResult.correctAnswer}</Text>
                </Text>
              )}
              {checkResult.explanation ? (
                <Text style={styles.feedbackExample}>💬 {checkResult.explanation}</Text>
              ) : null}
              <Pressable style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>
                  {currentIndex + 1 >= totalQuestions ? 'Xem kết quả' : 'Câu tiếp →'}
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#70778C', fontSize: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F6',
  },
  closeBtn: { padding: 8 },
  progressContainer: { flex: 1, marginHorizontal: 12 },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1D26',
    width: 36,
    textAlign: 'right',
  },
  scrollContent: { padding: 20, paddingBottom: 60 },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: '#F3F0FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  modeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  questionCard: {
    backgroundColor: '#8B5CF6',
    borderRadius: 20,
    padding: 28,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  questionCardEssay: { backgroundColor: '#F59E0B' },
  questionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  questionText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  questionSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    fontStyle: 'italic',
  },
  optionsContainer: { gap: 10 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  optionBtnSelected: { borderColor: '#8B5CF6', backgroundColor: '#F3F0FF' },
  optionBtnCorrect: { borderColor: '#22C55E', backgroundColor: '#F0FDF4' },
  optionBtnWrong: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLetterText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  optionText: { flex: 1, fontSize: 16, color: '#1A1D26', fontWeight: '500' },
  optionTextCorrect: { color: '#16A34A', fontWeight: '700' },
  optionTextWrong: { color: '#DC2626', fontWeight: '700' },
  // Essay
  essayContainer: { gap: 14 },
  essayInput: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 18,
    fontSize: 18,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    color: '#1A1D26',
  },
  essayInputCorrect: { borderColor: '#22C55E', backgroundColor: '#F0FDF4' },
  essayInputWrong: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  actionContainer: { gap: 12, marginTop: 8 },
  secondaryActionRow: { flexDirection: 'row', gap: 12 },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 6,
  },
  secondaryBtnDisabled: { opacity: 0.5 },
  secondaryBtnText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  submitBtnDisabled: { backgroundColor: '#FCD34D' },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  // Feedback
  feedbackCard: {
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    gap: 10,
  },
  feedbackCorrect: { backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#BBF7D0' },
  feedbackWrong: { backgroundColor: '#FEF2F2', borderWidth: 1.5, borderColor: '#FECACA' },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  feedbackTitle: { fontSize: 20, fontWeight: '800' },
  feedbackAnswer: { fontSize: 15, color: '#374151' },
  feedbackAnswerBold: { fontWeight: '700', color: '#1A1D26' },
  feedbackExample: { fontSize: 14, color: '#6B7280', fontStyle: 'italic' },
  nextBtn: {
    backgroundColor: '#1A1D26',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

// ─── Result Styles ─────────────────────────────────────────────────────────────
const resultStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emoji: { fontSize: 72 },
  title: { fontSize: 26, fontWeight: '800', color: '#1A1D26' },
  scoreCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    gap: 4,
  },
  scoreNum: { fontSize: 56, fontWeight: '900' },
  scorePercent: { fontSize: 24, fontWeight: '700', color: '#70778C' },
  scoreLabel: { fontSize: 16, color: '#A0A7BA' },
  btn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  btnRetry: { backgroundColor: '#8B5CF6' },
  btnBack: { backgroundColor: '#F3F0FF' },
  btnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
