/** Web / server OAuth client (dùng cho Expo web & fallback native). */
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ||
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
  '35790031845-lg7v97e8m39912hadbctj60o1gv2qc3d.apps.googleusercontent.com';

/** Android OAuth client (Google Cloud Console → Android). Nếu trống, dùng web client để dev. */
export const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || GOOGLE_WEB_CLIENT_ID;

export const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || GOOGLE_WEB_CLIENT_ID;

