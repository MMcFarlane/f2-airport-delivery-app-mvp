import { useLocalSearchParams } from 'expo-router';

import { ItemDetail } from '@/src/components/menu/ItemDetail';

export default function ItemDetailRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return <ItemDetail key={id} id={id ?? ''} />;
}
