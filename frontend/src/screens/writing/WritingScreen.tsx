import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Colors } from "../../constants/colors";
import { Routes } from "../../constants/routes";
import { writingApi } from "../../api/writing/writingApi";
import { UserLessonProgressResponse } from "../../api/writing/types";

export default function WritingScreen() {
  const [lessons, setLessons] = useState<UserLessonProgressResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  const fetchMyLessons = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await writingApi.getMyLessons();
      setLessons(data);
    } catch (error) {
      console.error("Failed to fetch my lessons:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMyLessons();
    }, [])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMyLessons(true);
  }, []);

  const renderItem = ({ item }: { item: UserLessonProgressResponse }) => {
    const progress = item.totalSentences > 0 
      ? (item.currentOrderIndex -1) / item.totalSentences 
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
              <Text style={styles.lessonDesc} numberOfLines={2}>
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
                {(item.currentOrderIndex -1)}/{item.totalSentences}
              </Text>
            </View>
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
          <View>
            <Text style={styles.headerTitle}>My Writing</Text>
            <Text style={styles.headerSubtitle}>
              Continue your writing practice
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.topicButton}
            onPress={() => navigation.navigate(Routes.SELECT_TOPIC)}
          >
            <Ionicons name="grid-outline" size={20} color="#FFF" />
            <Text style={styles.topicButtonText}>Topics</Text>
          </TouchableOpacity>
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
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={64} color="#E0E0E0" />
                <Text style={styles.emptyTitle}>No lessons yet</Text>
                <Text style={styles.emptySubtitle}>
                  Choose a topic to start practicing
                </Text>
                <TouchableOpacity 
                  style={styles.startBtn}
                  onPress={() => navigation.navigate(Routes.SELECT_TOPIC)}
                >
                  <Text style={styles.startBtnText}>Explore Topics</Text>
                </TouchableOpacity>
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
    backgroundColor: "#F8F9FA",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1D26",
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#A0A0BC",
  },
  topicButton: {
    backgroundColor: '#0066FF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  topicButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  listContainer: {
    paddingBottom: 20,
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
    marginBottom: 12,
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
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#F0F0F7',
    borderRadius: 3,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0066FF',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#5A5A7A',
    fontWeight: '600',
    minWidth: 35,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
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
    marginBottom: 24,
    textAlign: 'center',
  },
  startBtn: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  startBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
