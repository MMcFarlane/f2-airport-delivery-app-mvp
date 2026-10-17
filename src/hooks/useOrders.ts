import { useCallback } from 'react';

import { createDataSource } from '@/src/data';
import type { CreateOrderInput } from '@/src/data/repositories';

import { useAsyncValue } from './useAsyncValue';

export function useOrders() {
  const { value: orders, setValue, loading, error, reload } = useAsyncValue(async () => {
    const data = await createDataSource();
    return data.orders.listOrders();
  }, []);

  const createOrder = useCallback(
    async (input: CreateOrderInput) => {
      const data = await createDataSource();
      const order = await data.orders.createOrder(input);
      setValue(await data.orders.listOrders());
      return order;
    },
    [setValue],
  );

  const advanceStatus = useCallback(
    async (id: string) => {
      const data = await createDataSource();
      const order = await data.orders.advanceStatus(id);
      setValue(await data.orders.listOrders());
      return order;
    },
    [setValue],
  );

  return { orders, loading, error, reload, createOrder, advanceStatus };
}
