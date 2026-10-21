import { useLocalSearchParams } from 'expo-router';

import { CourierView } from '@/src/components/courier/CourierView';

export default function CourierRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return <CourierView key={id} id={id ?? ''} />;
}
