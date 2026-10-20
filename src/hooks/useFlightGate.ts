import { useCallback, useEffect, useRef, useState } from 'react';

import { createDataSource } from '@/src/data';
import type { SaveTripInput } from '@/src/data/repositories';
import type { FlightGate, Trip } from '@/src/domain';

export type GateLookup = {
  flightNumber: string;
  state: 'checking' | 'found' | 'none';
  gate: FlightGate | null;
};

/** One SkyLink flight_status lookup per picked flight. The repository caches answers for a few minutes. */
export function useFlightGate() {
  const [lookup, setLookup] = useState<GateLookup | null>(null);
  const latest = useRef<string | null>(null);

  const check = useCallback(async (flightNumber: string): Promise<FlightGate | null> => {
    latest.current = flightNumber;
    setLookup({ flightNumber, state: 'checking', gate: null });
    let gate: FlightGate | null = null;
    try {
      const data = await createDataSource();
      gate = await data.flights.departureGate(flightNumber);
    } catch {
      gate = null;
    }
    // A newer pick replaced this one while SkyLink answered.
    if (latest.current !== flightNumber) return null;
    setLookup({ flightNumber, state: gate?.gate ? 'found' : 'none', gate });
    return gate;
  }, []);

  return { lookup, check };
}

/**
 * Gates are often published only hours before departure. On launch, a saved trip whose gate came
 * from SkyLink is checked again and updated when the gate changed. A gate the passenger typed is never replaced.
 */
export function useSavedTripGate(trip: Trip | null, save: (input: SaveTripInput) => Promise<unknown>) {
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current || !trip) return;
    checked.current = true;
    const flightNumber = trip.flightNumber;
    if (!flightNumber || trip.gateSource !== 'skylink') return;
    if (Date.parse(trip.departureAt) <= Date.now()) return;

    void (async () => {
      try {
        const data = await createDataSource();
        const found = await data.flights.departureGate(flightNumber);
        if (!found?.gate || found.gate === trip.gate) return;
        await save({ ...trip, gate: found.gate, gateSource: 'skylink', flightStatus: found.status ?? trip.flightStatus });
      } catch (caught) {
        console.warn(caught instanceof Error ? caught.message : 'Could not refresh the trip gate.');
      }
    })();
  }, [trip, save]);
}
