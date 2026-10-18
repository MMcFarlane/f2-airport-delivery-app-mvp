import { useMemo } from 'react';

import { demoOrderingNow, formatClock, itemFits, spareMinutes, timeWindow, type Trip } from '@/src/domain';

export function useOrderingWindow(trip: Trip | null) {
  return useMemo(() => {
    if (!trip) return null;
    const departureAt = new Date(trip.departureAt);
    const now = demoOrderingNow(departureAt);
    const { boardingAt, deliverBy } = timeWindow(departureAt);
    return {
      now,
      deliverByClock: formatClock(deliverBy),
      boardingClock: formatClock(boardingAt),
      departureClock: formatClock(departureAt),
      minutesLeft: Math.max(0, spareMinutes(deliverBy, now)),
      fits: (prepMinutes: number) => itemFits(now, prepMinutes, deliverBy),
    };
  }, [trip]);
}
