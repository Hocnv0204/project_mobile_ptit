import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Routes } from '../../constants/routes';
import { dictationApi, DictationItem } from '../../api/dictationApi';

export default function DictationScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dictations, setDictations] = useState<DictationItem[]>([]);

  const fetchData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const res = await dictationApi.getAll();
      setDictations(res.data || []);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể tải danh sách bài nghe');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch when screen comes back into focus
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      fetchData(false);
    });
    return unsub;
  }, [navigation, fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(false);
  };

  const getStatusInfo = (item: DictationItem) => {
    if (item.progressPercent === null || item.progressPercent === undefined) {
      return { label: 'Chưa bắt đầu', color: '#A0A7BA', icon: 'play-circle-outline' as const };
    }
    if (item.progressPercent >= 100) {
      return { label: 'Hoàn thành', color: '#4CAF50', icon: 'check-circle' as const };
    }
    return { label: `${Math.round(item.progressPercent)}%`, color: '#0066FF', icon: 'progress-clock' as const };
  };

  const renderCard = ({ item, index }: { item: DictationItem; index: number }) => {
    const status = getStatusInfo(item);
    const isCompleted = item.progressPercent !== null && item.progressPercent >= 100;

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() =>
          navigation.navigate(Routes.DICTATION_PLAYER, { dictation: item })
        }
      >
        {/* Thumbnail / Icon area */}
        <LinearGradient
          colors={
            isCompleted
              ? ['#E8F5E9', '#C8E6C9']
              : ['#EBF3FF', '#D6E8FF']
          }
          style={styles.cardThumbnail}
        >
          <MaterialCommunityIcons
            name={isCompleted ? 'headphones-box' : 'headphones'}
            size={32}
            color={isCompleted ? '#4CAF50' : '#0066FF'}
          />
          {item.totalSegments > 0 && (
            <View style={styles.segmentBadge}>
              <Text style={styles.segmentBadgeText}>
                {item.totalSegments} câu
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>

          {/* Progress bar */}
          <View style={styles.progressRow}>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(item.progressPercent ?? 0, 100)}%`,
                    backgroundColor: isCompleted ? '#4CAF50' : '#0066FF',
                  },
                ]}
              />
            </View>
            <View style={styles.statusBadge}>
              <MaterialCommunityIcons
                name={status.icon}
                size={14}
                color={status.color}
              />
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Arrow */}
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color="#C4C8D4"
        />
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Luyện Dictation</Text>
          <Text style={styles.headerSubtitle}>
            Nghe và điền từ còn thiếu
          </Text>
        </View>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="headphones" size={28} color="#0066FF" />
        </View>
      </View>

      {/* Stats summary */}
      {dictations.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="book-open-variant" size={16} color="#0066FF" />
            <Text style={styles.statValue}>{dictations.length}</Text>
            <Text style={styles.statLabel}>Bài học</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
            <Text style={styles.statValue}>
              {dictations.filter(d => d.progressPercent !== null && d.progressPercent >= 100).length}
            </Text>
            <Text style={styles.statLabel}>Hoàn thành</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="progress-clock" size={16} color="#FF9800" />
            <Text style={styles.statValue}>
              {dictations.filter(d => d.progressPercent !== null && d.progressPercent > 0 && d.progressPercent < 100).length}
            </Text>
            <Text style={styles.statLabel}>Đang học</Text>
          </View>
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Đang tải bài học...</Text>
        </View>
      ) : (
        <FlatList
          data={dictations}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0066FF']}
              tintColor="#0066FF"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="headphones-off" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Chưa có bài dictation</Text>
              <Text style={styles.emptyText}>
                Bài nghe chính tả sẽ được cập nhật sớm
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#70778C',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1D26',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#70778C',
    marginTop: 4,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EBF3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1D26',
  },
  statLabel: {
    fontSize: 11,
    color: '#70778C',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#EEF0F6',
  },

  // List
  listContent: {
    padding: 24,
    paddingBottom: 100,
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  segmentBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  segmentBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFF',
  },
  cardContent: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1D26',
    marginBottom: 10,
    lineHeight: 20,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#EEF0F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1D26',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#A0A7BA',
    textAlign: 'center',
  },
});
