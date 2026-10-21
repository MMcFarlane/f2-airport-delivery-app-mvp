import Constants from 'expo-constants';

/** True when GOOGLE_MAPS_API_KEY was set for this build. The key itself never reaches JavaScript. */
export function googleMapsConfigured(): boolean {
  const extra = Constants.expoConfig?.extra;
  return Boolean(extra && typeof extra === 'object' && 'googleMapsConfigured' in extra && extra.googleMapsConfigured === true);
}
