import { useMemo } from 'react';

import { demoOrderingNow, formatClock, itemFits, timeWindow, type Trip } from '@/src/domain';

export function useOrderingWindow(trip: Trip | null) {
  return useMemo(() => {
    if (!trip) return null;
    const departureAt = new Date(trip.departureAt);
    const now = demoOrderingNow(departureAt);
    const deliverBy = timeWindow(departureAt).deliverBy;
    return {
      deliverByClock: formatClock(deliverBy),
      fits: (prepMinutes: number) => itemFits(now, prepMinutes, deliverBy),
    };
  }, [trip]);
}
