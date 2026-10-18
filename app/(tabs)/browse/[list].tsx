import { useLocalSearchParams } from 'expo-router';

import { LaterScreen } from '@/src/components/ui/LaterScreen';

const lists = {
  restaurants: {
    title: 'Restaurants',
    body: 'Search, filters, and the full restaurant list land in a later phase.',
  },
  featured: {
    title: 'Featured items',
    body: 'Search, filters, and the full featured list land in a later phase.',
  },
  specials: {
    title: 'Specials and bundles',
    body: 'Search, filters, and the full specials list land in a later phase.',
  },
} as const;

type ListKey = keyof typeof lists;

export default function CatalogListScreen() {
  const params = useLocalSearchParams<{ list: string }>();
  const key = Array.isArray(params.list) ? params.list[0] : params.list;
  const list = isListKey(key) ? lists[key] : null;

  return <LaterScreen title={list?.title ?? 'Browse'} body={list?.body ?? 'That list is not in the catalog.'} />;
}

function isListKey(value: string | undefined): value is ListKey {
  return value === 'restaurants' || value === 'featured' || value === 'specials';
}
