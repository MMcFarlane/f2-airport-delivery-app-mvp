import { useLocalSearchParams } from 'expo-router';

import { LaterScreen } from '@/src/components/ui/LaterScreen';
import { createDataSource } from '@/src/data';
import { useAsyncValue } from '@/src/hooks/useAsyncValue';

export default function RestaurantMenuRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return <RestaurantMenu key={id} id={id ?? ''} />;
}

function RestaurantMenu({ id }: { id: string }) {
  const { value, loading, error } = useAsyncValue(async () => {
    if (!id) return null;
    const data = await createDataSource();
    return data.catalog.getRestaurant(id);
  }, null);

  const title = value?.name ?? 'Menu';
  const body = error
    ? error
    : loading
      ? 'Loading this menu.'
      : value
        ? 'The menu lands in a later phase.'
        : 'That restaurant is not in the catalog.';

  return <LaterScreen title={title} body={body} />;
}
