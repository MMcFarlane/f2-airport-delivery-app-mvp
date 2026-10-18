import { useLocalSearchParams } from 'expo-router';

import { FeaturedList } from '@/src/components/browse/FeaturedList';
import { RestaurantList } from '@/src/components/browse/RestaurantList';
import { SpecialsList } from '@/src/components/browse/SpecialsList';
import { LaterScreen } from '@/src/components/ui/LaterScreen';

export default function CatalogListScreen() {
  const params = useLocalSearchParams<{ list: string }>();
  const key = Array.isArray(params.list) ? params.list[0] : params.list;

  if (key === 'restaurants') return <RestaurantList />;
  if (key === 'featured') return <FeaturedList />;
  if (key === 'specials') return <SpecialsList />;
  return <LaterScreen title="Browse" body="That list is not in the catalog." />;
}
