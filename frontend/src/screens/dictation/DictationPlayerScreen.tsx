import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  ActivityIndicator, Alert, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { dictationApi, DictationSegment, DictationItem } from '../../api/dictationApi';

const { width } = Dimensions.get('window');
const VIDEO_HEIGHT = Math.round((width * 9) / 16); // 16:9

type SegmentState = 'locked' | 'active' | 'correct' | 'wrong';

/** Extract YouTube video ID from any YouTube URL format */
function extractVideoId(url: string): string | null {
  const m = url?.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/v\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

/** Minimal HTML page with YouTube IFrame API embedded */
function buildPlayerHtml(videoId: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:100%; height:100%; background:#000; overflow:hidden; }
    #player { width:100%; height:100%; }
  </style>
</head>
<body>
<div id="player"></div>
<script>
  var player;

  // Receive commands from React Native
  function onCmd(e) {
    try {
      var cmd = JSON.parse(e.data);
      if (!player || typeof player.seekTo !== 'function') return;
      if (cmd.action === 'seekTo') {
        player.seekTo(cmd.time, true);
        player.playVideo();
      } else if (cmd.action === 'pause') {
        player.pauseVideo();
      } else if (cmd.action === 'play') {
        player.playVideo();
      }
    } catch(err) {}
  }
  document.addEventListener('message', onCmd);
  window.addEventListener('message', onCmd);

  function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
      videoId: '${videoId}',
      playerVars: {
        autoplay: 0,
        controls: 1,
        rel: 0,
        modestbranding: 1,
        playsinline: 1
      },
      events: {
        onReady: function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
        },
        onStateChange: function(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'state', state: e.data }));
        }
      }
    });
  }
