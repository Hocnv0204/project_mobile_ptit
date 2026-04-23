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
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { podcastApi, PodcastResponse, PodcastDetailResponse } from '../../services/podcastApi';
import { API_BASE_URL } from '../../config/env';
import { useAppColors } from '../../theme/useAppColors';

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

const SPEAKER_COLORS = {
  speakerA: '#4F46E5',
  speakerB: '#059669',
  vocabGreen: '#059669',
  progressFill: '#818CF8',
};

export default function PodcastScreen() {
  const insets = useSafeAreaInsets();
  const { background, surface, text, mutedText, border, primary } = useAppColors();
  const primaryLight = primary + '1A';

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
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
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
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
    setIsPlaying(false);
    setPosition(0);
    setDuration(0);

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
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: false, isLooping: false },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      if (status.isLoaded && status.durationMillis) {
        setDuration(status.durationMillis);
      }
    } catch (error) {
      console.error('Error initializing audio', error);
    }
  };

  const onPlaybackStatusUpdate = useCallback((status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish && !status.isLooping) {
        setIsPlaying(false);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const togglePlayPause = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      if (position >= duration && duration > 0) {
        await sound.setPositionAsync(0);
      }
      await sound.playAsync();
    }
  };

  const seek = async (ms: number) => {
    if (!sound) return;
    let p = position + ms;
    if (p < 0) p = 0;
    if (p > duration) p = duration;
    await sound.setPositionAsync(p);
  };

  const toggleLoop = async () => {
    if (!sound) return;
    const next = !isLooping;
    await sound.setIsLoopingAsync(next);
    setIsLooping(next);
  };

  const changeSpeed = async () => {
    if (!sound) return;
    const speeds = [1.0, 1.25, 1.5, 0.75];
    const idx = speeds.indexOf(playbackSpeed);
    const next = speeds[(idx + 1) % speeds.length];
    await sound.setRateAsync(next, true);
    setPlaybackSpeed(next);
  };

  const formatTime = (ms: number) => {
    if (isNaN(ms) || ms < 0) return '0:00';
    const s = Math.floor(ms / 1000);
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
      <View style={[styles.center, { paddingTop: insets.top, backgroundColor: background }]}>
        <ActivityIndicator size="large" color={primary} />
        <Text style={{ marginTop: 12, color: mutedText }}>Loading podcasts...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: background }]}>
      {/* ── HEADER BAR ── */}
      <View style={[styles.headerBar, { backgroundColor: surface }]}>
        <Text style={[styles.headerLogo, { color: primary }]}>🎧 EnglishPod</Text>
        <TouchableOpacity onPress={() => setShowSidebar(true)} style={styles.menuBtn}>
          <MaterialCommunityIcons name="menu" size={28} color={primary} />
        </TouchableOpacity>
      </View>

      {/* ── BODY ── */}
      {detailLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={primary} />
        </View>
      ) : podcast ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Level badge + Title */}
          <View style={[styles.levelBadge, { backgroundColor: primaryLight }]}>
            <Text style={[styles.levelText, { color: primary }]}>Level {podcast.levelId}</Text>
          </View>
          <Text style={[styles.title, { color: text }]}>{podcast.title}</Text>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
            <View style={[styles.cardHeader, { borderBottomColor: border }]}>
              <Text style={[styles.cardHeaderTitle, { color: mutedText }]}>Transcript / Notes</Text>
              <TouchableOpacity
                style={[styles.toggleBtn, { borderColor: border }]}
                onPress={() => setShowTranscript(!showTranscript)}
              >
                <MaterialCommunityIcons
                  name={showTranscript ? 'eye-off-outline' : 'eye-outline'}
                  size={16}
                  color={mutedText}
                />
                <Text style={[styles.toggleLabel, { color: mutedText }]}>{showTranscript ? ' Hide' : ' Show'}</Text>
              </TouchableOpacity>
            </View>

            {showTranscript ? (
              <View style={styles.cardBody}>
                {/* Dialogues */}
                <Text style={[styles.sectionTitle, { color: text }]}>{podcast.title}</Text>
                {podcast.dialogues?.length ? (
                  podcast.dialogues.map((d, i) => (
                    <View key={`d-${d.id ?? i}`} style={styles.dialogueRow}>
                      <Text
                        style={[
                          styles.speaker,
                          { color: d.speaker === 'A' ? SPEAKER_COLORS.speakerA : SPEAKER_COLORS.speakerB },
                        ]}
                      >
                        {d.speaker}
                      </Text>
                      <Text style={[styles.dialogueText, { color: text }]}>{d.content}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.empty, { color: mutedText }]}>No transcript available.</Text>
                )}

                {/* Vocab */}
                {podcast.vocab?.length > 0 && (
                  <View style={[styles.vocabSection, { borderTopColor: border }]}>
                    <Text style={[styles.vocabHeading, { color: text }]}>Key Vocabulary</Text>
                    {podcast.vocab.map((v, i) => (
                      <View key={`v-${v.id ?? i}`} style={styles.vocabItem}>
                        <Text style={[styles.vocabTerm, { color: SPEAKER_COLORS.vocabGreen }]}>{v.term}</Text>
                        {v.wordType ? <Text style={[styles.vocabType, { color: mutedText }]}>{v.wordType}</Text> : null}
                        <Text style={[styles.vocabDef, { color: text }]}>{v.definition}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.cardBodyEmpty}>
                <Text style={[styles.empty, { color: mutedText }]}>
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
          <Text style={[styles.empty, { color: mutedText }]}>No podcast selected</Text>
        </View>
      )}

      {/* ── STICKY PLAYER ── */}
      <View style={[styles.player, { paddingBottom: insets.bottom + 8, backgroundColor: surface, borderTopColor: border }]}>  
        {/* Progress bar */}
        <View style={styles.progressWrap}>
          <View style={[styles.progressBg, { backgroundColor: border }]}>
            <View
              style={[
                styles.progressFill,
                { width: duration > 0 ? `${(position / duration) * 100}%` : '0%' },
              ]}
            />
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={() => seek(-10000)}>
            <MaterialCommunityIcons name="rewind-10" size={22} color={mutedText} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => seek(-5000)}>
            <MaterialCommunityIcons name="skip-previous" size={28} color={mutedText} />
          </TouchableOpacity>
          <TouchableOpacity onPress={togglePlayPause} style={[styles.playBtn, { backgroundColor: primary, shadowColor: primary }]}>
            <MaterialCommunityIcons
              name={isPlaying ? 'pause' : 'play'}
              size={32}
              color="#FFF"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => seek(5000)}>
            <MaterialCommunityIcons name="skip-next" size={28} color={mutedText} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => seek(10000)}>
            <MaterialCommunityIcons name="fast-forward-10" size={22} color={mutedText} />
          </TouchableOpacity>
        </View>

        {/* Secondary row */}
        <View style={styles.secondaryRow}>
          <TouchableOpacity onPress={toggleLoop}>
            <MaterialCommunityIcons
              name="repeat"
              size={18}
              color={isLooping ? primary : mutedText}
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <MaterialCommunityIcons name="arrow-right-circle-outline" size={18} color={primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={changeSpeed} style={[styles.speedBadge, { borderColor: border }]}>
            <Text style={[styles.speedText, { color: mutedText }]}>{playbackSpeed}x</Text>
          </TouchableOpacity>
        </View>

        {/* Time */}
        <View style={styles.timeRow}>
          <Text style={[styles.time, { color: mutedText }]}>{formatTime(position)}</Text>
          <Text style={[styles.time, { color: mutedText }]}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* ── SIDEBAR MODAL ── */}
      <Modal visible={showSidebar} animationType="slide" transparent onRequestClose={() => setShowSidebar(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} onPress={() => setShowSidebar(false)} />
          <View style={[styles.sidebar, { paddingTop: insets.top, backgroundColor: background }]}>
            {/* Sidebar Header */}
            <View style={[styles.sidebarHeader, { borderBottomColor: border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="headphones" size={24} color={primary} />
                <Text style={[styles.sidebarTitle, { color: primary }]}> EnglishPod</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSidebar(false)}>
                <MaterialCommunityIcons name="close" size={24} color={mutedText} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.sidebarSubtitle, { color: mutedText }]}>
              Learn English through 300+ conversations at various levels.
            </Text>

            {/* Search */}
            <View style={[styles.searchWrap, { borderColor: border, backgroundColor: surface }]}>
              <MaterialCommunityIcons name="magnify" size={18} color={mutedText} />
              <TextInput
                style={[styles.searchInput, { color: text }]}
                placeholder="Search episodes..."
                value={searchQuery}
                onChangeText={handleSearch}
                placeholderTextColor={mutedText}
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
                    style={[
                      styles.listItem,
                      { borderBottomColor: border, backgroundColor: surface },
                      active && [styles.listItemActive, { backgroundColor: primaryLight, borderLeftColor: primary }],
                    ]}
                    onPress={() => selectPodcast(item.id)}
                  >
                    <View style={styles.listIcon}>
                      {active ? (
                        <MaterialCommunityIcons name="play-circle" size={32} color={primary} />
                      ) : (
                        <View style={[styles.numCircle, { backgroundColor: border }]}>
                          <Text style={[styles.numText, { color: mutedText }]}>{index + 1}</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.listTitle, { color: text }, active && { color: primary, fontWeight: 'bold' }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={[styles.listSub, { color: mutedText }]}>Level {item.levelId}</Text>
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
  root: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* ── Header Bar ── */
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerLogo: { fontSize: 18, fontWeight: 'bold' },
  menuBtn: { padding: 4 },

  /* ── Scroll body ── */
  scrollContent: { padding: 16 },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  levelText: { fontSize: 12, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },

  /* ── Card ── */
  card: {
    borderRadius: 12,
    borderWidth: 1,
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
  },
  cardHeaderTitle: { fontSize: 16, fontWeight: '500' },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  toggleLabel: { fontSize: 14 },
  cardBody: { padding: 16 },
  cardBodyEmpty: { padding: 24, alignItems: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },

  /* ── Dialogue ── */
  dialogueRow: { marginBottom: 14 },
  speaker: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  dialogueText: { fontSize: 16, lineHeight: 24 },
  empty: { fontStyle: 'italic', textAlign: 'center' },

  /* ── Vocab ── */
  vocabSection: { marginTop: 24, borderTopWidth: 1, paddingTop: 24 },
  vocabHeading: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  vocabItem: { marginBottom: 18 },
  vocabTerm: { fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  vocabType: { fontSize: 14, fontStyle: 'italic', marginBottom: 2 },
  vocabDef: { fontSize: 16, lineHeight: 24 },

  /* ── Player ── */
  player: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  progressWrap: { marginBottom: 10 },
  progressBg: { height: 4, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: SPEAKER_COLORS.progressFill, borderRadius: 2 },
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
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  speedText: { fontSize: 12, fontWeight: 'bold' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 4 },
  time: { fontSize: 12 },

  /* ── Sidebar Modal ── */
  modalOverlay: { flex: 1, flexDirection: 'row' },
  modalDismiss: { width: SCREEN_WIDTH * 0.15, backgroundColor: 'rgba(0,0,0,0.4)' },
  sidebar: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sidebarTitle: { fontSize: 20, fontWeight: 'bold' },
  sidebarSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginVertical: 10,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  searchInput: { flex: 1, height: 40, marginLeft: 8 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  listItemActive: {
    borderLeftWidth: 3,
    borderRadius: 4,
    paddingLeft: 10,
  },
  listIcon: { width: 40, alignItems: 'center', marginRight: 12 },
  numCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numText: { fontSize: 14, fontWeight: '600' },
  listTitle: { fontSize: 16, fontWeight: '500', marginBottom: 2 },
  listSub: { fontSize: 12 },
});
