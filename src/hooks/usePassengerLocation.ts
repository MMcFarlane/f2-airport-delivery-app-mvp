import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';

import type { PassengerFix } from '@/src/domain';

const CHECKOUT_FIX_TIMEOUT_MS = 5_000;

export type LocationAccess = 'checking' | 'granted' | 'denied' | 'blocked' | 'services-off';

/**
 * Asks for "while using" location at checkout and returns one fix.
 * Never throws and never blocks the order: denial, services off, or no indoor fix all return null.
 */
export async function capturePassengerLocation(): Promise<PassengerFix | null> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return null;
    if (!(await Location.hasServicesEnabledAsync())) return null;
    const current = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      CHECKOUT_FIX_TIMEOUT_MS,
    );
    const position = current ?? (await Location.getLastKnownPositionAsync());
    return position ? toFix(position) : null;
  } catch {
    return null;
  }
}

/** Watches the phone's location while the courier view is open. */
export function useLivePassengerLocation() {
  const [access, setAccess] = useState<LocationAccess>('checking');
  const [fix, setFix] = useState<PassengerFix | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let subscription: Location.LocationSubscription | null = null;

    void (async () => {
      try {
        const permission =
          attempt === 0 ? await Location.getForegroundPermissionsAsync() : await Location.requestForegroundPermissionsAsync();
        if (!active) return;
        if (!permission.granted) {
          setAccess(permission.canAskAgain ? 'denied' : 'blocked');
          return;
        }
        if (!(await Location.hasServicesEnabledAsync())) {
          if (active) setAccess('services-off');
          return;
        }
        setAccess('granted');
        const watch = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 5 },
          (position) => {
            if (active) setFix(toFix(position));
          },
        );
        if (active) subscription = watch;
        else watch.remove();
      } catch {
        if (active) setAccess('denied');
      }
    })();

    return () => {
      active = false;
      subscription?.remove();
    };
  }, [attempt]);

  /** Asks again, or opens Settings when the system will not show the prompt again. */
  const request = useCallback(async () => {
    if (access === 'blocked' || access === 'services-off') {
      // Web has no settings screen to open.
      await Linking.openSettings().catch(() => undefined);
      return;
    }
    setAttempt((value) => value + 1);
  }, [access]);

  return { access, fix, request };
}

function toFix(position: Location.LocationObject): PassengerFix {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracyMeters: position.coords.accuracy ?? null,
    at: new Date(position.timestamp).toISOString(),
  };
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
