import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { podcastApi, PodcastResponse } from '../../services/podcastApi';

const COLORS = {
  primary: '#4F46E5',
  background: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  activeItem: '#EEF2FF', // Light indigo background for active item
};

export default function PodcastDrawerContent(props: any) {
  const [podcasts, setPodcasts] = useState<PodcastResponse[]>([]);
  const [filteredPodcasts, setFilteredPodcasts] = useState<PodcastResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // The active podcast ID from state
  const activeRoute = props.state.routes[props.state.index];
  const activePodcastId = activeRoute.params?.podcastId;

  useEffect(() => {
    loadPodcasts();
  }, []);

  const loadPodcasts = async () => {
    try {
      setLoading(true);
      const data = await podcastApi.getAllPodcasts();
      setPodcasts(data);
      setFilteredPodcasts(data);
      
      // If no podcast is selected yet, navigate to the first one
      if (data.length > 0 && !activePodcastId) {
        props.navigation.navigate('PodcastPlayer', { podcastId: data[0].id });
      }
    } catch (error) {
      console.error('Failed to load podcasts', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text) {
      setFilteredPodcasts(podcasts);
      return;
    }
    const lower = text.toLowerCase();
    const filtered = podcasts.filter(
      p => p.title.toLowerCase().includes(lower) || p.description?.toLowerCase().includes(lower)
    );
    setFilteredPodcasts(filtered);
  };

  const onSelectPodcast = (id: number) => {
    props.navigation.navigate('PodcastPlayer', { podcastId: id });
    props.navigation.closeDrawer();
  };

  const renderItem = ({ item, index }: { item: PodcastResponse, index: number }) => {
    const isActive = item.id === activePodcastId;
    return (
      <TouchableOpacity 
        style={[styles.itemContainer, isActive && styles.activeItemContainer]} 
        onPress={() => onSelectPodcast(item.id)}
      >
        <View style={styles.iconContainer}>
          {isActive ? (
            <MaterialCommunityIcons name="play-circle" size={32} color={COLORS.primary} />
          ) : (
            <View style={styles.numberCircle}>
              <Text style={styles.numberText}>{index + 1}</Text>
            </View>
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.itemTitle, isActive && styles.activeText]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.itemSubtitle}>Level {item.levelId}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <MaterialCommunityIcons name="headphones" size={24} color={COLORS.primary} />
          <Text style={styles.headerTitle}>EnglishPod</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Learn English through 300+ conversations at various levels.
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search episodes..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor={COLORS.textSecondary}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredPodcasts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 16,
    paddingTop: 48, // Safe area top roughly
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: COLORS.text,
  },
  listContent: {
    paddingBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activeItemContainer: {
    backgroundColor: COLORS.activeItem,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    paddingLeft: 13, // Adjust for border
  },
  iconContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  numberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
  },
  activeText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  itemSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
