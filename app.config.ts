import type { ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext) => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim() || null;
  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      // The courier map. Without a key, iOS falls back to Apple Maps and Android shows a summary card.
      ['react-native-maps', googleMapsApiKey ? { iosGoogleMapsApiKey: googleMapsApiKey, androidGoogleMapsApiKey: googleMapsApiKey } : {}],
      ['expo-location', { locationWhenInUsePermission: 'Lets your courier find you at the gate.' }],
    ],
    extra: {
      ...config.extra,
      catalogSource: catalogSourceFromEnv(),
      // Demo only. A public build should call SkyLink through a proxy that holds this key.
      skylinkApiKey: process.env.SKYLINK_API_KEY?.trim() || null,
      // Restaurant cover photos. Restricted to the iOS bundle ID; the app sends that ID on every platform.
      placesClientKey: process.env.GOOGLE_PLACES_CLIENT_KEY?.trim() || null,
      // Only whether a key exists. The key itself is baked into the native build by the plugin above.
      googleMapsConfigured: googleMapsApiKey !== null,
    },
  };
};

function catalogSourceFromEnv(): 'fixtures' | 'places' {
  if (process.env.EXPO_PUBLIC_CATALOG_SOURCE === 'places' || process.env.CATALOG_SOURCE === 'places') {
    return 'places';
  }
  return 'fixtures';
}
