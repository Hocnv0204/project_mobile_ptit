import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  TextInput,
  Dimensions,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { podcastApi, PodcastResponse, PodcastDetailResponse } from '../../services/podcastApi';
import { API_BASE_URL } from '../../config/env';

// Helper: convert relative audioUrl to full HTTP URL
function resolveAudioUrl(audioUrl: string): string {
  if (!audioUrl) return '';
  // Already a full URL
  if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
    return audioUrl;
  }
  // Relative path — prepend backend base URL
  return `${API_BASE_URL}${audioUrl.startsWith('/') ? '' : '/'}${audioUrl}`;
}

const COLORS = {
  primary: '#4F46E5',
  primaryLight: '#EEF2FF',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  speakerA: '#4F46E5',
  speakerB: '#059669',
  vocabGreen: '#059669',
  progressBg: '#E5E7EB',
  progressFill: '#818CF8',
};

export default function PodcastScreen() {
  const insets = useSafeAreaInsets();

  // Podcast list
  const [podcasts, setPodcasts] = useState<PodcastResponse[]>([]);
  const [filteredPodcasts, setFilteredPodcasts] = useState<PodcastResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [listLoading, setListLoading] = useState(true);

  // Selected podcast detail
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [podcast, setPodcast] = useState<PodcastDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Audio state
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isLooping, setIsLooping] = useState(false);

  // UI State
  const [showTranscript, setShowTranscript] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  // Load list
  useEffect(() => {
    loadPodcasts();
  }, []);

  const loadPodcasts = async () => {
    try {
      setListLoading(true);
      const data = await podcastApi.getAllPodcasts();
      setPodcasts(data);
      setFilteredPodcasts(data);
      // Auto-select the first podcast
      if (data.length > 0) {
        selectPodcast(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load podcasts', error);
    } finally {
      setListLoading(false);
    }
  };

  const selectPodcast = async (id: number) => {
    if (id === selectedId) {
      setShowSidebar(false);
      return;
    }
    // Stop current audio
    player.pause();
    player.replace(null);

    setSelectedId(id);
    setShowSidebar(false);
    try {
      setDetailLoading(true);
      const data = await podcastApi.getPodcastById(id);
      setPodcast(data);
      if (data.audioUrl) {
        await initAudio(resolveAudioUrl(data.audioUrl));
      }
    } catch (error) {
      console.error('Failed to load podcast detail', error);
    } finally {
      setDetailLoading(false);
    }
  };

  // Audio
  const initAudio = async (url: string) => {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
      });
      player.replace(url);
    } catch (error) {
      console.error('Error initializing audio', error);
    }
  };

  const togglePlayPause = () => {
    if (status.playing) {
      player.pause();
    } else {
      if (status.currentTime >= status.duration && status.duration > 0) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const seek = (ms: number) => {
    let p = status.currentTime + (ms / 1000);
    if (p < 0) p = 0;
    if (p > status.duration) p = status.duration;
    player.seekTo(p);
  };

  const toggleLoop = () => {
    const next = !isLooping;
    player.loop = next;
    setIsLooping(next);
  };

  const changeSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 0.75];
    const idx = speeds.indexOf(playbackSpeed);
    const next = speeds[(idx + 1) % speeds.length];
    player.setPlaybackRate(next);
    setPlaybackSpeed(next);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const s = Math.floor(seconds);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  // Search
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text) {
      setFilteredPodcasts(podcasts);
      return;
    }
    const lower = text.toLowerCase();
    setFilteredPodcasts(
      podcasts.filter(
        (p) =>
          p.title.toLowerCase().includes(lower) ||
          p.description?.toLowerCase().includes(lower)
      )
    );
  };

  // ─── RENDER ────────────────────────────────────────────

  if (listLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 12, color: COLORS.textSecondary }}>Loading podcasts...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── HEADER BAR ── */}
      <View style={styles.headerBar}>
        <Text style={styles.headerLogo}>🎧 EnglishPod</Text>
        <TouchableOpacity onPress={() => setShowSidebar(true)} style={styles.menuBtn}>
          <MaterialCommunityIcons name="menu" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* ── BODY ── */}
      {detailLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : podcast ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Level badge + Title */}
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Level {podcast.levelId}</Text>
          </View>
          <Text style={styles.title}>{podcast.title}</Text>

          {/* Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderTitle}>Transcript / Notes</Text>
              <TouchableOpacity
                style={styles.toggleBtn}
                onPress={() => setShowTranscript(!showTranscript)}
              >
                <MaterialCommunityIcons
                  name={showTranscript ? 'eye-off-outline' : 'eye-outline'}
                  size={16}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.toggleLabel}>{showTranscript ? ' Hide' : ' Show'}</Text>
              </TouchableOpacity>
            </View>

            {showTranscript ? (
              <View style={styles.cardBody}>
                {/* Dialogues */}
                <Text style={styles.sectionTitle}>{podcast.title}</Text>
                {podcast.dialogues?.length ? (
                  podcast.dialogues.map((d, i) => (
                    <View key={`d-${d.id ?? i}`} style={styles.dialogueRow}>
                      <Text
                        style={[
                          styles.speaker,
                          { color: d.speaker === 'A' ? COLORS.speakerA : COLORS.speakerB },
                        ]}
                      >
                        {d.speaker}
                      </Text>
                      <Text style={styles.dialogueText}>{d.content}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.empty}>No transcript available.</Text>
                )}

                {/* Vocab */}
                {podcast.vocab?.length > 0 && (
                  <View style={styles.vocabSection}>
                    <Text style={styles.vocabHeading}>Key Vocabulary</Text>
                    {podcast.vocab.map((v, i) => (
                      <View key={`v-${v.id ?? i}`} style={styles.vocabItem}>
                        <Text style={styles.vocabTerm}>{v.term}</Text>
                        {v.wordType ? <Text style={styles.vocabType}>{v.wordType}</Text> : null}
                        <Text style={styles.vocabDef}>{v.definition}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.cardBodyEmpty}>
                <Text style={styles.empty}>
                  Click "Show" to view the transcript and vocabulary notes.
                </Text>
              </View>
            )}
          </View>

          {/* bottom spacer for player */}
          <View style={{ height: 200 }} />
        </ScrollView>
      ) : (
        <View style={styles.center}>
          <Text style={styles.empty}>No podcast selected</Text>
        </View>
      )}

      {/* ── STICKY PLAYER ── */}
      <View style={[styles.player, { paddingBottom: insets.bottom + 8 }]}>  
        {/* Progress bar */}
        <View style={styles.progressWrap}>
          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                { width: status.duration > 0 ? `${(status.currentTime / status.duration) * 100}%` : '0%' },
              ]}
            />
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={() => seek(-10000)}>
            <MaterialCommunityIcons name="rewind-10" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => seek(-5000)}>
            <MaterialCommunityIcons name="skip-previous" size={28} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={togglePlayPause} style={styles.playBtn}>
            <MaterialCommunityIcons
              name={status.playing ? 'pause' : 'play'}
              size={32}
              color="#FFF"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => seek(5000)}>
            <MaterialCommunityIcons name="skip-next" size={28} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => seek(10000)}>
            <MaterialCommunityIcons name="fast-forward-10" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Secondary row */}
        <View style={styles.secondaryRow}>
          <TouchableOpacity onPress={toggleLoop}>
            <MaterialCommunityIcons
              name="repeat"
              size={18}
              color={isLooping ? COLORS.primary : COLORS.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <MaterialCommunityIcons name="arrow-right-circle-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={changeSpeed} style={styles.speedBadge}>
            <Text style={styles.speedText}>{playbackSpeed}x</Text>
          </TouchableOpacity>
        </View>

        {/* Time */}
        <View style={styles.timeRow}>
          <Text style={styles.time}>{formatTime(status.currentTime)}</Text>
          <Text style={styles.time}>{formatTime(status.duration)}</Text>
        </View>
      </View>

      {/* ── SIDEBAR MODAL ── */}
      <Modal visible={showSidebar} animationType="slide" transparent onRequestClose={() => setShowSidebar(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} onPress={() => setShowSidebar(false)} />
          <View style={[styles.sidebar, { paddingTop: insets.top }]}>
            {/* Sidebar Header */}
            <View style={styles.sidebarHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="headphones" size={24} color={COLORS.primary} />
                <Text style={styles.sidebarTitle}> EnglishPod</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSidebar(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.sidebarSubtitle}>
              Learn English through 300+ conversations at various levels.
            </Text>

            {/* Search */}
            <View style={styles.searchWrap}>
              <MaterialCommunityIcons name="magnify" size={18} color={COLORS.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search episodes..."
                value={searchQuery}
                onChangeText={handleSearch}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            {/* List */}
            <FlatList
              data={filteredPodcasts}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => {
                const active = item.id === selectedId;
                return (
                  <TouchableOpacity
                    style={[styles.listItem, active && styles.listItemActive]}
                    onPress={() => selectPodcast(item.id)}
                  >
                    <View style={styles.listIcon}>
                      {active ? (
                        <MaterialCommunityIcons name="play-circle" size={32} color={COLORS.primary} />
                      ) : (
                        <View style={styles.numCircle}>
                          <Text style={styles.numText}>{index + 1}</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.listTitle, active && { color: COLORS.primary, fontWeight: 'bold' }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.listSub}>Level {item.levelId}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  /* ── Header Bar ── */
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.primaryLight,
  },
  headerLogo: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  menuBtn: { padding: 4 },

  /* ── Scroll body ── */
  scrollContent: { padding: 16 },
  levelBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  levelText: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },

  /* ── Card ── */
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cardHeaderTitle: { fontSize: 16, fontWeight: '500', color: COLORS.textSecondary },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  toggleLabel: { fontSize: 14, color: COLORS.textSecondary },
  cardBody: { padding: 16 },
  cardBodyEmpty: { padding: 24, alignItems: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },

  /* ── Dialogue ── */
  dialogueRow: { marginBottom: 14 },
  speaker: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  dialogueText: { fontSize: 16, color: COLORS.text, lineHeight: 24 },
  empty: { color: COLORS.textSecondary, fontStyle: 'italic', textAlign: 'center' },

  /* ── Vocab ── */
  vocabSection: { marginTop: 24, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 24 },
  vocabHeading: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 },
  vocabItem: { marginBottom: 18 },
  vocabTerm: { fontSize: 18, fontWeight: 'bold', color: COLORS.vocabGreen, marginBottom: 2 },
  vocabType: { fontSize: 14, color: COLORS.textSecondary, fontStyle: 'italic', marginBottom: 2 },
  vocabDef: { fontSize: 16, color: COLORS.text, lineHeight: 24 },

  /* ── Player ── */
  player: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  progressWrap: { marginBottom: 10 },
  progressBg: { height: 4, backgroundColor: COLORS.progressBg, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: COLORS.progressFill, borderRadius: 2 },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 6,
  },
  playBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 4,
  },
  speedBadge: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  speedText: { fontSize: 12, fontWeight: 'bold', color: COLORS.textSecondary },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 4 },
  time: { fontSize: 12, color: COLORS.textSecondary },

  /* ── Sidebar Modal ── */
  modalOverlay: { flex: 1, flexDirection: 'row' },
  modalDismiss: { width: SCREEN_WIDTH * 0.15, backgroundColor: 'rgba(0,0,0,0.4)' },
  sidebar: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sidebarTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  sidebarSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginVertical: 10,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  searchInput: { flex: 1, height: 40, marginLeft: 8, color: COLORS.text },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listItemActive: {
    backgroundColor: COLORS.primaryLight,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    borderRadius: 4,
    paddingLeft: 10,
  },
  listIcon: { width: 40, alignItems: 'center', marginRight: 12 },
  numCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  listTitle: { fontSize: 16, fontWeight: '500', color: COLORS.text, marginBottom: 2 },
  listSub: { fontSize: 12, color: COLORS.textSecondary },
});
