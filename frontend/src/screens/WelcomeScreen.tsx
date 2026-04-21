import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  onGetStarted?: () => void;
  onLogin?: () => void;
  onExplore?: () => void;
}

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ onGetStarted, onLogin, onExplore }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Top Section - Blue Background */}
      <View style={styles.topSection}>
        <LinearGradient
          colors={['#164E8C', '#1D70B8', '#2589E6']}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Concentric Circles Background */}
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
        
        <View style={[styles.header, { marginTop: Math.max(insets.top, 40) }]}>
          <MaterialCommunityIcons name="school" size={32} color="#FFF" />
          <Text style={styles.logoText}>PTIT ENGLISH</Text>
        </View>

        <View style={styles.mascotContainer}>
          <View style={styles.mascotBg}>
            <MaterialCommunityIcons name="robot-outline" size={100} color="#FFD166" />
          </View>
        </View>
      </View>

      {/* Bottom Section - White Card */}
      <View style={[styles.bottomCard, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Text style={styles.title}>
          Tham gia ngay cùng PTIT English - Nền tảng học và luyện thi thông minh
        </Text>

        <View style={styles.actions}>
          <Pressable
            onPress={onLogin}
            style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]}
          >
            <Text style={styles.btnPrimaryText}>Đăng nhập</Text>
          </Pressable>

          <Pressable
            onPress={onGetStarted}
            style={({ pressed }) => [styles.btnSecondary, pressed && styles.pressed]}
          >
            <Text style={styles.btnSecondaryText}>Đăng ký</Text>
          </Pressable>

          <Text style={styles.orText}>hoặc</Text>

          <Pressable
            onPress={onExplore}
            style={({ pressed }) => [styles.btnSecondary, pressed && styles.pressed]}
          >
            <Text style={styles.btnSecondaryText}>Khám phá ngay</Text>
          </Pressable>
        </View>

        <Text style={styles.termsText}>
          Bằng cách tham gia, chúng tôi xác nhận bạn đã đọc và đồng ý với{' '}
          <Text style={styles.linkText}>Điều khoản & Điều kiện</Text> cùng{' '}
          <Text style={styles.linkText}>Chính sách bảo mật</Text> của PTIT English
        </Text>

        <Text style={styles.versionText}>Phiên bản: 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: { width: width * 0.8, height: width * 0.8 },
  circle2: { width: width * 1.3, height: width * 1.3 },
  circle3: { width: width * 1.8, height: width * 1.8 },
  
  header: {
    position: 'absolute',
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  mascotContainer: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  mascotBg: {
    backgroundColor: '#FFF',
    width: 160,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  bottomCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    marginTop: -24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1D26',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 24,
  },
  actions: {
    gap: 12,
  },
  btnPrimary: {
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: '#F0F5FF',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: '#0066FF',
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  orText: {
    textAlign: 'center',
    color: '#70778C',
    fontSize: 14,
    marginVertical: 4,
  },
  termsText: {
    marginTop: 24,
    fontSize: 12,
    color: '#8A92A6',
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: '#0066FF',
    fontWeight: '600',
  },
  versionText: {
    marginTop: 32,
    fontSize: 12,
    color: '#A0A7BA',
    textAlign: 'center',
  },
});
