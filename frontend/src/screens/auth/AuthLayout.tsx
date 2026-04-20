import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['rgba(108,99,255,0.18)', 'rgba(78,205,196,0.10)', 'rgba(15,15,26,0)']}
        start={{ x: 0.15, y: 0.05 }}
        end={{ x: 0.85, y: 0.95 }}
        style={styles.bgGradient}
        pointerEvents="none"
      />
      <View style={styles.blob1} pointerEvents="none" />
      <View style={styles.blob2} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  bgGradient: { position: 'absolute', left: 0, top: 0, right: 0, height: 520 },
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
});

