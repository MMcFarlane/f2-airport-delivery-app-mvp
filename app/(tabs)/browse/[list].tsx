import { useLocalSearchParams } from 'expo-router';

import { FeaturedList } from '@/src/components/browse/FeaturedList';
import { RestaurantList } from '@/src/components/browse/RestaurantList';
import { SpecialsList } from '@/src/components/browse/SpecialsList';
import { LaterScreen } from '@/src/components/ui/LaterScreen';

export default function CatalogListScreen() {
  const params = useLocalSearchParams<{ list: string; q?: string; hub?: string; category?: string }>();
  const key = first(params.list);
  const q = first(params.q);
  const hub = first(params.hub);
  const category = first(params.category);
  const stateKey = `${key}:${q}:${hub}:${category}`;
  const incoming = { initialQuery: q, initialHub: hub, initialCategory: category };

  if (key === 'restaurants') return <RestaurantList key={stateKey} {...incoming} />;
  if (key === 'featured') return <FeaturedList key={stateKey} {...incoming} />;
  if (key === 'specials') return <SpecialsList key={stateKey} {...incoming} />;
  return <LaterScreen title="Browse" body="That list is not in the catalog." />;
}

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}
