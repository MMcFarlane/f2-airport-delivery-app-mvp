import Constants from 'expo-constants';

/**
 * The app fetches the ATL departures board on launch and a flight's gate when one is picked.
 * The key comes from SKYLINK_API_KEY through app.config.ts. A public build should keep this key off the device.
 */
export const SKYLINK_REFRESH_MINUTES = 15;
export const SKYLINK_GATE_CACHE_MINUTES = 5;

export function skylinkApiKey(): string | null {
  const extra = Constants.expoConfig?.extra;
  if (!extra || typeof extra !== 'object' || !('skylinkApiKey' in extra)) return null;
  const key = extra.skylinkApiKey;
  return typeof key === 'string' && key.trim().length > 0 ? key.trim() : null;
}
