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
import { quizApi, FillBlankSession, FillBlankQuestion } from '../../api/quizApi';

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
  const color = percent >= 80 ? '#10B981' : percent >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <View style={resultStyles.container}>
      <Text style={resultStyles.emoji}>{emoji}</Text>
      <Text style={resultStyles.title}>Kết quả điền từ</Text>
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
        <MaterialCommunityIcons name="arrow-left" size={20} color="#10B981" />
        <Text style={[resultStyles.btnText, { color: '#10B981' }]}>Quay về bài học</Text>
      </Pressable>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function FillBlankSessionScreen({ route, navigation }: any) {
  const { lesson } = route.params as {
    lesson: { id: number; name: string };
  };
  const insets = useSafeAreaInsets();

  const [session, setSession] = useState<FillBlankSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [checkResult, setCheckResult] = useState<{ correct: boolean; correctAnswer: string; explanation?: string } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'answering' | 'finished'>('answering');
  const [showHint, setShowHint] = useState(false);

  const feedbackAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      setLoadingSession(true);
      const res = await quizApi.generateFillBlankSession(lesson.id);
      if (!res.data || !res.data.questions || res.data.questions.length === 0) {
        Alert.alert('Thông báo', 'Không thể tạo câu hỏi cho bài này. Vui lòng thử lại sau.');
        navigation.goBack();
        return;
      }
      setSession(res.data);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể tải câu hỏi');
      navigation.goBack();
    } finally {
      setLoadingSession(false);
    }
  };

  const questions: FillBlankQuestion[] = session?.questions ?? [];
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? (currentIndex + 1) / totalQuestions : 0;
  const currentQuestion = questions[currentIndex];

  const showFeedback = (result: typeof checkResult) => {
    setCheckResult(result);
    feedbackAnim.setValue(0);
    Animated.spring(feedbackAnim, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
  };

  const handleNext = () => {
    setCheckResult(null);
    setTypedAnswer('');
    setShowHint(false);
    feedbackAnim.setValue(0);

    if (currentIndex + 1 >= totalQuestions) {
      setPhase('finished');
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleSubmit = async () => {
    if (!typedAnswer.trim() || checkResult || isChecking || !currentQuestion) return;
    try {
      setIsChecking(true);
      const res = await quizApi.checkAnswer(currentQuestion.vocabularyId, 'VI_TO_EN', typedAnswer.trim());
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
    if (checkResult || isChecking || !currentQuestion) return;
    try {
      setIsChecking(true);
      // Gửi đáp án sai cố tình để lấy đáp án đúng
      const res = await quizApi.checkAnswer(currentQuestion.vocabularyId, 'VI_TO_EN', '@@@@@');
      const result = res.data;
      showFeedback(result);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể lấy đáp án');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSkip = () => {
    if (isChecking) return;
    handleNext();
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setTypedAnswer('');
    setCheckResult(null);
    setScore(0);
    setPhase('answering');
    setShowHint(false);
    feedbackAnim.setValue(0);
    fetchSession();
  };

  // ── Loading ──
  if (loadingSession) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>AI đang tạo câu hỏi...</Text>
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

  if (!currentQuestion) return null;

  const feedbackScale = feedbackAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  // Hiển thị câu hỏi có highlight ___
  const renderSentence = () => {
    const parts = currentQuestion.sentence.split('___');
    return (
      <Text style={styles.sentenceText}>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {index < parts.length - 1 && (
              <Text style={styles.blankHighlight}>___</Text>
            )}
          </React.Fragment>
        ))}
      </Text>
    );
  };

  // Hiển thị câu hỏi hoàn chỉnh ở phần feedback
  const renderCompleteSentence = () => {
    if (!checkResult) return null;
    const parts = currentQuestion.sentence.split('___');
    return (
      <Text style={styles.feedbackCompleteSentence}>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {index < parts.length - 1 && (
              <Text style={styles.correctWordHighlight}>{checkResult.correctAnswer}</Text>
            )}
          </React.Fragment>
        ))}
      </Text>
    );
  };

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
            <MaterialCommunityIcons name="robot-outline" size={16} color="#10B981" />
            <Text style={styles.modeBadgeText}>AI • Điền từ còn thiếu</Text>
          </View>

          {/* Question Card */}
          <View style={styles.questionCard}>
            <Text style={styles.questionLabel}>CÂU HỎI</Text>
            <View style={styles.sentenceContainer}>
              {renderSentence()}
            </View>
            
            {/* Hint */}
            <View style={styles.hintSection}>
              {!showHint ? (
                <Pressable style={styles.showHintBtn} onPress={() => setShowHint(true)}>
                  <MaterialCommunityIcons name="lightbulb-outline" size={20} color="#F59E0B" />
                  <Text style={styles.showHintText}>Xem gợi ý</Text>
                </Pressable>
              ) : (
                <View style={styles.hintContainer}>
                  <Text style={styles.hintLabel}>💡 Gợi ý:</Text>
                  <Text style={styles.hintText}>{currentQuestion.hint}</Text>
                  {currentQuestion.wordLength > 0 && (
                    <Text style={styles.hintLength}>({currentQuestion.wordLength} ký tự)</Text>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                checkResult?.correct && styles.inputCorrect,
                checkResult && !checkResult.correct && styles.inputWrong,
              ]}
              placeholder="Nhập từ tiếng Anh..."
              value={typedAnswer}
              onChangeText={setTypedAnswer}
              editable={!checkResult && !isChecking}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
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
                  onPress={handleSubmit}
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
                  color={checkResult.correct ? '#10B981' : '#EF4444'}
                />
                <Text
                  style={[
                    styles.feedbackTitle,
                    { color: checkResult.correct ? '#10B981' : '#EF4444' },
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
              
              <View style={styles.feedbackCompleteBox}>
                <Text style={styles.feedbackCompleteLabel}>💬 Câu hoàn chỉnh:</Text>
                {renderCompleteSentence()}
              </View>

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
    backgroundColor: '#10B981',
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
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  modeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  questionCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderTopWidth: 4,
    borderTopColor: '#10B981',
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  sentenceContainer: {
    marginBottom: 24,
  },
  sentenceText: {
    fontSize: 22,
    fontWeight: '500',
    color: '#1E293B',
    lineHeight: 34,
  },
  blankHighlight: {
    color: '#10B981',
    fontWeight: '800',
  },
  hintSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  showHintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  showHintText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
  },
  hintLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  hintText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  hintLength: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  inputContainer: { gap: 14 },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 18,
    fontSize: 18,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    color: '#1A1D26',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  inputCorrect: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  inputWrong: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
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
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  submitBtnDisabled: { backgroundColor: '#6EE7B7' },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  
  // Feedback
  feedbackCard: {
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  feedbackCorrect: { backgroundColor: '#ECFDF5', borderWidth: 1.5, borderColor: '#A7F3D0' },
  feedbackWrong: { backgroundColor: '#FEF2F2', borderWidth: 1.5, borderColor: '#FECACA' },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  feedbackTitle: { fontSize: 20, fontWeight: '800' },
  feedbackAnswer: { fontSize: 15, color: '#374151' },
  feedbackAnswerBold: { fontWeight: '700', color: '#1A1D26' },
  feedbackCompleteBox: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  feedbackCompleteLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  feedbackCompleteSentence: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  correctWordHighlight: {
    fontWeight: '800',
    color: '#1A1D26',
  },
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
  btnRetry: { backgroundColor: '#10B981' },
  btnBack: { backgroundColor: '#ECFDF5' },
  btnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
