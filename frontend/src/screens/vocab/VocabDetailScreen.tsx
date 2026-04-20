import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { Vocabulary } from '../../api/types';

const { width } = Dimensions.get('window');

export default function VocabDetailScreen({ route, navigation }: any) {
  const { vocab } = route.params as { vocab: Vocabulary };
  const [playing, setPlaying] = useState(false);

  const playAudio = async () => {
    if (!vocab.audioUrl) return;
    try {
      setPlaying(true);
      const { sound } = await Audio.Sound.createAsync(
        { uri: vocab.audioUrl },
        { shouldPlay: true }
      );
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlaying(false);
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Play audio error:', error);
      setPlaying(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#1A1D26" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết từ vựng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.vocabHeader}>
          <Text style={styles.term}>{vocab.term}</Text>
          <View style={styles.pronunciationRow}>
            <Text style={styles.type}>[{vocab.type}]</Text>
            <Text style={styles.pronunciation}>{vocab.pronunciation}</Text>
            <TouchableOpacity 
              style={[styles.audioBtn, playing && styles.audioBtnPlaying]} 
              onPress={playAudio}
            >
              <MaterialCommunityIcons 
                name={playing ? "volume-high" : "volume-medium"} 
                size={24} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Định nghĩa</Text>
          <View style={styles.definitionCard}>
            <Text style={styles.definitionText}>{vocab.vi}</Text>
          </View>
        </View>

        {vocab.example && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Ví dụ</Text>
            <View style={styles.exampleCard}>
              <MaterialCommunityIcons name="format-quote-open" size={24} color="#0066FF" style={styles.quoteIcon} />
              <Text style={styles.exampleText}>{vocab.example}</Text>
            </View>
          </View>
        )}

        {vocab.imageUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Hình ảnh minh họa</Text>
            <Image source={{ uri: vocab.imageUrl }} style={styles.image} resizeMode="cover" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1D26',
  },
  container: {
    padding: 24,
  },
  vocabHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  term: {
    fontSize: 40,
    fontWeight: '900',
    color: '#1A1D26',
    letterSpacing: -0.5,
  },
  pronunciationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  type: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0066FF',
    textTransform: 'uppercase',
    backgroundColor: '#F0F5FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pronunciation: {
    fontSize: 18,
    color: '#70778C',
    fontStyle: 'italic',
  },
  audioBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  audioBtnPlaying: {
    backgroundColor: '#00D1FF',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1D26',
    marginBottom: 12,
  },
  definitionCard: {
    backgroundColor: '#F8F9FD',
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0066FF',
  },
  definitionText: {
    fontSize: 18,
    color: '#1A1D26',
    lineHeight: 26,
    fontWeight: '500',
  },
  exampleCard: {
    backgroundColor: '#F0F5FF',
    padding: 20,
    borderRadius: 16,
    position: 'relative',
  },
  quoteIcon: {
    opacity: 0.2,
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 16,
    color: '#4A5568',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    backgroundColor: '#F8F9FD',
  },
});
