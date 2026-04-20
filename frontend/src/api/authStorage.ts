import AsyncStorage from '@react-native-async-storage/async-storage';

type StoredTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

const TOKENS_KEY = 'auth.tokens.v1';

let memoryTokens: StoredTokens | null = null;

export async function getTokens(): Promise<StoredTokens> {
  if (memoryTokens) return memoryTokens;
  const raw = await AsyncStorage.getItem(TOKENS_KEY);
  if (!raw) {
    memoryTokens = { accessToken: null, refreshToken: null };
    return memoryTokens;
  }
  try {
    memoryTokens = JSON.parse(raw) as StoredTokens;
    return memoryTokens;
  } catch {
    await AsyncStorage.removeItem(TOKENS_KEY);
    memoryTokens = { accessToken: null, refreshToken: null };
    return memoryTokens;
  }
}

export async function setTokens(tokens: StoredTokens) {
  memoryTokens = tokens;
  await AsyncStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

export async function clearTokens() {
  memoryTokens = { accessToken: null, refreshToken: null };
  await AsyncStorage.removeItem(TOKENS_KEY);
}

