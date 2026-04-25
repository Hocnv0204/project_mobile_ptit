import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { streakApi, StreakResponse } from '../../api/streakApi';
import { useToast } from '../../components/ToastProvider';

export default function StreakDetailsScreen({ navigation }: any) {
  const [streakData, setStreakData] = useState<StreakResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const toast = useToast();

  useEffect(() => {
    fetchStreakData();
  }, []);

  const fetchStreakData = async () => {
    try {
      setLoading(true);
      const res = await streakApi.getStreak();
      if (res.data) {
        setStreakData(res.data);
      }
    } catch (e: any) {
      toast.show(e?.message || 'Không thể tải thông tin chuỗi', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday, etc.
  };

  const isDayInStreak = (day: number) => {
    if (!streakData || !streakData.lastActivityDate || !streakData.currentStreak) return false;

    const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    // Remove time portion for comparison
    cellDate.setHours(0, 0, 0, 0);

    const lastActivity = new Date(streakData.lastActivityDate);
    lastActivity.setHours(0, 0, 0, 0);

    const streakStart = new Date(lastActivity);
    streakStart.setDate(streakStart.getDate() - streakData.currentStreak + 1);

    return cellDate >= streakStart && cellDate <= lastActivity;
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    let firstDay = getFirstDayOfMonth(year, month);
    
    // Adjust so Monday is 0, Sunday is 6
    firstDay = firstDay === 0 ? 6 : firstDay - 1;

    const days = [];
    const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    // Render weekday headers
    const headers = weekDays.map((day, index) => (
      <View key={`header-${index}`} style={styles.cell}>
        <Text style={styles.weekDayText}>{day}</Text>
      </View>
    ));

    // Fill empty cells before start of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.cell} />);
    }

    // Render days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= daysInMonth; i++) {
      const inStreak = isDayInStreak(i);
      const isToday = year === today.getFullYear() && month === today.getMonth() && i === today.getDate();

      days.push(
        <View key={`day-${i}`} style={[styles.cell, inStreak && styles.streakCell, isToday && styles.todayCell]}>
          <Text style={[styles.dayText, inStreak && styles.streakDayText, isToday && styles.todayText]}>
            {i}
          </Text>
          {inStreak && <MaterialCommunityIcons name="fire" size={12} color="#F59E0B" style={styles.fireIcon} />}
        </View>
      );
    }

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.row}>{headers}</View>
        <View style={styles.daysGrid}>{days}</View>
      </View>
    );
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1D26" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết Streak</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="fire" size={32} color="#F59E0B" />
            <Text style={styles.statValue}>{streakData?.currentStreak || 0}</Text>
            <Text style={styles.statLabel}>Chuỗi hiện tại</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="crown" size={32} color="#F59E0B" />
            <Text style={styles.statValue}>{streakData?.longestStreak || 0}</Text>
            <Text style={styles.statLabel}>Kỷ lục dài nhất</Text>
          </View>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavButton}>
              <MaterialCommunityIcons name="chevron-left" size={24} color="#1A1D26" />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavButton}>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#1A1D26" />
            </TouchableOpacity>
          </View>
          {renderCalendar()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F6',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1D26',
  },
  scrollContainer: {
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1D26',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#70778C',
    fontWeight: '600',
    marginTop: 4,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthNavButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1D26',
  },
  calendarContainer: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '14.28%', // 100% / 7
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakCell: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  todayCell: {
    borderWidth: 1,
    borderColor: '#0066FF',
    borderRadius: 12,
  },
  weekDayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1D26',
  },
  streakDayText: {
    color: '#D97706',
  },
  todayText: {
    color: '#0066FF',
  },
  fireIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    opacity: 0.8,
  },
});
