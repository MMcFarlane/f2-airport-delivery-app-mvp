import { createDataSource } from '@/src/data';

import { useAsyncValue } from './useAsyncValue';

export function useDepartures() {
  return useAsyncValue(async () => {
    const data = await createDataSource();
    return data.flights.listDepartures();
  }, []);
}
