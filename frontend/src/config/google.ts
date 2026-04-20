import * as AuthSession from 'expo-auth-session';
import Constants, { AppOwnership, ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/** Web / server OAuth client (dùng cho Expo web & fallback native). */
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ||
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
  '35790031845-lg7v97e8m39912hadbctj60o1gv2qc3d.apps.googleusercontent.com';

/**
 * Google OAuth (Web client) chỉ cho phép redirect dạng http(s) có domain hợp lệ — không chấp nhận `exp://`.
 * Trên Expo Go, dùng proxy HTTPS của Expo để redirect khớp với Authorized redirect URIs.
 *
 * Có thể gán tay: EXPO_PUBLIC_GOOGLE_REDIRECT_URI=https://auth.expo.io/@username/slug
 * Hoặc: EXPO_PUBLIC_EXPO_PROJECT_FULL_NAME=@username/slug (không cần https://)
 */
function inferExpoProjectFullName(): string | undefined {
  const fromEnv = process.env.EXPO_PUBLIC_EXPO_PROJECT_FULL_NAME?.trim();
  if (fromEnv) return fromEnv.replace(/^\s+/, '');

  const c = Constants.expoConfig;
  if (!c) return undefined;
  if (c.originalFullName) return c.originalFullName;
  if (c.currentFullName) return c.currentFullName;
  if (c.owner && c.slug) return `@${c.owner}/${c.slug}`;
  return undefined;
}

function isRunningInExpoGo(): boolean {
  return (
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    Constants.appOwnership === AppOwnership.Expo
  );
}

function expoAuthProxyUrl(fullName: string): string {
  const name = fullName.startsWith('@') ? fullName : `@${fullName}`;
  return `https://auth.expo.io/${name}`;
}

export function resolveGoogleOAuthRedirectUri(): string | undefined {
  if (Platform.OS === 'web') return undefined;

  if (!isRunningInExpoGo()) {
    // Không dùng proxy cho standalone/emulator
    // Trả về undefined để expo-auth-session tự tạo redirect URI dạng package.name:/oauthredirect
    return undefined;
  }

  const manual = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI?.trim();
  if (manual) return manual;

  const fullName = inferExpoProjectFullName();
  if (fullName) {
    return expoAuthProxyUrl(fullName);
  }

  try {
    return AuthSession.getRedirectUrl();
  } catch (e) {
    console.warn(
      '[Google OAuth] Không tạo được URL proxy. Thêm vào .env một trong các dòng:\n' +
        '  EXPO_PUBLIC_EXPO_PROJECT_FULL_NAME=@tài-khoản-expo/linguaboost\n' +
        '  hoặc EXPO_PUBLIC_GOOGLE_REDIRECT_URI=https://auth.expo.io/@tài-khoản-expo/linguaboost\n' +
        'Hoặc chạy `npx expo login` và thêm "owner" trong app.json. Chi tiết:',
      e,
    );
    return undefined;
  }
}
