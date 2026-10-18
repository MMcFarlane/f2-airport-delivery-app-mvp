import type { ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext) => ({
  ...config,
  extra: {
    ...config.extra,
    catalogSource: catalogSourceFromEnv(),
  },
});

function catalogSourceFromEnv(): 'fixtures' | 'places' {
  if (process.env.EXPO_PUBLIC_CATALOG_SOURCE === 'places' || process.env.CATALOG_SOURCE === 'places') {
    return 'places';
  }
  return 'fixtures';
}
