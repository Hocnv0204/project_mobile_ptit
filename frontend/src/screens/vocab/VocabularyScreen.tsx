import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { lessonVocabApi } from '../../api/lessonVocabApi';
import { LessonVocab } from '../../api/types';
import { Routes } from '../../constants/routes';
import { useAuthStore } from '../../store/authStore';
import { useAppColors } from '../../theme/useAppColors';

export default function VocabularyScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { background, surface, text, mutedText, border, primary } = useAppColors();
  
  const [loadingSystem, setLoadingSystem] = useState(true);
  const [loadingPersonal, setLoadingPersonal] = useState(false);
  const [systemLessons, setSystemLessons] = useState<LessonVocab[]>([]);
  const [personalLessons, setPersonalLessons] = useState<LessonVocab[]>([]);
  const [activeTab, setActiveTab] = useState<'system' | 'personal'>('system');
  
  const [isModalVisible, setModalVisible] = useState(false);
  const [newLessonName, setNewLessonName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonVocab | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const handleSaveLesson = async () => {
    if (!newLessonName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên bài học');
      return;
    }
    try {
      setIsSaving(true);
      const name = newLessonName.trim();

      if (editingLesson) {
        const levelId = editingLesson.levelId ?? user?.levelId ?? 1;
        const res = await lessonVocabApi.update(editingLesson.id, { name, levelId });
        setPersonalLessons((prev) => prev.map((x) => (x.id === editingLesson.id ? res.data : x)));
      } else {
        const res = await lessonVocabApi.createSimple(name);
        setPersonalLessons((prev) => [...prev, res.data]);
      }

      setModalVisible(false);
      setNewLessonName('');
      setEditingLesson(null);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || (editingLesson ? 'Không thể cập nhật bài học' : 'Không thể tạo bài học'));
    } finally {
      setIsSaving(false);
    }
  };

  const openCreateModal = () => {
    setEditingLesson(null);
    setNewLessonName('');
    setModalVisible(true);
  };

  const openEditModal = (lesson: LessonVocab) => {
    setEditingLesson(lesson);
    setNewLessonName(lesson.name ?? '');
    setModalVisible(true);
  };

  const handleDeleteLesson = (lesson: LessonVocab) => {
    Alert.alert(
      'Xoá bài học?',
      `Bạn có chắc muốn xoá "${lesson.name}"?`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(lesson.id);
              await lessonVocabApi.delete(lesson.id);
              setPersonalLessons((prev) => prev.filter((x) => x.id !== lesson.id));
            } catch (e: any) {
              Alert.alert('Lỗi', e?.message || 'Không thể xoá bài học');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: LessonVocab }) => (
    <Pressable 
      style={[styles.card, { backgroundColor: surface }]}
      onPress={() => navigation.navigate(Routes.LESSON_DETAIL, { lesson: item, isPersonal: activeTab === 'personal' })}
    >
      <View style={[styles.cardIcon, { backgroundColor: primary + '1A' }]}>
        <MaterialCommunityIcons name="book-open-page-variant" size={24} color={primary} />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: text }]}>{item.name}</Text>
        <Text style={[styles.cardSubtitle, { color: mutedText }]}>
          {new Date(item.createdAt).toLocaleDateString('vi-VN')}
        </Text>
      </View>
      {activeTab === 'personal' ? (
        <View style={styles.rowActions}>
          <Pressable
            style={[styles.editBtn, { borderColor: border }]}
            onPress={(e) => {
              // @ts-ignore - RN press events support stopPropagation in runtime
              e?.stopPropagation?.();
              if (deletingId || isSaving) return;
              openEditModal(item);
            }}
            disabled={deletingId === item.id || isSaving}
            hitSlop={10}
          >
            <MaterialCommunityIcons name="pencil-outline" size={22} color="#2563EB" />
          </Pressable>

          <Pressable
            style={[styles.deleteBtn, { borderColor: border }]}
            onPress={(e) => {
              // @ts-ignore - RN press events support stopPropagation in runtime
              e?.stopPropagation?.();
              if (deletingId || isSaving) return;
              handleDeleteLesson(item);
            }}
            disabled={deletingId === item.id || isSaving}
            hitSlop={10}
          >
            {deletingId === item.id ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <MaterialCommunityIcons name="trash-can-outline" size={22} color="#EF4444" />
            )}
          </Pressable>
        </View>
      ) : (
        <MaterialCommunityIcons name="chevron-right" size={24} color={mutedText} />
      )}
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: background }]}>
      <View style={[styles.header, { backgroundColor: surface }]}>
        <Text style={[styles.headerTitle, { color: text }]}>Từ vựng</Text>
      </View>

      <View style={[styles.tabContainer, { backgroundColor: surface, borderBottomColor: border }]}>
        <Pressable 
          style={[styles.tab, activeTab === 'system' && { borderBottomColor: primary }]}
          onPress={() => handleTabChange('system')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'system' ? primary : mutedText }]}>Hệ thống</Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'personal' && { borderBottomColor: primary }]}
          onPress={() => handleTabChange('personal')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'personal' ? primary : mutedText }]}>Cá nhân</Text>
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
              <Text style={[styles.emptyText, { color: mutedText }]}>
                {activeTab === 'personal' ? 'Bạn chưa có bài học nào. Nhấn (+) để tạo mới!' : 'Chưa có bài học nào.'}
              </Text>
            </View>
          }
        />
      )}

      {activeTab === 'personal' && (
        <Pressable 
          style={styles.fab}
          onPress={openCreateModal}
        >
          <MaterialCommunityIcons name="plus" size={30} color="#FFF" />
        </Pressable>
      )}

      {/* Create Lesson Modal */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surface }]}>
            <Text style={[styles.modalTitle, { color: text }]}>
              {editingLesson ? 'Đổi tên bài học' : 'Tạo bài học mới'}
            </Text>
            <TextInput
              style={[styles.modalInput, { borderColor: border, color: text }]}
              placeholder="Nhập tên bài học (VD: Động từ bất quy tắc)"
              placeholderTextColor={mutedText}
              value={newLessonName}
              onChangeText={setNewLessonName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setModalVisible(false);
                  setEditingLesson(null);
                  setNewLessonName('');
                }}
                disabled={isSaving}
              >
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </Pressable>
              <Pressable 
                style={[styles.modalBtn, styles.modalBtnSubmit, isSaving && styles.modalBtnDisabled]} 
                onPress={handleSaveLesson}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.modalBtnSubmitText}>
                    {editingLesson ? 'Lưu' : 'Tạo'}
                  </Text>
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
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1D26' },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#0066FF' },
  tabText: { fontSize: 16, fontWeight: '600' },
  tabTextActive: { color: '#0066FF' },
  listContent: { padding: 24, paddingBottom: 100 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardSubtitle: { fontSize: 13 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 16 },
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
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  modalInput: {
    borderWidth: 1,
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
