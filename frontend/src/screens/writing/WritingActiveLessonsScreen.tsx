import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { writingApi } from "../../api/writing/writingApi";
import { UserLessonProgressResponse } from "../../api/writing/types";
import { Routes } from "../../constants/routes";

const PAGE_SIZE = 10;

export default function WritingActiveLessonsScreen() {
  const navigation = useNavigation<any>();
  const [lessons, setLessons] = useState<UserLessonProgressResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchLessons = async (pageToFetch: number, isRefresh = false) => {
    if (loading || (loadingMore && !isRefresh) || (!hasMore && !isRefresh)) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageToFetch === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await writingApi.getMyLessons({
        page: pageToFetch,
        size: PAGE_SIZE,
      });

      if (isRefresh) {
        setLessons(response?.content || []);
      } else {
        setLessons(prev => [...prev, ...(response?.content || [])]);
      }

      setPage(pageToFetch);
      setHasMore(response ? !response.last : false);
    } catch (error) {
      console.error("Failed to fetch active lessons:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLessons(0);
  }, []);

  const handleRefresh = () => {
    fetchLessons(0, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      fetchLessons(page + 1);
    }
  };

  const renderItem = ({ item }: { item: UserLessonProgressResponse }) => {
    const progress = item.totalSentences > 0 
      ? (item.currentOrderIndex - 1) / item.totalSentences 
      : 0;
      
    return (
      <TouchableOpacity
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1D26" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bài học đang học</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && lessons.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
        </View>
      ) : (
        <FlatList
          data={lessons}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
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
                <Text style={styles.emptyText}>Chưa có bài học nào đang học.</Text>
              </View>
            )
          )}
        />
      )}
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
  listContent: {
    padding: 16,
    paddingBottom: 32,
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
