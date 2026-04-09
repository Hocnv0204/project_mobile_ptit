import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

const FEATURES = [
  { icon: 'fire', label: 'Streak', color: '#FF6B00', bg: '#2A1A0A' },
  { icon: 'book-open-variant', label: 'Vocabulary', color: '#6C63FF', bg: '#1A1A2E' },
  { icon: 'robot', label: 'AI Lesson', color: '#4ECDC4', bg: '#0A1F1F' },
  { icon: 'headphones', label: 'Podcast', color: '#FF6B6B', bg: '#2A0F0F' },
];

interface Props {
  onGetStarted?: () => void;
  onLogin?: () => void;
}

export default function WelcomeScreen({ onGetStarted, onLogin }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      {/* Background */}
      <LinearGradient
        colors={['rgba(108,99,255,0.18)', 'rgba(78,205,196,0.10)', 'rgba(15,15,26,0)']}
        start={{ x: 0.15, y: 0.05 }}
        end={{ x: 0.85, y: 0.95 }}
        style={styles.bgGradient}
        pointerEvents="none"
      />
      <View style={styles.blob1} pointerEvents="none" />
      <View style={styles.blob2} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: Math.max(insets.top + 20, 56),
            paddingBottom: Math.max(insets.bottom + 20, 32),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBadge}
          >
            <MaterialCommunityIcons name="translate" size={28} color={Colors.textPrimary} />
          </LinearGradient>
          <Text style={styles.appName}>LinguaBoost</Text>
          <Text style={styles.tagline}>Học tiếng Anh thông minh, theo đúng nhịp của bạn</Text>
        </View>

        {/* Hero */}
        <LinearGradient
          colors={['rgba(108,99,255,0.16)', 'rgba(78,205,196,0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroIconWrap}>
            <MaterialCommunityIcons name="school-outline" size={28} color={Colors.textPrimary} />
          </View>

          <Text style={styles.heroTitle}>Bắt đầu hành trình{'\n'}tiếng Anh mỗi ngày</Text>
          <Text style={styles.heroSubtitle}>
            Từ vựng, luyện nghe, và bài học với AI — gọn gàng trong một ứng dụng.
          </Text>

          <View style={styles.featuresGrid}>
            {FEATURES.map((feat) => (
              <View key={feat.label} style={[styles.featureChip, { backgroundColor: feat.bg }]}>
                <MaterialCommunityIcons name={feat.icon as any} size={20} color={feat.color} />
                <Text style={[styles.featureLabel, { color: feat.color }]}>{feat.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* CTA Buttons */}
        <View style={styles.actions}>
          <Pressable
            onPress={onGetStarted}
            disabled={!onGetStarted}
            style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Bắt đầu ngay"
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnPrimary}
            >
              <Text style={styles.btnPrimaryText}>Bắt đầu ngay</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color={Colors.textPrimary} />
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={onLogin}
            disabled={!onLogin}
            style={({ pressed }) => [
              styles.btnSecondary,
              pressed && styles.pressedSecondary,
              !onLogin && styles.disabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Đăng nhập"
          >
            <Text style={styles.btnSecondaryText}>Đã có tài khoản?</Text>
            <Text style={styles.btnSecondaryLink}>Đăng nhập</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>PTIT · 2025</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bgGradient: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    height: 520,
  },
  container: {
    paddingHorizontal: 24,
  },

  // Decoration blobs
  blob1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(108,99,255,0.12)',
    top: -60,
    right: -80,
  },
  blob2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(78,205,196,0.08)',
    bottom: 80,
    left: -60,
  },

  // Header
  header: { alignItems: 'center', marginBottom: 22 },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  appName: {
    fontSize: Typography.fontSize['4xl'],
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 320,
  },

  // Hero
  heroCard: {
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.2)',
    backgroundColor: 'rgba(26,26,46,0.35)',
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(108,99,255,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.28)',
  },
  heroTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 30,
  },
  heroSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 320,
  },

  // Features
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginTop: 16,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  featureLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
  },

  // Buttons
  actions: { gap: 12, marginTop: 18 },
  pressable: { borderRadius: 16 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  btnPrimaryText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(26,26,46,0.20)',
  },
  pressedSecondary: { opacity: 0.9 },
  disabled: { opacity: 0.55 },
  btnSecondaryText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  btnSecondaryLink: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },

  footer: {
    textAlign: 'center',
    color: Colors.textDisabled,
    fontSize: 11,
    marginTop: 18,
  },
});
