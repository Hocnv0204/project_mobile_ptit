import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Animated,
  FlatList,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
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
  const [progress, setProgress] = useState<UserLessonProgressResponse | null>(
    null,
  );
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

  const paragraphScrollRef = useRef<ScrollView>(null);
  const highlightedSentenceRefs = useRef<{ [key: number]: number }>({});
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ── keyboard listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setIsKeyboardVisible(true);
      setShowVocab(false);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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
        sentences: [...lessonData.sentences].sort(
          (a, b) => a.orderIndex - b.orderIndex,
        ),
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

  // ── handle submit ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!userInput.trim() || !currentSentence) return;

    try {
      setIsGrading(true);
      Keyboard.dismiss();

      const request = {
        question: currentSentence.sentenceVi,
        answer: userInput,
        suggestVocabularies: currentVocab.map((v) => v.term),
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
      // You might want to show an error toast here
    } finally {
      setIsGrading(false);
    }
  };

  const handleNext = () => {
    setShowResultModal(false);
    setUserInput("");
    if (progress && lesson && progress.currentOrderIndex < lesson.totalSentences) {
      setProgress({
        ...progress,
        currentOrderIndex: progress.currentOrderIndex + 1,
      });
    }
  };

  // ── derived values ──────────────────────────────────────────────────────────
  const currentOrderIndex = progress?.currentOrderIndex ?? 1;
  const totalSentences = lesson?.totalSentences ?? 0;
  const progressPercent =
    totalSentences > 0 ? (currentOrderIndex - 1) / totalSentences : 0;

  const currentSentence: LessonSentenceResponse | undefined =
    lesson?.sentences.find((s) => s.orderIndex === currentOrderIndex);

  const currentVocab: SuggestVocabularyResponse[] =
    currentSentence?.suggestVocabularies ?? [];

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
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={Colors.error}
          />
          <Text style={styles.errorText}>
            {error ?? "Something went wrong"}
          </Text>
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
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
              {/* ── Header ──────────────────────────────────────────────────────── */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons name="arrow-back" size={22} color="#1A1D26" />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    {lesson.name}
                  </Text>
                  <View style={styles.progressRow}>
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
                </View>

                <View style={{ width: 40 }} />
              </View>

              {/* ── Main content ─────────────────────────────────────────────────── */}
              {isKeyboardVisible ? (
                // When keyboard is open: show only the highlighted sentence above input
                <View style={styles.focusedSentenceContainer}>
                  <View style={styles.focusedSentenceCard}>
                    <Text style={styles.focusedSentenceLabel}>
                      Current sentence
                    </Text>
                    <Text style={styles.focusedSentenceText}>
                      {currentSentence?.sentenceVi?.replace(/\.\s*$/, "") ?? ""}
                    </Text>
                  </View>
                </View>
              ) : (
                // Normal mode: show full paragraph (takes ~half the screen)
                <View style={styles.paragraphWrapper}>
                  <ScrollView
                    ref={paragraphScrollRef}
                    style={styles.paragraphScroll}
                    contentContainerStyle={styles.paragraphContent}
                    showsVerticalScrollIndicator={true}
                  >
                    <Text style={styles.paragraphText}>
                      {lesson.sentences.map((sentence, idx) => {
                        const isHighlighted =
                          sentence.orderIndex === currentOrderIndex;
                        // Remove trailing dots from sentence to avoid double dots
                        const cleanedSentence = sentence.sentenceVi.replace(
                          /\.\s*$/,
                          "",
                        );
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
              )}

              {/* ── Vocabulary suggestions panel ─────────────────────────────────── */}
              {showVocab && !isKeyboardVisible && (
                <View style={styles.vocabPanel}>
                  <Text style={styles.vocabPanelTitle}>💡 Gợi ý từ vựng</Text>
                  {currentVocab.length > 0 ? (
                    <FlatList
                      data={currentVocab}
                      keyExtractor={(item) => item.id.toString()}
                      style={styles.vocabList}
                      showsVerticalScrollIndicator={true}
                      renderItem={({ item }) => (
                        <View style={styles.vocabItem}>
                          <View style={styles.vocabItemHeader}>
                            <Text style={styles.vocabTerm}>{item.term}</Text>
                            {item.type ? (
                              <View style={styles.vocabTypeBadge}>
                                <Text style={styles.vocabTypeText}>
                                  {item.type}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                          {item.pronunciation ? (
                            <Text style={styles.vocabPronunciation}>
                              /{item.pronunciation}/
                            </Text>
                          ) : null}
                          <Text style={styles.vocabVietnamese}>
                            {item.vietnamese}
                          </Text>
                          {item.example ? (
                            <Text style={styles.vocabExample} numberOfLines={2}>
                              {item.example}
                            </Text>
                          ) : null}
                        </View>
                      )}
                    />
                  ) : (
                    <View style={styles.emptyVocabContainer}>
                      <Text style={styles.emptyVocabText}>
                        Hiện tại không có gợi ý từ vựng cho câu này
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Spacer to push bottomBar to bottom when keyboard is hidden */}
              {!isKeyboardVisible && <View style={{ flex: 1 }} />}

              {/* ── Bottom toolbar ───────────────────────────────────────────────── */}
              <View style={[isKeyboardVisible && styles.bottomBarCentered]}>
                <View style={styles.bottomBar}>
                  <View style={styles.bottomRow}>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Nhập câu dịch của bạn..."
                        placeholderTextColor="#5A5A7A"
                        value={userInput}
                        onChangeText={setUserInput}
                        multiline
                        returnKeyType="done"
                      />
                      <TouchableOpacity
                        style={[
                          styles.vocabToggleButton,
                          showVocab && styles.vocabToggleActive,
                        ]}
                        onPress={() => {
                          Keyboard.dismiss();
                          setShowVocab((prev) => !prev);
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={showVocab ? "book" : "book-outline"}
                          size={18}
                          color={showVocab ? "#FFFFFF" : "#4ECDC4"}
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
                        <Ionicons
                          name="arrow-forward"
                          size={20}
                          color="#FFFFFF"
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>

        {/* ── Grading Result Modal ────────────────────────────────────────── */}
        <FeedbackModal
          visible={showResultModal}
          onClose={() => setShowResultModal(false)}
          onNext={handleNext}
          feedbackData={gradingResult}
        />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ccccccff",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA", // Đảm bảo lớp bên trong cũng cùng màu
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
    backgroundColor: "#6C63FF",
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
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A45",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
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
    marginBottom: 6,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#252540",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6C63FF",
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#A0A0BC",
    minWidth: 36,
    textAlign: "right",
  },

  // ── Paragraph (full) ──────────────────────────────────────────────────────
  paragraphWrapper: {
    flex: 1,
    maxHeight: "50%",
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2A45",
    overflow: "hidden",
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
    fontSize: 16,
    color: "#A0A0BC",
    lineHeight: 26,
  },
  sentenceHighlighted: {
    color: "#1A1D26",
    fontWeight: "700",
    backgroundColor: "rgba(108, 99, 255, 0.18)",
    borderRadius: 4,
  },
  sentenceDot: {
    fontSize: 16,
    color: "#5A5A7A",
  },

  // ── Focused sentence (keyboard open) ─────────────────────────────────────
  focusedSentenceContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  focusedSentenceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  focusedSentenceLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6C63FF",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  focusedSentenceText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1D26",
    lineHeight: 28,
  },

  // ── Vocabulary panel ──────────────────────────────────────────────────────
  vocabPanel: {
    height: 240,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
    flexDirection: "column",
  },
  vocabPanelTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1D26",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  vocabList: {
    flex: 1,
  },
  vocabItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  vocabItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  vocabTerm: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4ECDC4",
  },
  vocabTypeBadge: {
    backgroundColor: "rgba(78, 205, 196, 0.15)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  vocabTypeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#4ECDC4",
    textTransform: "uppercase",
  },
  vocabPronunciation: {
    fontSize: 12,
    color: "#5A5A7A",
    fontStyle: "italic",
    marginBottom: 2,
  },
  vocabVietnamese: {
    fontSize: 13,
    color: "#A0A0BC",
    marginBottom: 2,
  },
  vocabExample: {
    fontSize: 12,
    color: "#5A5A7A",
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
    fontSize: 14,
    color: "#A0A0BC",
    textAlign: "center",
  },

  // ── Bottom bar ────────────────────────────────────────────────────────────
  bottomBarCentered: {
    flex: 1,
    justifyContent: "center",
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 52,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  textInput: {
    flex: 1,
    color: "#1A1D26",
    fontSize: 15,
    maxHeight: 100,
    textAlignVertical: "top",
  },
  vocabToggleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  vocabToggleActive: {
    backgroundColor: "#4ECDC4",
  },
  submitButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonActive: {
    backgroundColor: "#2563EB",
  },
  submitButtonDisabled: {
    backgroundColor: "#C0C0D0",
  },
});
