import { airport, type Concourse } from '../config/airport';

import { formatClock } from './clock';
import type { Coordinates, PassengerFix } from './types';

/** An unhurried airport walk, about 4.8 km/h. */
export const WALK_METERS_PER_MINUTE = 80;

const EARTH_RADIUS_METERS = 6_371_000;
const CONCOURSES = Object.keys(airport.concourses) as Concourse[];

export type CourierTargetSource = 'live' | 'checkout' | 'gate' | 'airport';

export type CourierTarget = {
  coordinates: Coordinates;
  source: CourierTargetSource;
  accuracyMeters: number | null;
  concourse: Concourse | null;
  locatedAt: string | null;
};

export function distanceMeters(from: Coordinates, to: Coordinates): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function walkMinutes(meters: number): number {
  return Math.max(1, Math.ceil(meters / WALK_METERS_PER_MINUTE));
}

/** "B14" → "B". Only ATL concourse letters count. */
export function concourseFromGate(gate: string): Concourse | null {
  const match = /^\s*([A-Z])\s*-?\s*\d{1,3}\s*$/i.exec(gate);
  return asConcourse(match?.[1]);
}

/** Reads a concourse out of restaurant location text such as "Concourse A" or "Near B12". */
export function concourseFromText(text: string | null): Concourse | null {
  if (!text) return null;
  const named = /\bconcourse\s+([A-Z])\b/i.exec(text);
  if (named) return asConcourse(named[1]);
  const gate = /\b([A-Z])\d{1,3}\b/i.exec(text);
  return asConcourse(gate?.[1]);
}

export function concourseCenter(concourse: Concourse | null): Coordinates {
  return concourse ? airport.concourses[concourse] : airport.center;
}

/** Restaurant coordinates when stored, otherwise the concourse named in its location text. */
export function restaurantPoint(coordinates: Coordinates | null, location: string | null): Coordinates {
  return coordinates ?? concourseCenter(concourseFromText(location));
}

/** Where the courier should walk: live fix, then the checkout fix, then the gate's concourse, then the airport. */
export function courierTarget(input: {
  live: PassengerFix | null;
  stored: PassengerFix | null;
  gate: string;
}): CourierTarget {
  const concourse = concourseFromGate(input.gate);
  const fix = input.live ?? input.stored;
  if (fix) {
    return {
      coordinates: { latitude: fix.latitude, longitude: fix.longitude },
      source: input.live ? 'live' : 'checkout',
      accuracyMeters: fix.accuracyMeters,
      concourse,
      locatedAt: fix.at,
    };
  }
  return {
    coordinates: concourseCenter(concourse),
    source: concourse ? 'gate' : 'airport',
    accuracyMeters: null,
    concourse,
    locatedAt: null,
  };
}

/** "≈ 420 m · 6 min walk". Short distances round to 10 m; a kilometer or more shows one decimal. */
export function courierDistanceLine(meters: number): string {
  const distance = meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  return `≈ ${distance} · ${walkMinutes(meters)} min walk`;
}

/** Tells the courier how much to trust the passenger pin. */
export function courierSourceLine(target: CourierTarget): string {
  const accuracy = target.accuracyMeters !== null ? ` · ±${Math.round(target.accuracyMeters)} m` : '';
  switch (target.source) {
    case 'live':
      return `Live location${accuracy}`;
    case 'checkout':
      return `Location from checkout · ${target.locatedAt ? formatClock(new Date(target.locatedAt)) : 'earlier'}${accuracy}`;
    case 'gate':
      return `Location off — showing Concourse ${target.concourse}`;
    case 'airport':
      return 'Location off — showing the airport';
  }
}

export function googleMapsDirectionsUrl(from: Coordinates, to: Coordinates): string {
  const point = (value: Coordinates) => `${value.latitude.toFixed(6)},${value.longitude.toFixed(6)}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${point(from)}&destination=${point(to)}&travelmode=walking`;
}

function asConcourse(letter: string | undefined): Concourse | null {
  const upper = letter?.toUpperCase();
  return upper && (CONCOURSES as string[]).includes(upper) ? (upper as Concourse) : null;
}
