import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Vocabulary } from '../../api/types';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const CARD_HEIGHT = height * 0.55;

export default function FlashcardScreen({ route, navigation }: any) {
  const { vocabularies = [] } = route.params as { vocabularies: Vocabulary[] };
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const flipRotation = useSharedValue(0);
  const swipeX = useSharedValue(0);

  const currentVocab = vocabularies[currentIndex];

  const toggleFlip = () => {
    const nextValue = isFlipped ? 0 : 180;
    flipRotation.value = withSpring(nextValue, { damping: 15 });
    setIsFlipped(!isFlipped);
  };

  const nextCard = () => {
    if (currentIndex < vocabularies.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetCard();
    } else {
      navigation.goBack();
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      resetCard();
    }
  };

  const resetCard = () => {
    flipRotation.value = 0;
    swipeX.value = 0;
    setIsFlipped(false);
  };

  const frontStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotateY: `${flipRotation.value}deg` },
      ],
      backfaceVisibility: 'hidden',
    };
  });

  const backStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotateY: `${flipRotation.value + 180}deg` },
      ],
      backfaceVisibility: 'hidden',
    };
  });

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: swipeX.value },
        { rotateZ: `${swipeX.value / 15}deg` }
      ],
    };
  });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      swipeX.value = event.translationX;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > width * 0.3) {
        // Swiped
        if (event.translationX > 0) {
          runOnJS(prevCard)();
        } else {
          runOnJS(nextCard)();
        }
      } else {
        swipeX.value = withSpring(0);
      }
    });

  if (!vocabularies.length) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}><Text>Không có từ vựng để hiển thị.</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="close" size={28} color="#1A1D26" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${((currentIndex + 1) / vocabularies.length) * 100}%` }]} />
        </View>
        <Text style={styles.counter}>{currentIndex + 1}/{vocabularies.length}</Text>
      </View>

      <View style={styles.cardContainer}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.swipeWrapper, animatedContainerStyle]}>
            <TouchableOpacity activeOpacity={1} onPress={toggleFlip} style={styles.touchArea}>
              {/* Front Card */}
              <Animated.View style={[styles.card, styles.frontCard, frontStyle]}>
                <Text style={styles.cardLabel}>Từ vựng</Text>
                <Text style={styles.term}>{currentVocab.term}</Text>
                <Text style={styles.pronun}>{currentVocab.pronunciation}</Text>
                <View style={styles.hintBox}>
                  <MaterialCommunityIcons name="gesture-tap" size={20} color="#A0A7BA" />
                  <Text style={styles.hintText}>Chạm để xem nghĩa</Text>
                </View>
              </Animated.View>

              {/* Back Card */}
              <Animated.View style={[styles.card, styles.backCard, backStyle]}>
                <Text style={styles.cardLabel}>Ý nghĩa</Text>
                <Text style={styles.vi}>{currentVocab.vi}</Text>
                <View style={styles.divider} />
                <Text style={styles.exampleTitle}>Ví dụ:</Text>
                <Text style={styles.exampleText}>{currentVocab.example || 'N/A'}</Text>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.navBtn} onPress={prevCard} disabled={currentIndex === 0}>
          <MaterialCommunityIcons name="arrow-left" size={32} color={currentIndex === 0 ? "#E0E5ED" : "#0066FF"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.flipBtn} onPress={toggleFlip}>
          <MaterialCommunityIcons name="rotate-3d-variant" size={28} color="#FFFFFF" />
          <Text style={styles.flipBtnText}>Lật thẻ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={nextCard}>
          <MaterialCommunityIcons name="arrow-right" size={32} color="#0066FF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E5ED',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0066FF',
  },
  counter: {
    fontSize: 14,
    fontWeight: '700',
    color: '#70778C',
    width: 40,
    textAlign: 'right',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  touchArea: {
    flex: 1,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.1)',
      },
    }),
    borderWidth: 1,
    borderColor: '#EEF0F6',
  },
  frontCard: {
    // Light blue accent
  },
  backCard: {
    // Light purple accent
  },
  cardLabel: {
    position: 'absolute',
    top: 24,
    fontSize: 12,
    fontWeight: '700',
    color: '#A0A7BA',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  term: {
    fontSize: 48,
    fontWeight: '900',
    color: '#1A1D26',
    textAlign: 'center',
    marginBottom: 8,
  },
  pronun: {
    fontSize: 20,
    color: '#70778C',
    fontStyle: 'italic',
  },
  vi: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0066FF',
    textAlign: 'center',
  },
  divider: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E5ED',
    borderRadius: 2,
    marginVertical: 24,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1D26',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 16,
    color: '#70778C',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  hintBox: {
    position: 'absolute',
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hintText: {
    fontSize: 13,
    color: '#A0A7BA',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  navBtn: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1D26',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  flipBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
