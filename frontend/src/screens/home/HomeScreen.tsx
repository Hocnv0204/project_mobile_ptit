import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { authApi } from '../../api/authApi';
import { vocabApi } from '../../api/vocabApi';
import { streakApi, StreakResponse } from '../../api/streakApi';
import { Routes } from '../../constants/routes';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ToastProvider';

const { width } = Dimensions.get('window');

// --- TYPES ---
export interface UserData {
  name: string;
  avatarUrl: string;
  level: string;
}

const MOCK_USER: UserData = {
  name: "Nguyễn Văn Học",
  avatarUrl: "https://picsum.photos/100",
  level: "TOEIC",
};

export default function HomeScreen({ navigation }: any) {
  const [currentUser, setCurrentUser] = useState(MOCK_USER);
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const isFocused = useIsFocused();
  const [streakData, setStreakData] = useState<StreakResponse | null>(null);
  const [vocabStatsLoading, setVocabStatsLoading] = useState(false);
  const [vocabStats, setVocabStats] = useState({
    dueToday: 0,
    overdue: 0,
    upcoming7d: 0,
    newWords: 0,
    total: 0,
  });

  useEffect(() => {
    authApi.me()
      .then(res => {
        if (res && res.data) {
          setCurrentUser(prev => ({
            ...prev,
            name: res.data.fullName || res.data.username || prev.name,
          }));
        }
      })
      .catch(err => console.log('Fetch profile error:', err));
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!user?.id || !isFocused) return;
      try {
        setVocabStatsLoading(true);
        const statsRes = await vocabApi.homeStats();
        const s = statsRes.data;
        setVocabStats({
          dueToday: s?.dueToday ?? 0,
          overdue: s?.overdue ?? 0,
          upcoming7d: s?.upcoming7d ?? 0,
          newWords: s?.newWords ?? 0,
          total: s?.total ?? 0,
        });
      } catch (e: any) {
        toast.show(e?.message || 'Không thể tải thống kê học tập', { type: 'error', durationMs: 4500 });
      } finally {
        setVocabStatsLoading(false);
      }
    };
    run();
  }, [user?.id, isFocused]);

  useEffect(() => {
    const fetchStreak = async () => {
      if (!user?.id || !isFocused) return;
      try {
        const res = await streakApi.getStreak();
        if (res.data) setStreakData(res.data);
      } catch (e: any) {
        console.log('Fetch streak error:', e);
      }
    };
    fetchStreak();
  }, [user?.id, isFocused]);

  const onPressAction = (route: string) => {
    navigation.navigate(route);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#EBF3FF', '#FFFFFF', '#FFFFFF']}
        locations={[0, 0.3, 1]}
        style={styles.backgroundGradient}
      />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.navigate(Routes.PROFILE)}>
              <Image source={{ uri: currentUser.avatarUrl }} style={styles.avatarImage} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.greetingText}>Xin chào, {currentUser.name}</Text>
              <Text style={styles.subGreetingText}>Bạn đang học {currentUser.level}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.headerRight}>
            <MaterialCommunityIcons name="menu-down" size={28} color="#1A1D26" />
          </TouchableOpacity>
        </View>

        {/* Streak Section */}
        <View style={styles.streakContainer}>
          <View style={styles.streakLeft}>
            <View style={styles.fireIconContainer}>
              <MaterialCommunityIcons name="fire" size={28} color="#FF6B00" />
            </View>
            <View>
              <Text style={styles.streakNumber}>{streakData?.currentStreak || 0} ngày</Text>
              <Text style={styles.streakLabel}>Chuỗi học tập</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.streakDetailBtn}
            onPress={() => onPressAction(Routes.STREAK_DETAILS)}
          >
            <Text style={styles.streakDetailBtnText}>Chi tiết</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#0066FF" />
          </TouchableOpacity>
        </View>

        {/* 2. Dành cho bạn */}
        <Text style={styles.sectionTitle}>Dành cho bạn</Text>
        <View style={styles.gridContainer}>
          <TouchableOpacity style={styles.featureCard} onPress={() => onPressAction(Routes.WRITING)}>
            <View style={[styles.iconHex, { backgroundColor: '#0066FF' }]}>
              <MaterialCommunityIcons name="pencil" size={24} color="#FFF" />
            </View>
            <Text style={styles.featureText}>Writing</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.featureCard} onPress={() => onPressAction(Routes.DICTATION)}>
            <View style={[styles.iconHex, { backgroundColor: '#0066FF' }]}>
              <MaterialCommunityIcons name="headphones" size={24} color="#FFF" />
            </View>
            <Text style={styles.featureText}>Dictation</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => onPressAction(Routes.PODCAST)}>
            <View style={[styles.iconHex, { backgroundColor: '#0066FF' }]}>
              <MaterialCommunityIcons name="podcast" size={24} color="#FFF" />
            </View>
            <Text style={styles.featureText}>Podcast</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => onPressAction(Routes.VOCABULARY)}>
            <View style={[styles.iconHex, { backgroundColor: '#EBF3FF' }]}>
              <MaterialCommunityIcons name="book-open-variant" size={24} color="#0066FF" />
            </View>
            <Text style={styles.featureText}>Vocabulary</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Trạng thái học hiện tại */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trạng thái học</Text>
          <View />
        </View>

        <View style={styles.dashboardCard}>
          <View style={styles.dashboardHeader}>
            <View style={styles.dashboardTitleRow}>
              <View style={styles.dashboardIcon}>
                <MaterialCommunityIcons name="book-open-variant" size={18} color="#0066FF" />
              </View>
              <Text style={styles.dashboardTitle}>Vocabulary</Text>
            </View>
            {vocabStatsLoading ? (
              <Text style={styles.dashboardHint}>Đang cập nhật...</Text>
            ) : (
              <Text style={styles.dashboardHint}>{vocabStats.total} từ</Text>
            )}
          </View>

          <View style={styles.dashboardGrid}>
            <View style={[styles.dashboardItem, { backgroundColor: '#EEF2FF' }]}>
              <Text style={styles.dashboardLabel}>Cần học hôm nay</Text>
              <Text style={[styles.dashboardValue, { color: '#3730A3' }]}>{vocabStats.dueToday}</Text>
            </View>
            <View style={[styles.dashboardItem, { backgroundColor: '#FEF2F2' }]}>
              <Text style={styles.dashboardLabel}>Quá hạn</Text>
              <Text style={[styles.dashboardValue, { color: '#B91C1C' }]}>{vocabStats.overdue}</Text>
            </View>
            <View style={[styles.dashboardItem, { backgroundColor: '#ECFDF5' }]}>
              <Text style={styles.dashboardLabel}>Sắp tới (7 ngày)</Text>
              <Text style={[styles.dashboardValue, { color: '#047857' }]}>{vocabStats.upcoming7d}</Text>
            </View>
            <View style={[styles.dashboardItem, { backgroundColor: '#FFF7ED' }]}>
              <Text style={styles.dashboardLabel}>Từ mới</Text>
              <Text style={[styles.dashboardValue, { color: '#C2410C' }]}>{vocabStats.newWords}</Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 300,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  
  // 1. Header
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
    marginRight: 12,
  },
  headerTextContainer: {
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1D26',
  },
  subGreetingText: {
    fontSize: 14,
    color: '#70778C',
    marginTop: 2,
  },
  headerRight: {
    padding: 4,
  },

  // Generic
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1D26',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066FF',
    marginBottom: 16,
  },

  // Streak Section
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fireIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  streakNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#D97706',
  },
  streakLabel: {
    fontSize: 13,
    color: '#70778C',
    fontWeight: '600',
    marginTop: 2,
  },
  streakDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF3FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakDetailBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0066FF',
    marginRight: 4,
  },

  // 2. Grid Container
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  featureCard: {
    width: (width - 40 - 16) / 2, // 2 columns, 16px gap
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconHex: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1D26',
    flex: 1,
  },

  dashboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dashboardTitleRow: { flexDirection: 'row', alignItems: 'center' },
  dashboardIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#EBF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dashboardTitle: { fontSize: 16, fontWeight: '800', color: '#1A1D26' },
  dashboardHint: { fontSize: 13, color: '#70778C', fontWeight: '700' },
  dashboardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  dashboardItem: {
    // screen paddingHorizontal: 20*2, card padding: 16*2, gap giữa 2 cột: 12
    width: (width - 40 - 32 - 12) / 2,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  dashboardLabel: { fontSize: 12, color: '#334155', fontWeight: '700' },
  dashboardValue: { fontSize: 22, fontWeight: '900', marginTop: 8 },

  bottomSpacer: {
    height: 40,
  },
});
