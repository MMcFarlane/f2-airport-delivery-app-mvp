import type { ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext) => ({
  ...config,
  extra: {
    ...config.extra,
    catalogSource: catalogSourceFromEnv(),
    // Demo only. A public build should call SkyLink through a proxy that holds this key.
    skylinkApiKey: process.env.SKYLINK_API_KEY?.trim() || null,
  },
});

function catalogSourceFromEnv(): 'fixtures' | 'places' {
  if (process.env.EXPO_PUBLIC_CATALOG_SOURCE === 'places' || process.env.CATALOG_SOURCE === 'places') {
    return 'places';
  }
  return 'fixtures';
}
