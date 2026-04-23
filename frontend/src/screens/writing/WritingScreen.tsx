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
import { useNavigation } from "@react-navigation/native";
import { Colors } from "../../constants/colors";
import { Routes } from "../../constants/routes";
import { topicApi } from "../../api/topic/topicApi";
import { TopicResponse } from "../../api/topic/types";
import { useAppColors } from "../../theme/useAppColors";

export default function WritingScreen() {
  const [topics, setTopics] = useState<TopicResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Debounce search term
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { background, surface, text, mutedText, border, primary } = useAppColors();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchTopics = async (
    pageNumber: number,
    search: string,
    isRefresh = false,
  ) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await topicApi.getTopics({
        page: pageNumber,
        size: 10,
        searchTerm: search || undefined,
        sortBy: "createdAt",
        sortDir: "DESC",
      });

      if (isRefresh || pageNumber === 0) {
        setTopics(data.content);
      } else {
        setTopics((prev) => [...prev, ...data.content]);
      }

      setHasMore(!data.last);
    } catch (error) {
      console.error("Failed to fetch topics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setPage(0);
    fetchTopics(0, debouncedSearch);
  }, [debouncedSearch]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(0);
    fetchTopics(0, debouncedSearch, true);
  }, [debouncedSearch]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTopics(nextPage, debouncedSearch);
    }
  };

  const navigation = useNavigation<any>();

  const renderItem = ({ item }: { item: TopicResponse }) => (
    <TouchableOpacity
      style={[styles.topicCard, { backgroundColor: surface }]}
      activeOpacity={0.8}
      onPress={() => {
        navigation.navigate(Routes.SELECT_LESSON, { topicId: item.id });
      }}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: primary + "1A" }]}>
          <Ionicons name="document-text" size={24} color={primary} />
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.topicName, { color: text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.topicDesc, { color: mutedText }]} numberOfLines={2}>
            {item.description || "No description available for this topic."}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={mutedText} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top', 'left', 'right']}>
        <View style={[styles.container, { backgroundColor: background }]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: text }]}>Writing Topics</Text>
            <Text style={[styles.headerSubtitle, { color: mutedText }]}>
              Choose a topic to practice your writing skills
            </Text>
          </View>

          <View style={[styles.searchContainer, { backgroundColor: surface, shadowOpacity: 0.0, elevation: 0 }]}>
            <Ionicons
              name="search"
              size={20}
              color={mutedText}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: text }]}
              placeholder="Search topics..."
              placeholderTextColor={mutedText}
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
            data={topics}
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
                  <Ionicons name="book-outline" size={64} color={mutedText} />
                  <Text style={[styles.emptyTitle, { color: text }]}>No topics found</Text>
                  <Text style={[styles.emptySubtitle, { color: mutedText }]}>
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
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 10,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  clearButton: {
    padding: 4,
  },
  listContainer: {
    paddingBottom: 20,
  },
  topicCard: {
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
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  topicName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  topicDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
