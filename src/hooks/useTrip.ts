import { useCallback } from 'react';

import { createDataSource } from '@/src/data';
import type { SaveTripInput } from '@/src/data/repositories';

import { useAsyncValue } from './useAsyncValue';

export function useTrip() {
  const { value: trip, setValue, loading, error, reload } = useAsyncValue(async () => {
    const data = await createDataSource();
    return data.trip.getTrip();
  }, null);

  const saveTrip = useCallback(
    async (input: SaveTripInput) => {
      const data = await createDataSource();
      const saved = await data.trip.saveTrip(input);
      setValue(saved);
      return saved;
    },
    [setValue],
  );

  return { trip, loading, error, reload, saveTrip };
}