</script>
<script src="https://www.youtube.com/iframe_api"></script>
</body>
</html>`;
}

export default function DictationPlayerScreen({ route, navigation }: any) {
  const dictation: DictationItem = route.params?.dictation;
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);

  const [loading, setLoading] = useState(true);
  const [segments, setSegments] = useState<DictationSegment[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [userInputs, setUserInputs] = useState<string[]>([]);
  const [segmentStates, setSegmentStates] = useState<SegmentState[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const videoId = extractVideoId(dictation?.mediaUrl ?? '');

  // ── Load segments + progress ──
  useEffect(() => {
    (async () => {
      try {
        const [segRes, progRes] = await Promise.all([
          dictationApi.getSegments(dictation.id),
          dictationApi.getProgress(dictation.id),
        ]);
        const segs: DictationSegment[] = segRes.data || [];
        setSegments(segs);

        const done = progRes.data?.completedSegments ?? 0;
        const start = Math.min(done, Math.max(segs.length - 1, 0));
        setActiveIdx(start);
        setSegmentStates(segs.map((_, i) =>
          i < done ? 'correct' : i === start ? 'active' : 'locked'
        ));
        setUserInputs(new Array(segs[start]?.answerKeys?.length ?? 0).fill(''));
      } catch (e: any) {
        Alert.alert('Lỗi', e?.message || 'Không thể tải bài nghe');
      } finally {
        setLoading(false);
      }
    })();
  }, [dictation.id]);

  // ── Seek YouTube player to segment start time ──
  const seekTo = useCallback((seg: DictationSegment | undefined) => {
    if (!seg || !playerReady || !webRef.current) return;
    webRef.current.postMessage(
      JSON.stringify({ action: 'seekTo', time: seg.startTime })
    );
  }, [playerReady]);

  // Auto-seek when active segment changes
  useEffect(() => {
    if (playerReady && segments[activeIdx]) {
      seekTo(segments[activeIdx]);
    }
  }, [activeIdx, playerReady]);

  // ── WebView messages ──
  const onMessage = useCallback((e: any) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'ready') setPlayerReady(true);
    } catch { /* ignore */ }
  }, []);

  // ── Input ──
  const handleInput = (text: string, i: number) =>
    setUserInputs(prev => { const n = [...prev]; n[i] = text; return n; });

  // ── Submit answer ──
  const handleSubmit = async () => {
    const seg = segments[activeIdx];
    if (!seg) return;
    setSubmitting(true);
    setShowAnswer(false);
    // Pause video while user types
    webRef.current?.postMessage(JSON.stringify({ action: 'pause' }));
    try {
      const res = await dictationApi.submitSegment(dictation.id, {
        sequenceOrder: seg.sequenceOrder,
        userInput: userInputs,
      });
      const { isCorrect } = res.data;
      const newStates = [...segmentStates];

      if (isCorrect) {
        newStates[activeIdx] = 'correct';
        setSegmentStates(newStates);

        const completed = newStates.filter(s => s === 'correct').length;
        await dictationApi.syncProgress({
          dictationId: dictation.id,
          currentSequence: seg.sequenceOrder + 1,
          completedSegments: completed,
        });

        if (completed >= segments.length) {
          Alert.alert('🎉 Chúc mừng!', 'Bạn đã hoàn thành bài dictation này!', [
            { text: 'Quay lại', onPress: () => navigation.goBack() },
          ]);
          return;
        }
        setTimeout(() => {
          const nextIdx = activeIdx + 1;
          if (nextIdx < segments.length) {
            newStates[nextIdx] = 'active';
            setSegmentStates([...newStates]);
            setActiveIdx(nextIdx);
            setUserInputs(new Array(segments[nextIdx]?.answerKeys?.length ?? 0).fill(''));
            setShowAnswer(false);
          }
        }, 500);
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
    const ns = [...segmentStates];
    ns[activeIdx] = 'active';
    setSegmentStates(ns);
    setUserInputs(new Array(segments[activeIdx]?.answerKeys?.length ?? 0).fill(''));
    setShowAnswer(false);
    seekTo(segments[activeIdx]);
  };

  // ── Guards ──
  if (loading) {
    return (
      <View style={[s.fill, s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={s.loadingText}>Đang tải bài nghe…</Text>
      </View>
    );
  }

  const activeSeg = segments[activeIdx];
  // blankText uses "**" as blank marker → split on /\*{2,}/
  const blankParts = activeSeg?.blankText?.split(/(\*{2,})/) ?? [];
  let blankIdx = 0;
  const completedCount = segmentStates.filter(st => st === 'correct').length;
  const pct = segments.length > 0 ? (completedCount / segments.length) * 100 : 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.fill, { paddingTop: insets.top }]}>

        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => navigation.goBack()} style={s.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1D26" />
          </Pressable>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle} numberOfLines={1}>{dictation.title}</Text>
            <Text style={s.headerSub}>{completedCount}/{segments.length} câu • {Math.round(pct)}%</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress bar */}
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: `${pct}%` as any }]} />
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── YouTube video ── */}
          {videoId ? (
            <View style={{ height: VIDEO_HEIGHT, backgroundColor: '#000' }}>
              <WebView
                ref={webRef}
                style={{ flex: 1 }}
                source={{ html: buildPlayerHtml(videoId) }}
                onMessage={onMessage}
                javaScriptEnabled
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                originWhitelist={['*']}
                scrollEnabled={false}
              />
              {/* "Nghe câu này" overlay button */}
              <Pressable style={s.listenBtn} onPress={() => seekTo(activeSeg)}>
                <MaterialCommunityIcons name="skip-backward" size={15} color="#FFF" />
                <Text style={s.listenBtnText}>Nghe câu này</Text>
              </Pressable>
            </View>
          ) : (
            <View style={[{ height: VIDEO_HEIGHT, backgroundColor: '#111' }, s.center]}>
              <MaterialCommunityIcons name="youtube" size={48} color="#FF0000" />
              <Text style={{ color: '#888', marginTop: 8 }}>Không thể tải video</Text>
            </View>
          )}

          {/* ── Dictation card ── */}
          <View style={s.card}>
            {/* Card header */}
            <View style={s.cardRow}>
              <Text style={s.cardLabel}>Câu {activeIdx + 1}</Text>
              {segmentStates[activeIdx] === 'correct' && (
                <View style={s.badgeOk}>
                  <MaterialCommunityIcons name="check" size={13} color="#FFF" />
                  <Text style={s.badgeTxt}>Đúng!</Text>
                </View>
              )}
              {segmentStates[activeIdx] === 'wrong' && (
                <View style={s.badgeErr}>
                  <MaterialCommunityIcons name="close" size={13} color="#FFF" />
                  <Text style={s.badgeTxt}>Sai</Text>
                </View>
              )}
            </View>

            {/* Blank inputs row */}
            <View style={s.blankRow}>
              {blankParts.map((part, i) => {
                if (/^\*{2,}$/.test(part)) {
                  const bi = blankIdx++;
                  const isOk = segmentStates[activeIdx] === 'correct';
                  const isErr = segmentStates[activeIdx] === 'wrong';
                  return (
                    <TextInput
                      key={`b${i}`}
                      ref={r => { inputRefs.current[bi] = r; }}
                      style={[s.blankInput, isOk && s.inputOk, isErr && s.inputErr]}
                      value={userInputs[bi] ?? ''}
                      onChangeText={t => handleInput(t, bi)}
                      placeholder="···"
                      placeholderTextColor="#BEC2CC"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={segmentStates[activeIdx] === 'active'}
                      returnKeyType={bi + 1 < (activeSeg?.answerKeys?.length ?? 0) ? 'next' : 'done'}
                      onSubmitEditing={() => inputRefs.current[bi + 1]?.focus()}
                    />
                  );
                }
                return part ? <Text key={`t${i}`} style={s.blankTxt}>{part}</Text> : null;
              })}
            </View>

            {/* Answer reveal */}
            {showAnswer && activeSeg?.englishText && (
              <View style={s.revealBox}>
                <MaterialCommunityIcons name="lightbulb-on-outline" size={16} color="#E65100" />
                <View style={{ flex: 1 }}>
                  <Text style={s.revealFull}>{activeSeg.englishText}</Text>
                  <Text style={s.revealKeys}>
                    Đáp án: {activeSeg.answerKeys?.join(', ')}
                  </Text>
                </View>
              </View>
            )}

            {/* Action buttons */}
            <View style={s.actions}>
              {segmentStates[activeIdx] === 'active' && (
                <>
                  <Pressable style={s.btnSecondary} onPress={() => seekTo(activeSeg)}>
                    <MaterialCommunityIcons name="volume-high" size={18} color="#0066FF" />
                    <Text style={s.btnSecondaryTxt}>Nghe lại</Text>
                  </Pressable>
                  <Pressable
                    style={[s.btnPrimary, (submitting || userInputs.every(v => !v.trim())) && s.btnDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting || userInputs.every(v => !v.trim())}
                  >
                    {submitting
                      ? <ActivityIndicator color="#FFF" size="small" />
                      : <><Text style={s.btnPrimaryTxt}>Kiểm tra</Text><MaterialCommunityIcons name="check" size={18} color="#FFF" /></>
                    }
                  </Pressable>
                </>
              )}
              {segmentStates[activeIdx] === 'wrong' && (
                <Pressable style={s.btnSecondary} onPress={handleRetry}>
                  <MaterialCommunityIcons name="reload" size={18} color="#0066FF" />
                  <Text style={s.btnSecondaryTxt}>Thử lại</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* ── Segment list ── */}
          <Text style={s.sectionTitle}>Danh sách câu</Text>
          {segments.map((seg, idx) => {
            const st = segmentStates[idx];
            const isActive = idx === activeIdx;
            return (
              <Pressable
                key={seg.id}
                style={[s.segItem, isActive && s.segItemActive]}
                onPress={() => {
                  setActiveIdx(idx);
                  setUserInputs(new Array(seg.answerKeys?.length ?? 0).fill(''));
                  setShowAnswer(false);
                }}
              >
                <View style={[s.dot, st === 'correct' && s.dotOk, isActive && s.dotActive]}>
                  {st === 'correct'
                    ? <MaterialCommunityIcons name="check" size={11} color="#FFF" />
                    : <Text style={[s.dotTxt, isActive && { color: '#FFF' }]}>{idx + 1}</Text>
                  }
                </View>
                <Text style={[s.segTxt, st === 'locked' && s.segLocked]} numberOfLines={1}>
                  {st === 'correct'
                    ? seg.blankText?.replace(/\*{2,}/g, '___') ?? `Câu ${idx + 1}`
                    : `Câu ${idx + 1}`}
                </Text>
                {isActive && <MaterialCommunityIcons name="chevron-right" size={16} color="#0066FF" />}
              </Pressable>
            );
          })}

          <View style={{ height: 48 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#70778C' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#1A1D26' },
  headerSub: { fontSize: 12, color: '#70778C', marginTop: 1 },

  progressBg: { height: 3, backgroundColor: '#E8EAF0' },
  progressFill: { height: '100%', backgroundColor: '#0066FF' },

  scroll: { paddingBottom: 16 },

  // Listen overlay
  listenBtn: {
    position: 'absolute', bottom: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,102,255,0.88)',
    paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20,
  },
  listenBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },

  // Dictation card
  card: {
    margin: 16, marginTop: 12, backgroundColor: '#FFF', borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardLabel: { fontSize: 14, fontWeight: '700', color: '#1A1D26' },
  badgeOk: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#4CAF50', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeErr: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F44336', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTxt: { color: '#FFF', fontSize: 12, fontWeight: '600' },

  blankRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginBottom: 16 },
  blankTxt: { fontSize: 16, color: '#1A1D26', lineHeight: 26 },
  blankInput: {
    borderBottomWidth: 2, borderBottomColor: '#0066FF',
    minWidth: 70, paddingHorizontal: 6, paddingBottom: 2,
    fontSize: 16, fontWeight: '600', color: '#0066FF', textAlign: 'center',
  },
  inputOk: { borderBottomColor: '#4CAF50', color: '#4CAF50', backgroundColor: '#E8F5E9' },
  inputErr: { borderBottomColor: '#F44336', color: '#F44336', backgroundColor: '#FFEBEE' },

  revealBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#FFF8E1', borderRadius: 10, padding: 12, marginBottom: 14,
  },
  revealFull: { fontSize: 14, color: '#1A1D26', lineHeight: 20, marginBottom: 4 },
  revealKeys: { fontSize: 13, color: '#E65100', fontWeight: '600' },

  actions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, backgroundColor: '#0066FF' },
  btnPrimaryTxt: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  btnDisabled: { backgroundColor: '#A0C2FF' },
  btnSecondary: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#EBF3FF' },
  btnSecondaryTxt: { color: '#0066FF', fontSize: 14, fontWeight: '600' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1D26', marginHorizontal: 16, marginBottom: 10 },
  segItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginBottom: 8, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EEF0F6' },
  segItemActive: { borderColor: '#0066FF', backgroundColor: '#F0F5FF' },
  dot: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#EEF0F6', justifyContent: 'center', alignItems: 'center' },
  dotOk: { backgroundColor: '#4CAF50' },
  dotActive: { backgroundColor: '#0066FF' },
  dotTxt: { fontSize: 11, fontWeight: '700', color: '#70778C' },
  segTxt: { flex: 1, fontSize: 13, color: '#1A1D26' },
  segLocked: { color: '#C4C8D4' },
});
