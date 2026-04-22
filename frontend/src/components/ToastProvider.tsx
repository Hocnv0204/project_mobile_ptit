import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Portal } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type ToastType = 'info' | 'success' | 'warning' | 'error';

export type ToastOptions = {
  type?: ToastType;
  durationMs?: number;
  actionLabel?: string;
  onActionPress?: () => void;
};

type ToastContextValue = {
  show: (message: string, options?: ToastOptions) => void;
  hide: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function typeColors(type: ToastType) {
  switch (type) {
    case 'success':
      return { bg: '#16A34A', fg: '#FFFFFF' };
    case 'warning':
      return { bg: '#F59E0B', fg: '#111827' };
    case 'error':
      return { bg: '#EF4444', fg: '#FFFFFF' };
    case 'info':
    default:
      return { bg: '#2563EB', fg: '#FFFFFF' };
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');
  const [durationMs, setDurationMs] = useState<number>(2500);
  const [actionLabel, setActionLabel] = useState<string | undefined>(undefined);
  const [onActionPress, setOnActionPress] = useState<(() => void) | undefined>(undefined);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const animateOut = useCallback((onDone?: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => { onDone?.(); });
  }, [opacity, translateY]);

  const hide = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    animateOut(() => setVisible(false));
  }, [animateOut]);

  const show = useCallback((msg: string, options?: ToastOptions) => {
    const t = options?.type ?? 'info';
    const d = options?.durationMs ?? 2500;

    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }

    setMessage(msg);
    setType(t);
    setDurationMs(d);
    setActionLabel(options?.actionLabel);
    setOnActionPress(() => options?.onActionPress);
    setVisible(true);

    translateY.setValue(-120);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8, tension: 60 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    hideTimer.current = setTimeout(() => {
      animateOut(() => setVisible(false));
    }, d);
  }, [animateOut, opacity, translateY]);

  const value = useMemo<ToastContextValue>(() => ({ show, hide }), [show, hide]);

  const colors = typeColors(type);
  const iconName =
    type === 'success' ? 'check-circle' :
    type === 'error'   ? 'close-circle' :
    type === 'warning' ? 'alert-circle' :
                         'information';

  return (
    <ToastContext.Provider value={value}>
      {children}
      {visible && (
        <Portal>
          <View
            pointerEvents="box-none"
            style={[
              styles.portalWrap,
              { top: insets.top + (Platform.OS === 'web' ? 16 : 8) },
            ]}
          >
            <Animated.View
              style={[
                styles.toast,
                { backgroundColor: colors.bg, transform: [{ translateY }], opacity },
              ]}
            >
              <MaterialCommunityIcons
                name={iconName as any}
                size={20}
                color={colors.fg}
                style={styles.icon}
              />
              <Text style={[styles.message, { color: colors.fg }]} numberOfLines={4}>
                {message}
              </Text>
              {actionLabel ? (
                <Pressable
                  onPress={() => { hide(); onActionPress?.(); }}
                  style={styles.action}
                >
                  <Text style={[styles.actionText, { color: colors.fg }]}>{actionLabel}</Text>
                </Pressable>
              ) : (
                <Pressable onPress={hide} style={styles.closeBtn} hitSlop={8}>
                  <MaterialCommunityIcons name="close" size={18} color={colors.fg} />
                </Pressable>
              )}
            </Animated.View>
          </View>
        </Portal>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  portalWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 520,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  icon: {
    marginRight: 10,
    flexShrink: 0,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  action: {
    marginLeft: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  closeBtn: {
    marginLeft: 10,
  },
});
