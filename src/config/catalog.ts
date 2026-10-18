import Constants from 'expo-constants';

export const catalogSources = ['fixtures', 'places'] as const;

export type CatalogSource = (typeof catalogSources)[number];

export function catalogSource(): CatalogSource {
  const published = process.env.EXPO_PUBLIC_CATALOG_SOURCE;
  if (published === 'places' || published === 'fixtures') return published;
  return configuredCatalogSource() === 'places' ? 'places' : 'fixtures';
}

function configuredCatalogSource(): unknown {
  const extra = Constants.expoConfig?.extra;
  if (!extra || typeof extra !== 'object' || !('catalogSource' in extra)) return null;
  return extra.catalogSource;
}
