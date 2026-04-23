import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  ActivityIndicator, Alert, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { dictationApi, DictationSegment, DictationProgress, DictationItem } from '../../api/dictationApi';

const { width } = Dimensions.get('window');

type SegmentState = 'locked' | 'active' | 'correct' | 'wrong';

export default function DictationPlayerScreen({ route, navigation }: any) {
  const dictation: DictationItem = route.params?.dictation;
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [segments, setSegments] = useState<DictationSegment[]>([]);
  const [progress, setProgress] = useState<DictationProgress | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [userInputs, setUserInputs] = useState<string[]>([]);
  const [segmentStates, setSegmentStates] = useState<SegmentState[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  // Audio
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // ── Load data ──
  useEffect(() => {
    (async () => {
      try {
        const [segRes, progRes] = await Promise.all([
          dictationApi.getSegments(dictation.id),
          dictationApi.getProgress(dictation.id),
        ]);
        const segs = segRes.data || [];
        setSegments(segs);
        setProgress(progRes.data);

        const startIdx = Math.max(0, (progRes.data?.completedSegments ?? 0));
        const clamped = Math.min(startIdx, segs.length - 1);
        setActiveIdx(clamped);

        const states: SegmentState[] = segs.map((_, i) =>
          i < (progRes.data?.completedSegments ?? 0) ? 'correct' : i === clamped ? 'active' : 'locked'
        );
        setSegmentStates(states);
        setUserInputs(new Array(segs[clamped]?.answerKeys?.length ?? 0).fill(''));
      } catch (e: any) {
        Alert.alert('Lỗi', e?.message || 'Không thể tải bài nghe');
      } finally {
        setLoading(false);
      }
    })();
    return () => { soundRef.current?.unloadAsync(); };
  }, [dictation.id]);

  // ── Audio helpers ──
  const loadAndPlaySegment = useCallback(async (seg: DictationSegment) => {
    if (!dictation.mediaUrl) return;
    try {
      if (soundRef.current) { await soundRef.current.unloadAsync(); }
      const { sound } = await Audio.Sound.createAsync(
        { uri: dictation.mediaUrl },
        { positionMillis: (seg.startTime ?? 0) * 1000, shouldPlay: true }
      );
      soundRef.current = sound;
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        setPositionMs(status.positionMillis);
        setDurationMs(status.durationMillis ?? 0);
        if (status.positionMillis >= (seg.endTime ?? 999999) * 1000) {
          sound.pauseAsync();
          setIsPlaying(false);
        }
        if (status.didJustFinish) setIsPlaying(false);
      });
    } catch { /* ignore audio errors */ }
  }, [dictation.mediaUrl]);

  const togglePlay = async () => {
    if (!soundRef.current) {
      if (segments[activeIdx]) loadAndPlaySegment(segments[activeIdx]);
      return;
    }
    if (isPlaying) { await soundRef.current.pauseAsync(); setIsPlaying(false); }
    else { await soundRef.current.playAsync(); setIsPlaying(true); }
  };

  const replaySegment = () => {
    if (segments[activeIdx]) loadAndPlaySegment(segments[activeIdx]);
  };

  // ── Input handling ──
  const handleInputChange = (text: string, idx: number) => {
    setUserInputs(prev => { const n = [...prev]; n[idx] = text; return n; });
  };

  // ── Submit answer ──
  const handleSubmit = async () => {
    const seg = segments[activeIdx];
    if (!seg) return;
    setSubmitting(true);
    setShowAnswer(false);
    try {
      const res = await dictationApi.submitSegment(dictation.id, {
        sequenceOrder: seg.sequenceOrder,
        userInput: userInputs,
      });
      const result = res.data;
      const newStates = [...segmentStates];

      if (result.isCorrect) {
        newStates[activeIdx] = 'correct';
        setSegmentStates(newStates);

        // Sync progress
        const completed = newStates.filter(s => s === 'correct').length;
        await dictationApi.syncProgress({
          dictationId: dictation.id,
          currentSequence: seg.sequenceOrder + 1,
          completedSegments: completed,
        });

        // Check if all done
        if (completed >= segments.length) {
          Alert.alert('🎉 Chúc mừng!', 'Bạn đã hoàn thành bài dictation này!', [
            { text: 'Quay lại', onPress: () => navigation.goBack() },
          ]);
          return;
        }

        // Move to next
        setTimeout(() => {
          const nextIdx = activeIdx + 1;
          if (nextIdx < segments.length) {
            newStates[nextIdx] = 'active';
            setSegmentStates(newStates);
            setActiveIdx(nextIdx);
            setUserInputs(new Array(segments[nextIdx]?.answerKeys?.length ?? 0).fill(''));
            setShowAnswer(false);
          }
        }, 600);
      } else {
        newStates[activeIdx] = 'wrong';
        setSegmentStates(newStates);
        setShowAnswer(true);
      }
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể kiểm tra đáp án');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    const newStates = [...segmentStates];
    newStates[activeIdx] = 'active';
    setSegmentStates(newStates);
    setUserInputs(new Array(segments[activeIdx]?.answerKeys?.length ?? 0).fill(''));
    setShowAnswer(false);
  };

  // ── Render ──
  if (loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={styles.loadingText}>Đang tải bài nghe...</Text>
      </View>
    );
  }

  const activeSeg = segments[activeIdx];
  const blankParts = activeSeg?.blankText?.split(/(\*{2,})/) ?? [];
  let blankIndex = 0;
  const completedCount = segmentStates.filter(s => s === 'correct').length;
  const progressPct = segments.length > 0 ? (completedCount / segments.length) * 100 : 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1D26" />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{dictation.title}</Text>
            <Text style={styles.headerSub}>
              {completedCount}/{segments.length} câu • {Math.round(progressPct)}%
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Audio controls */}
          <View style={styles.audioCard}>
            <View style={styles.audioControls}>
              <Pressable onPress={replaySegment} style={styles.audioBtn}>
                <MaterialCommunityIcons name="replay" size={22} color="#70778C" />
              </Pressable>
              <Pressable onPress={togglePlay} style={styles.playBtn}>
                <MaterialCommunityIcons
                  name={isPlaying ? 'pause' : 'play'}
                  size={32}
                  color="#FFF"
                />
              </Pressable>
              <Pressable onPress={replaySegment} style={styles.audioBtn}>
                <MaterialCommunityIcons name="skip-forward" size={22} color="#70778C" />
              </Pressable>
            </View>
            <Text style={styles.audioHint}>
              🎧 Nghe đoạn âm thanh và điền vào chỗ trống
            </Text>
          </View>

          {/* Active segment card */}
          <View style={styles.segmentCard}>
            <View style={styles.segmentHeader}>
              <Text style={styles.segmentLabel}>Câu {activeIdx + 1}</Text>
              {segmentStates[activeIdx] === 'correct' && (
                <View style={styles.correctBadge}>
                  <MaterialCommunityIcons name="check" size={14} color="#FFF" />
                  <Text style={styles.correctBadgeText}>Đúng!</Text>
                </View>
              )}
              {segmentStates[activeIdx] === 'wrong' && (
                <View style={styles.wrongBadge}>
                  <MaterialCommunityIcons name="close" size={14} color="#FFF" />
                  <Text style={styles.wrongBadgeText}>Sai</Text>
                </View>
              )}
            </View>

            {/* Blank text with inputs */}
            <View style={styles.blankRow}>
              {blankParts.map((part, i) => {
                if (/^\*{2,}$/.test(part)) {
                  const bIdx = blankIndex++;
                  const isCorrectState = segmentStates[activeIdx] === 'correct';
                  const isWrongState = segmentStates[activeIdx] === 'wrong';
                  return (
                    <TextInput
                      key={`blank-${i}`}
                      ref={r => { inputRefs.current[bIdx] = r; }}
                      style={[
                        styles.blankInput,
                        isCorrectState && styles.blankInputCorrect,
                        isWrongState && styles.blankInputWrong,
                      ]}
                      value={userInputs[bIdx] ?? ''}
                      onChangeText={(t) => handleInputChange(t, bIdx)}
                      placeholder="..."
                      placeholderTextColor="#C4C8D4"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={segmentStates[activeIdx] === 'active'}
                      onSubmitEditing={() => {
                        if (bIdx + 1 < (activeSeg?.answerKeys?.length ?? 0)) {
                          inputRefs.current[bIdx + 1]?.focus();
                        }
                      }}
                      returnKeyType={bIdx + 1 < (activeSeg?.answerKeys?.length ?? 0) ? 'next' : 'done'}
                    />
                  );
                }
                return part ? <Text key={`text-${i}`} style={styles.blankText}>{part}</Text> : null;
              })}
            </View>

            {/* Show correct answers when wrong */}
            {showAnswer && activeSeg?.answerKeys && (
              <View style={styles.answerReveal}>
                <MaterialCommunityIcons name="lightbulb-on-outline" size={16} color="#FF9800" />
                <Text style={styles.answerRevealText}>
                  Đáp án: {activeSeg.answerKeys.join(', ')}
                </Text>
              </View>
            )}

            {/* Action buttons */}
            <View style={styles.actionRow}>
              {segmentStates[activeIdx] === 'active' && (
                <>
                  <Pressable onPress={replaySegment} style={styles.hintBtn}>
                    <MaterialCommunityIcons name="volume-high" size={18} color="#0066FF" />
                    <Text style={styles.hintBtnText}>Nghe lại</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting || userInputs.every(v => !v.trim())}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <>
                        <Text style={styles.submitBtnText}>Kiểm tra</Text>
                        <MaterialCommunityIcons name="check" size={18} color="#FFF" />
                      </>
                    )}
                  </Pressable>
                </>
              )}
              {segmentStates[activeIdx] === 'wrong' && (
                <Pressable style={styles.retryBtn} onPress={handleRetry}>
                  <MaterialCommunityIcons name="reload" size={18} color="#0066FF" />
                  <Text style={styles.retryBtnText}>Thử lại</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Segment list */}
          <Text style={styles.sectionTitle}>Danh sách câu</Text>
          {segments.map((seg, idx) => {
            const st = segmentStates[idx];
            const isActive = idx === activeIdx;
            return (
              <Pressable
                key={seg.id}
                style={[styles.segListItem, isActive && styles.segListItemActive]}
                onPress={() => {
                  if (st === 'correct' || st === 'active') {
                    setActiveIdx(idx);
                    setUserInputs(new Array(seg.answerKeys?.length ?? 0).fill(''));
                    setShowAnswer(false);
                  }
                }}
              >
                <View style={[
                  styles.segDot,
                  st === 'correct' && styles.segDotCorrect,
                  isActive && styles.segDotActive,
                ]}>
                  {st === 'correct' ? (
                    <MaterialCommunityIcons name="check" size={12} color="#FFF" />
                  ) : (
                    <Text style={[styles.segDotText, isActive && { color: '#FFF' }]}>
                      {idx + 1}
                    </Text>
                  )}
                </View>
                <Text style={[styles.segItemText, st === 'locked' && styles.segItemLocked]} numberOfLines={1}>
                  {st === 'correct' ? seg.blankText?.replace(/\*{2,}/g, '___') ?? `Câu ${idx + 1}` : `Câu ${idx + 1}`}
                </Text>
              </Pressable>
            );
          })}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#70778C' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A1D26' },
  headerSub: { fontSize: 12, color: '#70778C', marginTop: 2 },

  progressBarBg: { height: 3, backgroundColor: '#EEF0F6' },
  progressBarFill: { height: '100%', backgroundColor: '#0066FF', borderRadius: 2 },

  scrollContent: { padding: 20 },

  // Audio
  audioCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  audioControls: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  audioBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center',
  },
  playBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#0066FF', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#0066FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  audioHint: { marginTop: 14, fontSize: 13, color: '#70778C', textAlign: 'center' },

  // Segment card
  segmentCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  segmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  segmentLabel: { fontSize: 14, fontWeight: '700', color: '#1A1D26' },
  correctBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#4CAF50', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  correctBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  wrongBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F44336', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  wrongBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '600' },

  blankRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginBottom: 16 },
  blankText: { fontSize: 16, color: '#1A1D26', lineHeight: 28 },
  blankInput: {
    borderBottomWidth: 2, borderBottomColor: '#0066FF',
    minWidth: 80, paddingHorizontal: 8, paddingVertical: 4,
    fontSize: 16, fontWeight: '600', color: '#0066FF', textAlign: 'center',
  },
  blankInputCorrect: { borderBottomColor: '#4CAF50', color: '#4CAF50', backgroundColor: '#E8F5E9' },
  blankInputWrong: { borderBottomColor: '#F44336', color: '#F44336', backgroundColor: '#FFEBEE' },

  answerReveal: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF8E1', borderRadius: 10, padding: 12, marginBottom: 16,
  },
  answerRevealText: { fontSize: 14, color: '#E65100', fontWeight: '600', flex: 1 },

  actionRow: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  hintBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#EBF3FF',
  },
  hintBtnText: { fontSize: 14, fontWeight: '600', color: '#0066FF' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, backgroundColor: '#0066FF',
  },
  submitBtnDisabled: { backgroundColor: '#A0C2FF' },
  submitBtnText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, backgroundColor: '#EBF3FF',
  },
  retryBtnText: { fontSize: 14, fontWeight: '600', color: '#0066FF' },

  // Segment list
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1D26', marginBottom: 12 },
  segListItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12,
    backgroundColor: '#FFF', marginBottom: 8,
    borderWidth: 1, borderColor: '#EEF0F6',
  },
  segListItemActive: { borderColor: '#0066FF', backgroundColor: '#F0F5FF' },
  segDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#EEF0F6', justifyContent: 'center', alignItems: 'center',
  },
  segDotCorrect: { backgroundColor: '#4CAF50' },
  segDotActive: { backgroundColor: '#0066FF' },
  segDotText: { fontSize: 12, fontWeight: '700', color: '#70778C' },
  segItemText: { flex: 1, fontSize: 14, color: '#1A1D26' },
  segItemLocked: { color: '#C4C8D4' },
});
