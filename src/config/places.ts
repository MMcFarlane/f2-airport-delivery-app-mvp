import Constants from 'expo-constants';

/** One photo per restaurant per session; covers and cards share it. */
export const PLACES_PHOTO_MAX_WIDTH_PX = 800;
export const PLACES_PHOTO_CACHE_MINUTES = 30;

const FALLBACK_BUNDLE_ID = 'com.f2delivers.wingsnack';

/**
 * The client Places key comes from GOOGLE_PLACES_CLIENT_KEY through app.config.ts. It is restricted to the
 * iOS bundle ID, so every request sends that ID. A public build should move this behind a proxy.
 */
export function placesClientKey(): string | null {
  const extra = Constants.expoConfig?.extra;
  if (!extra || typeof extra !== 'object' || !('placesClientKey' in extra)) return null;
  const key = extra.placesClientKey;
  return typeof key === 'string' && key.trim().length > 0 ? key.trim() : null;
}

export function placesBundleId(): string {
  return Constants.expoConfig?.ios?.bundleIdentifier ?? FALLBACK_BUNDLE_ID;
}
