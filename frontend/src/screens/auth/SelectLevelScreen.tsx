import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { levelApi, Level } from '../../api/levelApi';
import { userApi } from '../../api/userApi';
import { useAppDispatch, useAppSelector } from '../../store';
import { setAuth, persistAuth } from '../../store/slices/authSlice';
import { Routes } from '../../constants/routes';

export default function SelectLevelScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const authState = useAppSelector(state => state.auth);
  
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(authState.user?.levelId || null);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      setLoading(true);
      const res = await levelApi.getAll();
      setLevels(res.data || []);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể tải danh sách trình độ');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedLevelId) {
      Alert.alert('Thông báo', 'Vui lòng chọn trình độ của bạn');
      return;
    }

    try {
      setSaving(true);
      const res = await userApi.updateLevel(selectedLevelId);
      
      setSuccessMessage(res.message || 'Cập nhật trình độ thành công');
      setShowSuccess(true);
      
      setTimeout(async () => {
        // Update local state
        if (authState.user) {
          const updatedUser = { ...authState.user, levelId: selectedLevelId };
          const updatedAuth = { ...authState, user: updatedUser };
          dispatch(setAuth(updatedAuth as any));
          await persistAuth(updatedAuth as any);
        }

        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: Routes.USER_NAVIGATOR }],
          });
        }
      }, 1500);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể lưu trình độ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  if (showSuccess) {
    return (
      <View style={[styles.center, { backgroundColor: '#0066FF', flex: 1 }]}>
        <MaterialCommunityIcons name="check-circle-outline" size={80} color="#FFF" />
        <Text style={styles.successText}>
          {successMessage}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1D26" />
          </Pressable>
        )}
        <Text style={styles.title}>Chọn Trình Độ</Text>
      </View>

      <Text style={styles.subtitle}>
        Vui lòng chọn trình độ tiếng Anh hiện tại của bạn để chúng tôi có thể đề xuất bài học phù hợp.
      </Text>

      <FlatList
        data={levels}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isSelected = selectedLevelId === item.id;
          return (
            <Pressable
              style={[styles.levelCard, isSelected && styles.levelCardSelected]}
              onPress={() => setSelectedLevelId(item.id)}
            >
              <View style={styles.levelInfo}>
                <Text style={[styles.levelName, isSelected && styles.levelNameSelected]}>
                  {item.name}
                </Text>
                {item.description ? (
                  <Text style={[styles.levelDesc, isSelected && styles.levelDescSelected]}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioInner} />}
              </View>
            </Pressable>
          );
        }}
      />

      <View style={styles.footer}>
        <Pressable
          style={[styles.btn, (!selectedLevelId || saving) && styles.btnDisabled]}
          disabled={!selectedLevelId || saving}
          onPress={handleSave}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.btnText}>Xác nhận</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: { marginRight: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#1A1D26' },
  subtitle: {
    fontSize: 14,
    color: '#70778C',
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  listContent: { paddingHorizontal: 24, paddingBottom: 24, gap: 12 },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  levelCardSelected: {
    borderColor: '#0066FF',
    backgroundColor: '#F0F5FF',
  },
  levelInfo: { flex: 1, paddingRight: 16 },
  levelName: { fontSize: 18, fontWeight: '600', color: '#1A1D26', marginBottom: 4 },
  levelNameSelected: { color: '#0066FF' },
  levelDesc: { fontSize: 13, color: '#70778C', lineHeight: 18 },
  levelDescSelected: { color: '#4D8FFF' },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: { borderColor: '#0066FF' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#0066FF' },
  footer: { padding: 24, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  btn: {
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: '#A0C2FF' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  successText: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 16, textAlign: 'center', paddingHorizontal: 24 },
});
