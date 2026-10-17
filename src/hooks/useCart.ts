import { useCallback } from 'react';

import { createDataSource } from '@/src/data';
import type { AddCartLineInput } from '@/src/data/repositories';

import { useAsyncValue } from './useAsyncValue';

export function useCart() {
  const { value: cart, setValue, loading, error, reload } = useAsyncValue(async () => {
    const data = await createDataSource();
    return data.cart.getCart();
  }, null);

  const addLine = useCallback(
    async (input: AddCartLineInput) => {
      const data = await createDataSource();
      const next = await data.cart.addLine(input);
      setValue(next);
      return next;
    },
    [setValue],
  );

  const setQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      const data = await createDataSource();
      const next = await data.cart.setQuantity(itemId, quantity);
      setValue(next);
      return next;
    },
    [setValue],
  );

  const setLineDiscount = useCallback(
    async (itemId: string, code: string | null) => {
      const data = await createDataSource();
      const next = await data.cart.setLineDiscount(itemId, code);
      setValue(next);
      return next;
    },
    [setValue],
  );

  const setTip = useCallback(
    async (tipCents: number) => {
      const data = await createDataSource();
      const next = await data.cart.setTip(tipCents);
      setValue(next);
      return next;
    },
    [setValue],
  );

  const clear = useCallback(async () => {
    const data = await createDataSource();
    const next = await data.cart.clear();
    setValue(next);
    return next;
  }, [setValue]);

  return { cart, loading, error, reload, addLine, setQuantity, setLineDiscount, setTip, clear };
}
