import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Svg, { Circle } from "react-native-svg";
import { Colors } from "../../constants/colors";
import { Routes } from "../../constants/routes";
import { writingApi } from "../../api/writing/writingApi";
import { 
  UserLessonProgressResponse, 
  UserTranslationHistoryResponse 
} from "../../api/writing/types";
import FeedbackModal from "../../components/writing/FeedbackModal";

export default function WritingScreen() {
  const [lessons, setLessons] = useState<UserLessonProgressResponse[]>([]);
  const [history, setHistory] = useState<UserTranslationHistoryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<UserTranslationHistoryResponse | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  const navigation = useNavigation<any>();

  const fetchData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const [lessonsPage, historyPage] = await Promise.all([
        writingApi.getMyLessons({ page: 0, size: 10 }),
        writingApi.getTranslationHistory({ page: 0, size: 10 }),
      ]);
      setLessons(lessonsPage?.content || []);
      setHistory(historyPage?.content || []);
    } catch (error) {
      console.error("Failed to fetch writing data:", error);
      setLessons([]);
      setHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(true);
  }, []);

  const handleHistoryPress = (item: UserTranslationHistoryResponse) => {
    setSelectedHistory(item);
    setShowFeedbackModal(true);
  };

  const renderAccuracyCircle = (score: number) => {
    const size = 40;
    const strokeWidth = 3;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    
    const getColor = (s: number) => {
      if (s >= 90) return '#059669'; // Excellent
      if (s >= 70) return '#D97706'; // Good
      if (s >= 50) return '#EA580C'; // Fair
      return '#DC2626';             // Needs Improvement
    };

    return (
      <View style={styles.historyAccuracyWrapper}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getColor(score)}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.historyAccuracyTextOverlay}>
          <Text style={[styles.historyAccuracyText, { color: getColor(score) }]}>
            {score}%
          </Text>
        </View>
      </View>
    );
  };

  const getFeedbackData = () => {
    if (!selectedHistory || !selectedHistory.aiFeedbackJson) return null;
    try {
      return {
        data: JSON.parse(selectedHistory.aiFeedbackJson)
      };
    } catch (e) {
      return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#0066FF"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Writing</Text>
          <Text style={styles.headerSubtitle}>
            Cải thiện kỹ năng viết tiếng Anh.
          </Text>
        </View>

        {/* Section 1: Topic Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Chọn chủ đề</Text>
          </View>
          <TouchableOpacity 
            style={styles.topicButtonLarge}
            onPress={() => navigation.navigate(Routes.SELECT_TOPIC)}
          >
            <View style={styles.topicButtonContent}>
              <View style={styles.topicIconContainer}>
                <Ionicons name="grid-outline" size={24} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.topicButtonTitle}>Chọn chủ đề</Text>
                <Text style={styles.topicButtonSub}>Xem các bài học theo các chủ đề khác</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#0066FF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Section 2: Currently Learning */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tiếp tục các bài học</Text>
            {lessons.length > 0 && (
              <TouchableOpacity 
                style={styles.seeMoreButton}
                onPress={() => navigation.navigate(Routes.WRITING_ACTIVE_LESSONS)}
              >
                <Text style={styles.seeMoreText}>Xem tất cả</Text>
                <Ionicons name="chevron-forward" size={14} color="#0066FF" />
              </TouchableOpacity>
            )}
          </View>
          {lessons.length > 0 ? (
            lessons.map((item) => {
              const progress = item.totalSentences > 0 
                ? (item.currentOrderIndex - 1) / item.totalSentences 
                : 0;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.lessonCard}
                  activeOpacity={0.8}
                  onPress={() => {
                    navigation.navigate(Routes.LESSON_PRACTICE, { 
                      lessonId: item.lessonWritingId,
                      lessonName: item.lessonName 
                    });
                  }}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="book" size={24} color="#0066FF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.cardContent}>
                        <Text style={styles.lessonName} numberOfLines={1}>
                          {item.lessonName}
                        </Text>
                        <Text style={styles.lessonDesc} numberOfLines={1}>
                          {item.lessonDescription || "No description available."}
                        </Text>
                      </View>
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                          <View 
                            style={[
                              styles.progressFill, 
                              { width: `${Math.min(progress * 100, 100)}%` }
                            ]} 
                          />
                        </View>
                        <Text style={styles.progressText}>
                          {(item.currentOrderIndex - 1)}/{item.totalSentences}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#5A5A7A" />
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptySmall}>
              <Text style={styles.emptyText}>No active lessons. Start one above!</Text>
            </View>
          )}
        </View>

        {/* Section 3: History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lịch sử học</Text>
            {history.length > 0 && (
              <TouchableOpacity 
                style={styles.seeMoreButton}
                onPress={() => navigation.navigate(Routes.WRITING_HISTORY)}
              >
                <Text style={styles.seeMoreText}>Xem tất cả</Text>
                <Ionicons name="chevron-forward" size={14} color="#0066FF" />
              </TouchableOpacity>
            )}
          </View>
          {history.length > 0 ? (
            history.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.historyCard}
                onPress={() => handleHistoryPress(item)}
              >
                <View style={styles.historyCardContent}>
                  {renderAccuracyCircle(item.accuracyScore)}
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyVi} numberOfLines={1}>
                      {item.sentenceVi}
                    </Text>
                    <Text style={styles.historyAnswer} numberOfLines={1}>
                      {item.userAnswer}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#A0A0BC" />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptySmall}>
              <Text style={styles.emptyText}>No history yet. Complete a lesson to see it here.</Text>
            </View>
          )}
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      <FeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        mode="history"
        originalText={selectedHistory?.sentenceVi}
        feedbackData={getFeedbackData()}
      />

      {loading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0066FF" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1A1D26",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#A0A0BC",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1D26',
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeMoreText: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '600',
    marginRight: 2,
  },
  topicButtonLarge: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 255, 0.1)',
  },
  topicButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  topicButtonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1D26',
  },
  topicButtonSub: {
    fontSize: 14,
    color: '#A0A0BC',
    marginTop: 2,
  },
  lessonCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(0, 102, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardContent: {
    marginBottom: 8,
  },
  lessonName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1A1D26",
    marginBottom: 2,
  },
  lessonDesc: {
    fontSize: 13,
    color: "#A0A0BC",
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#F0F0F7',
    borderRadius: 2,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0066FF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#5A5A7A',
    fontWeight: '600',
    minWidth: 30,
  },
  historyCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F7',
  },
  historyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  historyVi: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1D26',
    marginBottom: 2,
  },
  historyAnswer: {
    fontSize: 13,
    color: '#5A5A7A',
    fontStyle: 'italic',
  },
  historyAccuracyWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyAccuracyTextOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyAccuracyText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptySmall: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  emptyText: {
    color: '#A0A0BC',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});
