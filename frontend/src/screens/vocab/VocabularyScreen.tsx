import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { lessonVocabApi } from '../../api/lessonVocabApi';
import { vocabApi } from '../../api/vocabApi';
import { LessonVocab } from '../../api/types';
import { Routes } from '../../constants/routes';
import { useAuthStore } from '../../store/authStore';
import { useRefreshOnFocus } from '../../hooks/useRefreshOnFocus';

export default function VocabularyScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  
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
  /** Số từ cần học/ôn hôm nay theo từng lesson (API due-today-count). */
  const [dueCountByLessonId, setDueCountByLessonId] = useState<Record<number, number>>({});

  const enrichDueCounts = async (lessons: LessonVocab[]) => {
    const uid = user?.id;
    if (!uid || lessons.length === 0) return;
    try {
      const pairs = await Promise.all(
        lessons.map(async (l) => {
          try {
            const env = await vocabApi.getDueTodayCount(uid, l.id);
            const ok = Number(env?.code) === 200;
            const raw = env?.data;
            const n = ok && raw != null ? Number(raw) : 0;
            return [l.id, Number.isFinite(n) ? n : 0] as const;
          } catch {
            return [l.id, 0] as const;
          }
        }),
      );
      setDueCountByLessonId((prev) => {
        const next = { ...prev };
        for (const [id, n] of pairs) next[id] = n;
        return next;
      });
    } catch {
      /* giữ map cũ */
    }
  };

  useRefreshOnFocus(async () => {
    // Luôn refresh list hệ thống; và nếu đang ở tab personal thì refresh luôn personal
    await fetchSystemLessons();
    if (activeTab === 'personal') {
      await fetchPersonalLessons();
    }
  }, [activeTab, user?.id]);

  /** Tab Hệ thống: GET /api/lesson-vocab/system (lesson của admin theo level user đăng nhập). */
  const fetchSystemLessons = async () => {
    try {
      setLoadingSystem(true);
      const env = await lessonVocabApi.getSystemLessons();
      if (Number(env?.code) !== 200) {
        throw new Error(env?.message || 'Không thể tải danh sách bài học');
      }
      const lessons = (env.data as LessonVocab[] | undefined) ?? [];
      setSystemLessons(lessons);
      await enrichDueCounts(lessons);
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
      const lessons = res.data || [];
      setPersonalLessons(lessons);
      await enrichDueCounts(lessons);
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
    if (tab === 'system' && systemLessons.length === 0 && !loadingSystem) {
      void fetchSystemLessons();
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
        const created = res.data;
        setPersonalLessons((prev) => [...prev, created]);
        if (user?.id) await enrichDueCounts([created]);
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
              setDueCountByLessonId((prev) => {
                const next = { ...prev };
                delete next[lesson.id];
                return next;
              });
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
      style={styles.card}
      onPress={() => navigation.navigate(Routes.LESSON_DETAIL, { lesson: item, isPersonal: activeTab === 'personal' })}
    >
      <View style={styles.cardIcon}>
        <MaterialCommunityIcons name="book-open-page-variant" size={24} color="#0066FF" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSubtitle}>
          {user?.id
            ? `${dueCountByLessonId[item.id] ?? 0} từ cần học hôm nay`
            : new Date(item.createdAt).toLocaleDateString('vi-VN')}
        </Text>
      </View>
      {activeTab === 'personal' ? (
        <View style={styles.rowActions}>
          <Pressable
            style={styles.editBtn}
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
            style={styles.deleteBtn}
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
        <MaterialCommunityIcons name="chevron-right" size={24} color="#C4C8D4" />
      )}
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
          onPress={openCreateModal}
        >
          <MaterialCommunityIcons name="plus" size={30} color="#FFF" />
        </Pressable>
      )}

      {/* Create Lesson Modal */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingLesson ? 'Đổi tên bài học' : 'Tạo bài học mới'}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nhập tên bài học (VD: Động từ bất quy tắc)"
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
