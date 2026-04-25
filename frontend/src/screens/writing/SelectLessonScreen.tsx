import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { Colors } from "../../constants/colors";
import { Routes } from "../../constants/routes";
import { writingApi } from "../../api/writing/writingApi";
import { LessonSummaryResponse, UserLessonProgressResponse } from "../../api/writing/types";
import { useAuthStore } from "../../store/authStore";

type RouteParams = {
  params: {
    topicId: number;
  };
};

export default function SelectLessonScreen() {
  const route = useRoute<RouteProp<RouteParams, "params">>();
  const navigation = useNavigation<any>();
  const topicId = route.params?.topicId;
  const user = useAuthStore((state) => state.user);
  const levelId = user?.levelId;

  const [lessons, setLessons] = useState<LessonSummaryResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [progressMap, setProgressMap] = useState<Record<number, UserLessonProgressResponse>>({});

  // Debounce search term
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchProgress = async (lessonIds: number[]) => {
    if (lessonIds.length === 0) return;
    try {
      const progresses = await writingApi.getBulkLessonProgress(lessonIds);
      const newMap = { ...progressMap };
      progresses.forEach((p) => {
        newMap[p.lessonWritingId] = p;
      });
      setProgressMap(newMap);
    } catch (error) {
      console.error("Failed to fetch bulk progress:", error);
    }
  };

  const fetchLessons = async (
    pageNumber: number,
    search: string,
    isRefresh = false,
  ) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await writingApi.getLessons({
        page: pageNumber,
        size: 10,
        topicId: topicId,
        levelId: levelId ?? undefined,
        searchTerm: search || undefined,
        sortBy: "createdAt",
        sortDir: "DESC",
      });

      if (isRefresh || pageNumber === 0) {
        setLessons(data.content);
      } else {
        setLessons((prev) => [...prev, ...data.content]);
      }

      setHasMore(!data.last);

      // Fetch progress for these lessons
      if (data.content.length > 0) {
        fetchProgress(data.content.map((l) => l.id));
      }
    } catch (error) {
      console.error("Failed to fetch lessons:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (topicId) {
      setPage(0);
      fetchLessons(0, debouncedSearch);
    }
  }, [debouncedSearch, topicId, levelId]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(0);
    fetchLessons(0, debouncedSearch, true);
  }, [debouncedSearch, topicId, levelId]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchLessons(nextPage, debouncedSearch);
    }
  };

  const renderItem = ({ item }: { item: LessonSummaryResponse }) => {
    const progress = progressMap[item.id];
    const progressValue =
      progress && progress.totalSentences > 0
        ? (progress.currentOrderIndex - 1) / progress.totalSentences
        : 0;
    const currentCount = progress ? progress.currentOrderIndex - 1 : 0;
    const totalCount = progress ? progress.totalSentences : 0;

    return (
      <TouchableOpacity
        style={styles.lessonCard}
        activeOpacity={0.8}
        onPress={() => {
          navigation.navigate(Routes.LESSON_PRACTICE, {
            lessonId: item.id,
            lessonName: item.name,
          });
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="create" size={24} color="#0066FF" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.lessonName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.lessonDesc} numberOfLines={2}>
              {item.description || "No description available for this lesson."}
            </Text>

            {progress && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(progressValue * 100, 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {currentCount}/{totalCount}
                </Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color="#5A5A7A" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="#1A1D26" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Chọn bài học</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Chọn bài học để tập luyện kỹ năng viết
            </Text>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#A0A0BC"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm..."
              placeholderTextColor="#5A5A7A"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchTerm("")}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#A0A0BC" />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={lessons}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#6C63FF"
                colors={["#6C63FF"]}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="reader-outline" size={64} color="#252540" />
                  <Text style={styles.emptyTitle}>No lessons found</Text>
                  <Text style={styles.emptySubtitle}>
                    Try adjusting your search
                  </Text>
                </View>
              ) : null
            }
            ListFooterComponent={
              loading && !refreshing ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#6C63FF" />
                </View>
              ) : null
            }
          />
        </View>
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
    paddingHorizontal: 20,
    backgroundColor: "#F8F9FA",
  },
  header: {
    marginTop: 10,
    marginBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1D26",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#A0A0BC",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2, // Dành riêng cho Android
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#1A1D26",
    fontSize: 16,
    height: "100%",
  },
  clearButton: {
    padding: 4,
  },
  listContainer: {
    paddingBottom: 20,
  },
  lessonCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16, // Bo góc tròn cho card
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2, // Dành riêng cho Android
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
    flex: 1,
  },
  lessonName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1D26",
    marginBottom: 4,
  },
  lessonDesc: {
    fontSize: 14,
    color: "#A0A0BC",
    lineHeight: 20,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
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
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1D26",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#A0A0BC",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
