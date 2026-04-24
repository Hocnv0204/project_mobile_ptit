import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { podcastApi, PodcastDetailResponse, DialogueItem, VocabItem } from '../../services/podcastApi';

const COLORS = {
  primary: '#4F46E5', // Indigo
  background: '#F9FAFB', // Light gray background
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  speakerA: '#4F46E5', // Color for speaker A
  speakerB: '#059669', // Color for speaker B
  vocabGreen: '#059669',
};

export default function PodcastPlayerScreen({ route, navigation }: any) {
  const { podcastId } = route.params || {};
  const [podcast, setPodcast] = useState<PodcastDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Audio state
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isLooping, setIsLooping] = useState(false);
  
  // UI State
  const [showTranscript, setShowTranscript] = useState(true);

  // Fetch podcast data
  useEffect(() => {
    if (podcastId) {
      loadPodcast(podcastId);
    }
  }, [podcastId]);

  const loadPodcast = async (id: number) => {
    try {
      setLoading(true);
      const data = await podcastApi.getPodcastById(id);
      setPodcast(data);
      // Initialize audio
      if (data.audioUrl) {
        await initAudio(data.audioUrl);
      }
    } catch (error) {
      console.error('Failed to load podcast', error);
    } finally {
      setLoading(false);
    }
  };

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
      // If finished, restart
      if (status.currentTime >= status.duration && status.duration > 0) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const seek = (amountMillis: number) => {
    let newPosition = status.currentTime + (amountMillis / 1000);
    if (newPosition < 0) newPosition = 0;
    if (newPosition > status.duration) newPosition = status.duration;
    player.seekTo(newPosition);
  };

  const toggleLoop = () => {
    const newLooping = !isLooping;
    player.loop = newLooping;
    setIsLooping(newLooping);
  };

  const changeSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 0.75];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    player.setPlaybackRate(nextSpeed);
    setPlaybackSpeed(nextSpeed);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return `${minutes}:${sec < 10 ? '0' : ''}${sec}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!podcast) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Select a podcast from the menu</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Level {podcast.levelId}</Text>
          </View>
          <Text style={styles.title}>{podcast.title}</Text>
        </View>

        {/* Content Box */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Transcript / Notes</Text>
            <TouchableOpacity 
              style={styles.toggleButton} 
              onPress={() => setShowTranscript(!showTranscript)}
            >
              <MaterialCommunityIcons 
                name={showTranscript ? "eye-off-outline" : "eye-outline"} 
                size={16} 
                color={COLORS.textSecondary} 
              />
              <Text style={styles.toggleText}>{showTranscript ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          {showTranscript && (
            <View style={styles.cardBody}>
              <Text style={styles.sectionTitle}>{podcast.title}</Text>
              
              {/* Dialogue */}
              {podcast.dialogues && podcast.dialogues.length > 0 ? (
                podcast.dialogues.map((item, index) => (
                  <View key={`dialogue-${item.id || index}`} style={styles.dialogueRow}>
                    <Text style={[
                      styles.speakerText, 
                      { color: item.speaker === 'A' ? COLORS.speakerA : COLORS.speakerB }
                    ]}>
                      {item.speaker}
                    </Text>
                    <Text style={styles.dialogueContent}>{item.content}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No transcript available.</Text>
              )}

              {/* Vocabulary */}
              {podcast.vocab && podcast.vocab.length > 0 && (
                <View style={styles.vocabSection}>
                  <Text style={styles.vocabTitle}>Key Vocabulary</Text>
                  {podcast.vocab.map((item, index) => (
                    <View key={`vocab-${item.id || index}`} style={styles.vocabItem}>
                      <Text style={styles.vocabTerm}>{item.term}</Text>
                      {item.wordType && (
                        <Text style={styles.vocabType}>{item.wordType}</Text>
                      )}
                      <Text style={styles.vocabDefinition}>{item.definition}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Sticky Player */}
      <View style={styles.playerContainer}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: status.duration > 0 ? `${(status.currentTime / status.duration) * 100}%` : '0%' }
              ]} 
            />
          </View>
          <View style={styles.progressHandleContainer}>
            <View style={styles.progressHandle} />
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity onPress={() => seek(-10000)} style={styles.controlIcon}>
            <MaterialCommunityIcons name="rewind-10" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => seek(-5000)} style={styles.controlIcon}>
            <MaterialCommunityIcons name="skip-previous" size={28} color={COLORS.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={togglePlayPause} style={styles.playButton}>
            <MaterialCommunityIcons 
              name={status.playing ? "pause" : "play"} 
              size={32} 
              color="#FFF" 
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => seek(5000)} style={styles.controlIcon}>
            <MaterialCommunityIcons name="skip-next" size={28} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => seek(10000)} style={styles.controlIcon}>
            <MaterialCommunityIcons name="fast-forward-10" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Secondary Controls & Time */}
        <View style={styles.secondaryControlsRow}>
          <View style={styles.sideControls}>
            <TouchableOpacity onPress={toggleLoop} style={styles.secondaryBtn}>
              <MaterialCommunityIcons 
                name="repeat" 
                size={20} 
                color={isLooping ? COLORS.primary : COLORS.textSecondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn}>
              <MaterialCommunityIcons name="arrow-right-circle-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={changeSpeed} style={styles.speedBtn}>
              <Text style={styles.speedText}>{playbackSpeed}x</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(status.currentTime)}</Text>
          <Text style={styles.timeText}>{formatTime(status.duration)}</Text>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  levelBadge: {
    backgroundColor: '#E0E7FF', // Light Indigo
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  levelText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB', // Gray 300
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  toggleText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  cardBody: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  dialogueRow: {
    marginBottom: 16,
  },
  speakerText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dialogueContent: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  vocabSection: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 24,
  },
  vocabTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  vocabItem: {
    marginBottom: 20,
  },
  vocabTerm: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.vocabGreen,
    marginBottom: 4,
  },
  vocabType: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  vocabDefinition: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  bottomPadding: {
    height: 140, // Space for the sticky player
  },
  playerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24, // Assuming safe area or standard padding
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  progressContainer: {
    height: 20,
    justifyContent: 'center',
    marginBottom: 12,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    width: '100%',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: '#60A5FA', // Blue 400
    borderRadius: 2,
  },
  progressHandleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  progressHandle: {
    width: 12,
    height: 12,
    backgroundColor: '#3B82F6', // Blue 500
    borderRadius: 6,
    marginTop: 4, // Align visually with the bar
    marginLeft: -6, // Center the handle
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  controlIcon: {
    padding: 10,
    marginHorizontal: 8,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryControlsRow: {
    alignItems: 'center',
    marginBottom: -10, // Bring it closer to time row
  },
  sideControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryBtn: {
    padding: 8,
    marginHorizontal: 4,
  },
  speedBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginHorizontal: 4,
  },
  speedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: -20, // Move up to align with secondary controls
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
