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
import { authApi } from '../../api/authApi';
import { Routes } from '../../constants/routes';
import { useAppColors } from '../../theme/useAppColors';
import { useSettingsStore } from '../../store/settingsStore';

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
  const { background, surface, text, mutedText, border, primary } = useAppColors();
  const themeMode = useSettingsStore((s) => s.themeMode);

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

  const onPressAction = (route: string) => {
    navigation.navigate(route);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]}>
      <LinearGradient
        colors={
          themeMode === 'dark'
            ? [background, background, background]
            : ['#EBF3FF', '#FFFFFF', '#FFFFFF']
        }
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
              <Text style={[styles.greetingText, { color: text }]}>Xin chào, {currentUser.name}</Text>
              <Text style={[styles.subGreetingText, { color: mutedText }]}>Bạn đang học {currentUser.level}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.headerRight}>
            <MaterialCommunityIcons name="menu-down" size={28} color={text} />
          </TouchableOpacity>
        </View>

        {/* 2. Dành cho bạn */}
        <Text style={[styles.sectionTitle, { color: text }]}>Dành cho bạn</Text>
        <View style={styles.gridContainer}>
          <TouchableOpacity style={[styles.featureCard, { backgroundColor: surface }]} onPress={() => onPressAction(Routes.WRITING)}>
            <View style={[styles.iconHex, { backgroundColor: primary }]}>
              <MaterialCommunityIcons name="pencil" size={24} color="#FFF" />
            </View>
            <Text style={[styles.featureText, { color: text }]}>Writing</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.featureCard, { backgroundColor: surface }]} onPress={() => onPressAction(Routes.DICTATION)}>
            <View style={[styles.iconHex, { backgroundColor: primary }]}>
              <MaterialCommunityIcons name="headphones" size={24} color="#FFF" />
            </View>
            <Text style={[styles.featureText, { color: text }]}>Dictation</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.featureCard, { backgroundColor: surface }]} onPress={() => onPressAction(Routes.PODCAST)}>
            <View style={[styles.iconHex, { backgroundColor: primary }]}>
              <MaterialCommunityIcons name="podcast" size={24} color="#FFF" />
            </View>
            <Text style={[styles.featureText, { color: text }]}>Podcast</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.featureCard, { backgroundColor: surface }]} onPress={() => onPressAction(Routes.VOCABULARY)}>
            <View style={[styles.iconHex, { backgroundColor: primary + '1A' }]}>
              <MaterialCommunityIcons name="book-open-variant" size={24} color={primary} />
            </View>
            <Text style={[styles.featureText, { color: text }]}>Vocabulary</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Learning Profile */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: text }]}>Learning Profile</Text>
          <TouchableOpacity>
            <Text style={[styles.seeAllText, { color: primary }]}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {/* Trình độ TOEIC Card */}
        <View style={[styles.toeicCard, { backgroundColor: surface }]}>
          <Text style={[styles.toeicTitle, { color: text }]}>Trình độ {currentUser.level} của bạn</Text>
          <View style={styles.stairsImagePlaceholder}>
            <MaterialCommunityIcons name="stairs-up" size={48} color="#EBF3FF" style={{ alignSelf: 'flex-end', opacity: 0.5 }} />
          </View>
          
          <View style={styles.toeicProgressRow}>
            {/* Step 1 */}
            <View style={styles.toeicStep}>
              <View style={[styles.stepDotOuter, { borderColor: primary, backgroundColor: surface }]}>
                <View style={styles.stepDotInner} />
              </View>
              <Text style={[styles.stepLabel, { color: mutedText }]}>Đầu vào</Text>
              <Text style={[styles.stepValue, { color: text }]}>-</Text>
            </View>
            
            <View style={[styles.stepLine, { borderColor: border }]} />

            {/* Step 2 */}
            <View style={styles.toeicStep}>
              <View style={[styles.stepDotOuter, { borderColor: primary, backgroundColor: surface }]}>
                <View style={styles.stepDotInner} />
              </View>
              <Text style={[styles.stepLabel, { color: mutedText }]}>Dự đoán</Text>
              <Text style={[styles.stepValue, { color: text }]}>-</Text>
            </View>

            <View style={[styles.stepLine, { borderColor: border }]} />

            {/* Step 3 */}
            <View style={styles.toeicStep}>
              <View style={[styles.stepDotOuterActive, { backgroundColor: primary + '1A' }]}>
                <MaterialCommunityIcons name="bullseye-arrow" size={16} color={primary} />
              </View>
              <Text style={[styles.stepLabel, { color: mutedText }]}>Mục tiêu</Text>
              <Text style={[styles.stepValue, { color: text }]}>-</Text>
            </View>
          </View>
        </View>

        {/* 4 Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.statHeader}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={mutedText} />
              <Text style={[styles.statLabel, { color: mutedText }]}>Tổng thời lượng</Text>
              <MaterialCommunityIcons name="information" size={14} color="#A0A7BA" style={styles.infoIcon} />
            </View>
            <Text style={[styles.statValue, { color: '#0066FF' }]}>0 phút</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.statHeader}>
              <MaterialCommunityIcons name="trophy" size={16} color="#FFB84C" />
              <Text style={[styles.statLabel, { color: mutedText }]}>Tổng số cúp</Text>
              <MaterialCommunityIcons name="information" size={14} color="#A0A7BA" style={styles.infoIcon} />
            </View>
            <Text style={[styles.statValue, { color: '#FFB84C' }]}>0</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.statHeader}>
              <MaterialCommunityIcons name="file-document-edit-outline" size={16} color="#E91E63" />
              <Text style={[styles.statLabel, { color: mutedText }]}>Số bài test đã làm</Text>
            </View>
            <Text style={[styles.statValue, { color: '#E91E63' }]}>0</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.statHeader}>
              <MaterialCommunityIcons name="play-box-outline" size={16} color="#4CAF50" />
              <Text style={[styles.statLabel, { color: mutedText }]}>Số bài đã học</Text>
            </View>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>0</Text>
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

  // 2. Grid Container
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  featureCard: {
    width: (width - 40 - 16) / 2, // 2 columns, 16px gap
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
    flex: 1,
  },

  // 3. TOEIC Card
  toeicCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  toeicTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 24,
    zIndex: 1,
  },
  stairsImagePlaceholder: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 0,
  },
  toeicProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    zIndex: 1,
  },
  toeicStep: {
    alignItems: 'center',
  },
  stepDotOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0066FF',
  },
  stepDotOuterActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EBF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    borderStyle: 'dashed',
    marginHorizontal: 8,
    marginTop: -40,
  },
  stepLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  stepValue: {
    fontSize: 16,
    fontWeight: '700',
  },

  // 4. Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 40 - 16) / 2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEF0F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
  },
  infoIcon: {
    marginLeft: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },

  bottomSpacer: {
    height: 40,
  },
});
