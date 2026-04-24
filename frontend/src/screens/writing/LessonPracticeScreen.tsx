import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { Colors } from "../../constants/colors";
import { writingApi } from "../../api/writing/writingApi";
import {
  LessonResponse,
  LessonSentenceResponse,
  SuggestVocabularyResponse,
  UserLessonProgressResponse,
  GradingResponse,
} from "../../api/writing/types";
import FeedbackModal from "../../components/writing/FeedbackModal";
import RedoLessonModal from "../../components/writing/RedoLessonModal";
import { Routes } from "../../constants/routes";

type RouteParams = {
  params: {
    lessonId: number;
    lessonName: string;
  };
};

export default function LessonPracticeScreen() {
  const route = useRoute<RouteProp<RouteParams, "params">>();
  const navigation = useNavigation();
  const { lessonId, lessonName } = route.params;

  const [lesson, setLesson] = useState<LessonResponse | null>(null);
  const [progress, setProgress] = useState<UserLessonProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userInput, setUserInput] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showVocab, setShowVocab] = useState(false);

  const [isGrading, setIsGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<{
    message?: string;
    code?: number;
    data: GradingResponse;
  } | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showRedoModal, setShowRedoModal] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const paragraphScrollRef = useRef<ScrollView>(null);
  const outerScrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const vocabHeightAnim = useRef(new Animated.Value(0)).current;

  const SCREEN_HEIGHT = Dimensions.get("window").height;
  const PARAGRAPH_HEIGHT = SCREEN_HEIGHT * 0.4;

  // ── keyboard listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ── animate vocab panel ─────────────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(vocabHeightAnim, {
      toValue: showVocab ? 1 : 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [showVocab]);

  // ── scroll outer down when vocab opens so it doesn't get hidden ─────────────
  useEffect(() => {
    if (showVocab) {
      // Small delay to let animation start before scrolling
      setTimeout(() => {
        outerScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [showVocab]);

  // ── fade-in on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // ── data fetch ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [lessonData, progressData] = await Promise.all([
        writingApi.getLessonDetails(lessonId),
        writingApi.getLessonProgress(lessonId),
      ]);
      const sorted = {
        ...lessonData,
        sentences: [...lessonData.sentences].sort((a, b) => a.orderIndex - b.orderIndex),
      };
      setLesson(sorted);
      setProgress(progressData);
    } catch (e) {
      console.error("Failed to load lesson:", e);
      setError("Failed to load lesson. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── handle submit ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!userInput.trim() || !currentSentence) return;

    try {
      setIsGrading(true);
      Keyboard.dismiss();

      const request = {
        question: currentSentence.sentenceVi,
        answer: userInput,
        suggestVocabularies: currentVocab.map((v) => v.term),
        sentenceId: currentSentence.id,
      };

      const result = await writingApi.gradeAnswer(request);
      setGradingResult({
        message: "Answer graded successfully",
        code: 200,
        data: result,
      });
      setShowResultModal(true);
    } catch (e) {
      console.error("Failed to grade answer:", e);
    } finally {
      setIsGrading(false);
    }
  };

  const handleNext = async () => {
    try {
      const newOrderIndex = progress ? progress.currentOrderIndex + 1 : 1;
      await writingApi.updateLessonProgress(lessonId, newOrderIndex);
      setShowResultModal(false);
      setUserInput("");
      if (progress && lesson) {
        setProgress({ ...progress, currentOrderIndex: newOrderIndex });
      }
    } catch (e) {
      console.error("Failed to update lesson progress:", e);
    }
  };

  const handleRedo = async () => {
    try {
      await writingApi.updateLessonProgress(lessonId, 1);
      setShowRedoModal(false);
      setProgress(prev => prev ? { ...prev, currentOrderIndex: 1 } : null);
      setUserInput("");
    } catch (e) {
      console.error("Failed to redo lesson:", e);
    }
  };

  const handleCancelRedo = () => {
     setShowRedoModal(false);
     navigation.goBack();
   };

  // ── derived values ──────────────────────────────────────────────────────────
  const currentOrderIndex = progress?.currentOrderIndex ?? 1;
  const totalSentences = lesson?.totalSentences ?? 0;
  const progressPercent = totalSentences > 0 ? (currentOrderIndex - 1) / totalSentences : 0;

  const currentSentence: LessonSentenceResponse | undefined = lesson?.sentences.find(
    (s) => s.orderIndex === currentOrderIndex,
  );

  const currentVocab: SuggestVocabularyResponse[] = currentSentence?.suggestVocabularies ?? [];

  useEffect(() => {
    if (lesson && progress && progress.currentOrderIndex > lesson.totalSentences) {
      setShowRedoModal(true);
    }
  }, [lesson, progress]);

  // ── loading / error ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading lesson...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !lesson) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
          <Text style={styles.errorText}>{error ?? "Something went wrong"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={20} color="#0066FF" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {lesson.name}
              </Text>
            </View>

            <View style={{ width: 40 }} />
          </View>

          {/* ── Progress bar ─────────────────────────────────────────────────── */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercent * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {currentOrderIndex - 1}/{totalSentences}
            </Text>
          </View>

          {/* ── Outer ScrollView: scroll paragraph + vocab as one unit ──────── */}
          {/*
            KEY FIXES:
            1. nestedScrollEnabled={true}  → allows Android to disambiguate inner vs outer scroll
            2. keyboardShouldPersistTaps="handled" → taps inside don't dismiss keyboard unless unhandled
            3. NO TouchableWithoutFeedback wrapper → was consuming touch events and breaking scroll gesture
          */}
          <ScrollView
            ref={outerScrollRef}
            style={styles.outerScroll}
            contentContainerStyle={styles.outerScrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={Keyboard.dismiss}
          >
            {/* ── Paragraph: fixed height, inner scroll ─────────────────────── */}
            {/*
              height is fixed to PARAGRAPH_HEIGHT — inner ScrollView handles overflow.
              nestedScrollEnabled={true} tells Android this inner scroll is independent.
              On iOS, nested scrolls work by default via the responder system.
            */}
            <View style={[styles.paragraphWrapper, { height: PARAGRAPH_HEIGHT }]}>
              <ScrollView
                ref={paragraphScrollRef}
                style={styles.paragraphScroll}
                contentContainerStyle={styles.paragraphContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                // Prevent outer scroll from stealing the gesture while user is
                // actively scrolling inside the paragraph box
                scrollEventThrottle={16}
              >
                <Text style={styles.paragraphText}>
                  {lesson.sentences.map((sentence, idx) => {
                    const isHighlighted = sentence.orderIndex === currentOrderIndex;
                    const cleanedSentence = sentence.sentenceVi.replace(/\.\s*$/, "");
                    return (
                      <Text key={sentence.id}>
                        <Text
                          style={[
                            styles.sentenceText,
                            isHighlighted && styles.sentenceHighlighted,
                          ]}
                        >
                          {cleanedSentence}
                        </Text>
                        {idx < lesson.sentences.length - 1 ? (
                          <Text style={styles.sentenceDot}>. </Text>
                        ) : (
                          <Text style={styles.sentenceDot}>.</Text>
                        )}
                      </Text>
                    );
                  })}
                </Text>
              </ScrollView>
            </View>

            {/* ── Vocab panel: animated height, no scroll needed (outer handles it) */}
            <Animated.View
              style={[
                styles.vocabPanel,
                {
                  maxHeight: vocabHeightAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 2000],
                  }),
                  opacity: vocabHeightAnim,
                  borderWidth: vocabHeightAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                    extrapolate: "clamp",
                  }),
                  marginBottom: vocabHeightAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 8],
                    extrapolate: "clamp",
                  }),
                },
              ]}
            >
              <Text style={styles.vocabPanelTitle}>💡 Gợi ý từ vựng</Text>
              {currentVocab.length > 0 ? (
                <View style={styles.vocabList}>
                  {currentVocab.map((item) => (
                    <View key={item.id} style={styles.vocabItem}>
                      <View style={styles.vocabItemHeader}>
                        <Text style={styles.vocabTerm}>{item.term}</Text>
                        {item.type ? (
                          <View style={styles.vocabTypeBadge}>
                            <Text style={styles.vocabTypeText}>{item.type}</Text>
                          </View>
                        ) : null}
                      </View>
                      {item.pronunciation ? (
                        <Text style={styles.vocabPronunciation}>
                          /{item.pronunciation}/
                        </Text>
                      ) : null}
                      <Text style={styles.vocabVietnamese}>{item.vietnamese}</Text>
                      {item.example ? (
                        <Text style={styles.vocabExample} numberOfLines={2}>
                          {item.example}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyVocabContainer}>
                  <Text style={styles.emptyVocabText}>
                    Hiện tại không có gợi ý từ vựng cho câu này
                  </Text>
                </View>
              )}
            </Animated.View>
          </ScrollView>

          {/* ── Bottom toolbar ─────────────────────────────────────────────────── */}
          <View style={styles.bottomBarWrapper}>
            <View style={styles.bottomBar}>
              <View style={styles.bottomRow}>
                <View style={styles.inputRow}>
                  <TextInput
                    ref={inputRef}
                    style={styles.textInput}
                    placeholder="Nhập câu dịch của bạn..."
                    placeholderTextColor="#5A5A7A"
                    value={userInput}
                    onChangeText={setUserInput}
                    multiline
                    returnKeyType="done"
                    textAlignVertical="center"
                  />
                  <TouchableOpacity
                    style={[
                      styles.vocabToggleButton,
                      showVocab && styles.vocabToggleActive,
                    ]}
                    onPress={() => setShowVocab((prev) => !prev)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={showVocab ? "book" : "book-outline"}
                      size={18}
                      color={showVocab ? "#FFFFFF" : "#0066FF"}
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    userInput.trim().length > 0 && !isGrading
                      ? styles.submitButtonActive
                      : styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={userInput.trim().length === 0 || isGrading}
                  activeOpacity={0.8}
                >
                  {isGrading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

        </Animated.View>
      </KeyboardAvoidingView>

      {/* ── Grading Result Modal ─────────────────────────────────────────────── */}
      <FeedbackModal
        visible={showResultModal}
        onClose={() => setShowResultModal(false)}
        onNext={handleNext}
        feedbackData={gradingResult}
      />

      <RedoLessonModal
        visible={showRedoModal}
        onRedo={handleRedo}
        onCancel={handleCancelRedo}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffffff",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 32,
  },
  loadingText: {
    color: "#A0A0BC",
    fontSize: 16,
    marginTop: 12,
  },
  errorText: {
    color: "#F44336",
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#0066FF",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EBF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1D26",
  },

  // ── Progress bar ──────────────────────────────────────────────────────────
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#E8EFFF",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#0066FF",
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0066FF",
    minWidth: 36,
    textAlign: "right",
  },

  // ── Outer scroll ──────────────────────────────────────────────────────────
  outerScroll: {
    flex: 1,
  },
  outerScrollContent: {
    paddingBottom: 16,
  },

  // ── Paragraph ─────────────────────────────────────────────────────────────
  paragraphWrapper: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0EAFF",
    overflow: "hidden",
    // height is set inline from PARAGRAPH_HEIGHT
  },
  paragraphScroll: {
    flex: 1,
  },
  paragraphContent: {
    padding: 16,
    paddingBottom: 24,
  },
  paragraphText: {
    lineHeight: 26,
  },
  sentenceText: {
    fontSize: 15,
    color: "#9BA3B8",
    lineHeight: 26,
  },
  sentenceHighlighted: {
    color: "#0066FF",
    fontWeight: "700",
  },
  sentenceDot: {
    fontSize: 15,
    color: "#9BA3B8",
  },

  // ── Vocabulary panel ──────────────────────────────────────────────────────
  vocabPanel: {
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderColor: "#E0EAFF",
    overflow: "hidden",
    flexDirection: "column",
  },
  vocabPanelTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0066FF",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0EAFF",
    letterSpacing: 0.3,
  },
  vocabList: {
    width: "100%",
  },
  vocabItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4FF",
  },
  vocabItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  vocabTerm: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0066FF",
  },
  vocabTypeBadge: {
    backgroundColor: "#EBF2FF",
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  vocabTypeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#0066FF",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  vocabPronunciation: {
    fontSize: 12,
    color: "#7A8299",
    fontStyle: "italic",
    marginBottom: 2,
  },
  vocabVietnamese: {
    fontSize: 13,
    color: "#3D4565",
    marginBottom: 2,
    fontWeight: "500",
  },
  vocabExample: {
    fontSize: 12,
    color: "#9BA3B8",
    fontStyle: "italic",
    lineHeight: 18,
  },
  emptyVocabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyVocabText: {
    fontSize: 13,
    color: "#9BA3B8",
    textAlign: "center",
  },

  // ── Bottom bar ────────────────────────────────────────────────────────────
  bottomBarWrapper: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0EAFF",
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  inputRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0EAFF",
    minHeight: 52,
  },
  textInput: {
    flex: 1,
    color: "#1A1D26",
    fontSize: 15,
    maxHeight: 100,
    textAlignVertical: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  vocabToggleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0EAFF",
    backgroundColor: "#F8FAFF",
  },
  vocabToggleActive: {
    backgroundColor: "#0066FF",
    borderColor: "#0066FF",
  },
  submitButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonActive: {
    backgroundColor: "#0066FF",
  },
  submitButtonDisabled: {
    backgroundColor: "#D0DCFF",
  },
});
