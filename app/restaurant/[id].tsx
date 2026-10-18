import { useLocalSearchParams } from 'expo-router';

import { RestaurantMenu } from '@/src/components/menu/RestaurantMenu';

export default function RestaurantMenuRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return <RestaurantMenu key={id} id={id ?? ''} />;
}
