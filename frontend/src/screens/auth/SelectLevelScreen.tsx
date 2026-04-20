import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { levelApi, Level } from '../../api/levelApi';
import { authApi } from '../../api/authApi';
import { useAppDispatch, useAppSelector } from '../../store';
import { setAuth, persistAuth } from '../../store/slices/authSlice';

export default function SelectLevelScreen() {
  const dispatch = useAppDispatch();
  const { accessToken, refreshToken, tokenType, accessTokenExpiresIn, user } = useAppSelector((state) => state.auth);

  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      const res = await levelApi.getAll();
      setLevels(res.data || []);
    } catch (e: any) {
      console.log('Fetch levels error:', e);
      Alert.alert('Lỗi', 'Không thể tải danh sách Level');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (id: number) => {
    setSelectedId(id);
  };

  const handleContinue = async () => {
    if (selectedId === null) return;
    try {
      setSubmitting(true);
      const res = await authApi.updateLevel(selectedId);
      
      if (user && accessToken) {
        const updatedUser = { ...user, levelId: selectedId };
        
        dispatch(setAuth({
          accessToken,
          refreshToken: refreshToken!,
          tokenType: tokenType!,
          accessTokenExpiresIn: accessTokenExpiresIn!,
          user: updatedUser,
        }));
        
        await persistAuth({
          accessToken,
          refreshToken: refreshToken!,
          tokenType: tokenType!,
          accessTokenExpiresIn: accessTokenExpiresIn!,
          user: updatedUser,
        });
      }
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể lưu Level');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Chọn trình độ của bạn</Text>
        <Text style={styles.subtitle}>
          Hãy chọn mục tiêu hoặc trình độ hiện tại để chúng tôi tùy chỉnh lộ trình học tốt nhất cho bạn.
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#0066FF" style={styles.loader} />
        ) : (
          <View style={styles.listContainer}>
            {levels.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.card,
                  selectedId === level.id && styles.cardSelected,
                ]}
                onPress={() => handleSelect(level.id)}
                activeOpacity={0.7}
              >
                <View style={styles.cardContent}>
                  <Text style={[
                    styles.cardTitle,
                    selectedId === level.id && styles.cardTitleSelected
                  ]}>
                    {level.name}
                  </Text>
                  <Text style={[
                    styles.cardDescription,
                    selectedId === level.id && styles.cardDescriptionSelected
                  ]}>
                    {level.description || 'Chưa có mô tả'}
                  </Text>
                </View>
                {selectedId === level.id && (
                  <MaterialCommunityIcons name="check-circle" size={24} color="#0066FF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.btnPrimary, (!selectedId || submitting) && styles.btnPrimaryDisabled]} 
            onPress={handleContinue}
            disabled={!selectedId || submitting}
          >
            <Text style={styles.btnPrimaryText}>
              {submitting ? 'Đang lưu...' : 'Tiếp tục'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1D26',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#70778C',
    lineHeight: 22,
    marginBottom: 32,
  },
  loader: {
    marginTop: 40,
  },
  listContainer: {
    flex: 1,
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E5ED',
    backgroundColor: '#FFFFFF',
  },
  cardSelected: {
    borderColor: '#0066FF',
    backgroundColor: '#EBF3FF',
  },
  cardContent: {
    flex: 1,
    paddingRight: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1D26',
    marginBottom: 4,
  },
  cardTitleSelected: {
    color: '#0066FF',
  },
  cardDescription: {
    fontSize: 14,
    color: '#70778C',
  },
  cardDescriptionSelected: {
    color: '#0066FF',
    opacity: 0.8,
  },
  footer: {
    paddingVertical: 24,
  },
  btnPrimary: {
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnPrimaryDisabled: {
    backgroundColor: '#80B3FF',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
