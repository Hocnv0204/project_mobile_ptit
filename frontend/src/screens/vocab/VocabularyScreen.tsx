import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { lessonVocabApi } from '../../api/lessonVocabApi';
import { LessonVocab } from '../../api/types';
import { Routes } from '../../constants/routes';
import { useAppSelector } from '../../store';

const { width } = Dimensions.get('window');

type TabType = 'SYSTEM' | 'USER';

export default function VocabularyScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<TabType>('SYSTEM');
  const [lessons, setLessons] = useState<LessonVocab[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const user = useAppSelector((state) => state.auth.user);

  const fetchLessons = async () => {
    try {
      const res = await lessonVocabApi.getAll();
      setLessons(res.data || []);
    } catch (error) {
      console.error('Fetch lessons error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLessons();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchLessons();
  };

  const filteredLessons = useMemo(() => {
    if (activeTab === 'SYSTEM') {
      return lessons.filter((l) => l.levelId !== null);
    } else {
      return lessons.filter((l) => l.levelId === null && l.userId === user?.id);
    }
  }, [lessons, activeTab, user]);

  const renderLessonItem = ({ item }: { item: LessonVocab }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate(Routes.LESSON_DETAIL, { lesson: item })}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={activeTab === 'SYSTEM' ? ['#0066FF', '#0052CC'] : ['#8E54E9', '#4776E6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardMeta}>
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#FFFFFF" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Học từ vựng</Text>
        {activeTab === 'USER' && (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate(Routes.CREATE_LESSON)}
          >
            <MaterialCommunityIcons name="plus" size={24} color="#0066FF" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'SYSTEM' && styles.activeTab]}
          onPress={() => setActiveTab('SYSTEM')}
        >
          <Text style={[styles.tabText, activeTab === 'SYSTEM' && styles.activeTabText]}>Hệ thống</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'USER' && styles.activeTab]}
          onPress={() => setActiveTab('USER')}
        >
          <Text style={[styles.tabText, activeTab === 'USER' && styles.activeTabText]}>Cá nhân</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0066FF" />
        </View>
      ) : (
        <FlatList
          data={filteredLessons}
          renderItem={renderLessonItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name={activeTab === 'SYSTEM' ? 'book-off' : 'plus-circle-outline'} 
                size={64} 
                color="#E0E5ED" 
              />
              <Text style={styles.emptyText}>
                {activeTab === 'SYSTEM' 
                  ? 'Không tìm thấy bài học hệ thống nào.' 
                  : 'Bạn chưa tạo bộ từ vựng nào. Hãy tạo ngay!'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1D26',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginVertical: 16,
    backgroundColor: '#E0E5ED',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#70778C',
  },
  activeTabText: {
    color: '#0066FF',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  card: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  cardGradient: {
    padding: 20,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#A0A7BA',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
