import { usePathname } from 'expo-router';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { TripSheet } from '@/src/components/trip/TripSheet';
import type { SaveTripInput } from '@/src/data/repositories';
import type { Trip } from '@/src/domain';

import { useDepartures } from './useDepartures';
import { useProfile } from './useProfile';
import { useTrip } from './useTrip';

type TripSession = {
  trip: Trip | null;
  loading: boolean;
  error: string | null;
  openSheet: () => void;
  saveTrip: (input: SaveTripInput) => Promise<void>;
};

const TripContext = createContext<TripSession | null>(null);

export function TripProvider({ children, sheetEnabled = true }: { children: ReactNode; sheetEnabled?: boolean }) {
  const { trip, loading, error, saveTrip: persistTrip } = useTrip();
  const profileState = useProfile();
  const departures = useDepartures();
  const [requested, setRequested] = useState(false);
  const pathname = usePathname();
  const visible = sheetEnabled && pathname !== '/welcome' && (requested || (!loading && trip === null));

  const saveTrip = useCallback(
    async (input: SaveTripInput) => {
      await persistTrip(input);
      setRequested(false);
    },
    [persistTrip],
  );

  const openSheet = useCallback(() => setRequested(true), []);

  const value = useMemo<TripSession>(
    () => ({
      trip,
      loading,
      error,
      openSheet,
      saveTrip,
    }),
    [trip, loading, error, openSheet, saveTrip],
  );

  return (
    <TripContext.Provider value={value}>
      <View style={styles.host}>
        {children}
        {visible ? (
          <TripSheet
            key={trip?.departureAt ?? 'new'}
            trip={trip}
            departures={departures.value}
            defaultName={profileState.profile?.name ?? 'Jordan'}
            onSave={saveTrip}
          />
        ) : null}
      </View>
    </TripContext.Provider>
  );
}

export function useTripSession(): TripSession {
  const session = useContext(TripContext);
  if (!session) {
    throw new Error('useTripSession must be used inside TripProvider');
  }
  return session;
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
