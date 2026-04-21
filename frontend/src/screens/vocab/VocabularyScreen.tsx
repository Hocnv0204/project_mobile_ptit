import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppSelector } from '../../store';
import { lessonVocabApi } from '../../api/lessonVocabApi';
import { LessonVocab } from '../../api/types';
import { Routes } from '../../constants/routes';

export default function VocabularyScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const user = useAppSelector((state) => state.auth.user);
  
  const [loadingSystem, setLoadingSystem] = useState(true);
  const [loadingPersonal, setLoadingPersonal] = useState(false);
  const [systemLessons, setSystemLessons] = useState<LessonVocab[]>([]);
  const [personalLessons, setPersonalLessons] = useState<LessonVocab[]>([]);
  const [activeTab, setActiveTab] = useState<'system' | 'personal'>('system');
  
  const [isModalVisible, setModalVisible] = useState(false);
  const [newLessonName, setNewLessonName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchSystemLessons();
  }, []);

  const fetchSystemLessons = async () => {
    try {
      setLoadingSystem(true);
      // Lấy lesson của admin, lọc theo levelId của user hiện tại
      const res = await lessonVocabApi.getSystemLessons('admin', user?.levelId ?? undefined);
      setSystemLessons(res.data || []);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể tải danh sách bài học');
    } finally {
      setLoadingSystem(false);
    }
  };

  const fetchPersonalLessons = async () => {
    if (!user?.id) return;
    try {
      setLoadingPersonal(true);
      const res = await lessonVocabApi.getByUserId(user.id);
      setPersonalLessons(res.data || []);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể tải bài học cá nhân');
    } finally {
      setLoadingPersonal(false);
    }
  };

  const handleTabChange = (tab: 'system' | 'personal') => {
    setActiveTab(tab);
    if (tab === 'personal' && personalLessons.length === 0) {
      fetchPersonalLessons();
    }
  };

  const handleCreateLesson = async () => {
    if (!newLessonName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên bài học');
      return;
    }
    try {
      setIsCreating(true);
      const res = await lessonVocabApi.createSimple(newLessonName.trim());
      setPersonalLessons((prev) => [...prev, res.data]);
      setModalVisible(false);
      setNewLessonName('');
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể tạo bài học');
    } finally {
      setIsCreating(false);
    }
  };

  const renderItem = ({ item }: { item: LessonVocab }) => (
    <Pressable 
      style={styles.card}
      onPress={() => navigation.navigate(Routes.LESSON_DETAIL, { lesson: item, isPersonal: activeTab === 'personal' })}
    >
      <View style={styles.cardIcon}>
        <MaterialCommunityIcons name="book-open-page-variant" size={24} color="#0066FF" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSubtitle}>
          {new Date(item.createdAt).toLocaleDateString('vi-VN')}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#C4C8D4" />
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Từ vựng</Text>
      </View>

      <View style={styles.tabContainer}>
        <Pressable 
          style={[styles.tab, activeTab === 'system' && styles.tabActive]}
          onPress={() => handleTabChange('system')}
        >
          <Text style={[styles.tabText, activeTab === 'system' && styles.tabTextActive]}>Hệ thống</Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'personal' && styles.tabActive]}
          onPress={() => handleTabChange('personal')}
        >
          <Text style={[styles.tabText, activeTab === 'personal' && styles.tabTextActive]}>Cá nhân</Text>
        </Pressable>
      </View>

      {(activeTab === 'system' ? loadingSystem : loadingPersonal) ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0066FF" />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'system' ? systemLessons : personalLessons}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {activeTab === 'personal' ? 'Bạn chưa có bài học nào. Nhấn (+) để tạo mới!' : 'Chưa có bài học nào.'}
              </Text>
            </View>
          }
        />
      )}

      {activeTab === 'personal' && (
        <Pressable 
          style={styles.fab}
          onPress={() => setModalVisible(true)}
        >
          <MaterialCommunityIcons name="plus" size={30} color="#FFF" />
        </Pressable>
      )}

      {/* Create Lesson Modal */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tạo bài học mới</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nhập tên bài học (VD: Động từ bất quy tắc)"
              value={newLessonName}
              onChangeText={setNewLessonName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </Pressable>
              <Pressable 
                style={[styles.modalBtn, styles.modalBtnSubmit, isCreating && styles.modalBtnDisabled]} 
                onPress={handleCreateLesson}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.modalBtnSubmitText}>Tạo</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFF',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1D26' },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F6',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#0066FF' },
  tabText: { fontSize: 16, fontWeight: '600', color: '#70778C' },
  tabTextActive: { color: '#0066FF' },
  listContent: { padding: 24, paddingBottom: 100 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
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
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1A1D26', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#A0A7BA' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#A0A7BA', fontSize: 16 },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1D26', marginBottom: 16 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnCancel: { backgroundColor: '#F1F5F9' },
  modalBtnSubmit: { backgroundColor: '#0066FF' },
  modalBtnDisabled: { backgroundColor: '#A0C2FF' },
  modalBtnCancelText: { color: '#64748B', fontSize: 16, fontWeight: '600' },
  modalBtnSubmitText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
