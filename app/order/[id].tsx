import { useLocalSearchParams } from 'expo-router';

import { OrderConfirmed } from '@/src/components/cart/OrderConfirmed';

export default function OrderConfirmedRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return <OrderConfirmed key={id} id={id ?? ''} />;
}
