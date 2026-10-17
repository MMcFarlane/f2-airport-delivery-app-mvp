export const catalogSources = ['fixtures', 'places'] as const;

export type CatalogSource = (typeof catalogSources)[number];

export function catalogSource(): CatalogSource {
  return process.env.EXPO_PUBLIC_CATALOG_SOURCE === 'places' ? 'places' : 'fixtures';
}
