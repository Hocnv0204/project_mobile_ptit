import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SectionList,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Svg, { Circle } from "react-native-svg";
import { writingApi } from "../../api/writing/writingApi";
import { UserTranslationHistoryResponse } from "../../api/writing/types";
import FeedbackModal from "../../components/writing/FeedbackModal";

const PAGE_SIZE = 10;

export default function WritingHistoryScreen() {
  const navigation = useNavigation();
  const [history, setHistory] = useState<UserTranslationHistoryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedHistory, setSelectedHistory] = useState<UserTranslationHistoryResponse | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const fetchHistory = async (pageToFetch: number, isRefresh = false) => {
    if (loading || (loadingMore && !isRefresh) || (!hasMore && !isRefresh)) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageToFetch === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await writingApi.getTranslationHistory({
        page: pageToFetch,
        size: PAGE_SIZE,
      });

      if (isRefresh) {
        setHistory(response?.content || []);
      } else {
        setHistory(prev => [...prev, ...(response?.content || [])]);
      }

      setPage(pageToFetch);
      setHasMore(response ? !response.last : false);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory(0);
  }, []);

  const handleRefresh = () => {
    fetchHistory(0, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      fetchHistory(page + 1);
    }
  };

  const handleHistoryPress = (item: UserTranslationHistoryResponse) => {
    setSelectedHistory(item);
    setShowFeedbackModal(true);
  };

  const groupHistoryByDate = (data: UserTranslationHistoryResponse[]) => {
    const sections: { title: string; data: UserTranslationHistoryResponse[] }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    data.forEach(item => {
      const itemDate = new Date(item.createdAt);
      itemDate.setHours(0, 0, 0, 0);

      let title = "";
      if (itemDate.getTime() === today.getTime()) {
        title = "Hôm nay";
      } else if (itemDate.getTime() === yesterday.getTime()) {
        title = "Hôm qua";
      } else {
        const month = itemDate.getMonth() + 1;
        const year = itemDate.getFullYear();
        const currentYear = today.getFullYear();
        title = year === currentYear ? `Tháng ${month}` : `Tháng ${month}, ${year}`;
      }

      const existingSection = sections.find(s => s.title === title);
      if (existingSection) {
        existingSection.data.push(item);
      } else {
        sections.push({ title, data: [item] });
      }
    });

    return sections;
  };

  const sections = useMemo(() => groupHistoryByDate(history), [history]);

  const renderAccuracyCircle = (score: number) => {
    const size = 40;
    const strokeWidth = 3;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    
    const getColor = (s: number) => {
      if (s >= 90) return '#059669';
      if (s >= 70) return '#D97706';
      if (s >= 50) return '#EA580C';
      return '#DC2626';
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

  const renderItem = ({ item }: { item: UserTranslationHistoryResponse }) => (
    <TouchableOpacity
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
  );

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1D26" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử làm bài writing</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && history.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
        </View>
      ) : (
        <SectionList
          sections={sections}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0066FF" />
          }
          ListFooterComponent={() => (
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#0066FF" />
              </View>
            ) : null
          )}
          ListEmptyComponent={() => (
            !loading && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Chưa có lịch sử học.</Text>
              </View>
            )
          )}
        />
      )}

      <FeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        mode="history"
        originalText={selectedHistory?.sentenceVi}
        feedbackData={getFeedbackData()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F7',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1D26",
  },
  sectionHeader: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 8,
    marginBottom: 8,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5A5A7A',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  historyCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#A0A0BC',
    fontSize: 16,
  },
});
