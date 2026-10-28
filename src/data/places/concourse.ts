import { airport, type Concourse } from '../../config/airport';
import { distanceMeters } from '../../domain/locate';
import type { Coordinates } from '../../domain/types';

import type { PlaceIdentity } from './types';

/** How a restaurant's concourse was decided. Only `override` has been checked by a person. */
export type ConcourseSource = 'override' | 'address' | 'coordinates';

/** One entry in concourse-overrides.json, checked against the ATL dining directory. */
export type ConcourseOverride = {
  name?: string;
  concourse: Concourse | null;
  nearGate?: string | null;
  landside?: boolean;
  /** Not a place to order food from, such as an operator's office. */
  exclude?: boolean;
  checked?: string;
  note?: string;
};

export type ConcourseOverrides = Record<string, ConcourseOverride>;

export type ConcoursePlacement = {
  concourse: Concourse;
  nearGate: string | null;
  source: ConcourseSource;
  confirmed: boolean;
  latitude: number;
  longitude: number;
};

export const CONCOURSE_ORDER = Object.keys(airport.concourses) as Concourse[];

const METERS_PER_DEGREE_LATITUDE = 111_320;
const BOX_MARGIN_NORTH_SOUTH_METERS = 600;
const BOX_MARGIN_EAST_WEST_METERS = 250;

const AIRPORT_ADDRESS =
  /6000\s+N(?:orth)?\.?\s+Terminal\s+P(?:ar)?kwy|\bSpine\s+R(?:oa)?d\b|\bConcourse\b|\bTerminal\b|\bHartsfield\b|\bAirport\b|\bgate\s+[TABCDEF]?\s*-?\s*\d/i;
/** The domestic terminal atrium and anything marked pre-security is landside. */
const LANDSIDE_ADDRESS = /\bpre-?\s?security\b|\batrium\b|\bpark-?\s?ride\b/i;
/** Airline and card lounges, which need their own access. */
const LOUNGE_NAME = /\blounge\b|\bclub\b/i;
const GATE_IN_ADDRESS = /\bgate\s+([TABCDEF])\s*-?\s*(\d{1,3})\b/i;
const CONCOURSE_GATE_IN_ADDRESS = /\bconcourse\s+([TABCDEF])\s*-?\s*(\d{1,3})\b/i;
const CONCOURSE_IN_ADDRESS = /\b(?:concourse|terminal)\s+([TABCDEF])\b/i;
const GATE_NUMBER_IN_ADDRESS = /\bgate\s+(\d{1,3})\b/i;

/** The concourse buildings plus a margin. Places outside it are not in the airport. */
export const airportBox = (() => {
  const centers = Object.values(airport.concourses);
  const latitudes = centers.map((center) => center.latitude);
  const longitudes = centers.map((center) => center.longitude);
  const latMargin = BOX_MARGIN_NORTH_SOUTH_METERS / METERS_PER_DEGREE_LATITUDE;
  const lngMargin =
    BOX_MARGIN_EAST_WEST_METERS / (METERS_PER_DEGREE_LATITUDE * Math.cos((airport.center.latitude * Math.PI) / 180));
  return {
    south: Math.min(...latitudes) - latMargin,
    north: Math.max(...latitudes) + latMargin,
    west: Math.min(...longitudes) - lngMargin,
    east: Math.max(...longitudes) + lngMargin,
  };
})();

export function isInsideAirport(latitude: number | null, longitude: number | null): boolean {
  if (latitude === null || longitude === null) return false;
  return (
    latitude >= airportBox.south &&
    latitude <= airportBox.north &&
    longitude >= airportBox.west &&
    longitude <= airportBox.east
  );
}

export function mentionsAirport(address: string | null): boolean {
  return address !== null && AIRPORT_ADDRESS.test(address);
}

export function isLandsideAddress(address: string | null): boolean {
  return address !== null && LANDSIDE_ADDRESS.test(address);
}

export function isLounge(name: string): boolean {
  return LOUNGE_NAME.test(name);
}

/**
 * An override decides on its own. Otherwise the place must be inside the box, have an airport
 * address, not be marked landside, and not be a lounge.
 */
export function keepPlace(identity: PlaceIdentity, override: ConcourseOverride | undefined): boolean {
  if (override) return override.landside !== true && override.exclude !== true && override.concourse !== null;
  return (
    isInsideAirport(identity.latitude, identity.longitude) &&
    mentionsAirport(identity.address) &&
    !isLandsideAddress(identity.address) &&
    !isLounge(identity.name)
  );
}

/**
 * "Gate B19" or "Concourse B30" → B near that gate. "Concourse B … Gate 12" → B near B12.
 * "Concourse T" or "Terminal D" → that concourse. Suite numbers such as "T10" are ignored.
 */
export function concourseFromAddress(address: string | null): { concourse: Concourse; nearGate: string | null } | null {
  if (!address) return null;
  const gate = GATE_IN_ADDRESS.exec(address) ?? CONCOURSE_GATE_IN_ADDRESS.exec(address);
  if (gate) {
    const concourse = gate[1].toUpperCase() as Concourse;
    return { concourse, nearGate: `${concourse}${Number(gate[2])}` };
  }
  const named = CONCOURSE_IN_ADDRESS.exec(address);
  if (!named) return null;
  const concourse = named[1].toUpperCase() as Concourse;
  const gateNumber = GATE_NUMBER_IN_ADDRESS.exec(address);
  return { concourse, nearGate: gateNumber ? `${concourse}${Number(gateNumber[1])}` : null };
}

export function nearestConcourse(point: Coordinates): Concourse {
  let nearest = CONCOURSE_ORDER[0];
  let best = Number.POSITIVE_INFINITY;
  for (const concourse of CONCOURSE_ORDER) {
    const meters = distanceMeters(point, airport.concourses[concourse]);
    if (meters < best) {
      best = meters;
      nearest = concourse;
    }
  }
  return nearest;
}

/**
 * Override, then address, then nearest concourse. When Google's point sits nearer another concourse
 * than the one chosen, the chosen concourse's center replaces it so the courier pin lands there.
 */
export function placeOnConcourse(
  identity: PlaceIdentity,
  override: ConcourseOverride | undefined,
): ConcoursePlacement | null {
  const point =
    identity.latitude !== null && identity.longitude !== null
      ? { latitude: identity.latitude, longitude: identity.longitude }
      : null;

  let chosen: { concourse: Concourse; nearGate: string | null; source: ConcourseSource } | null = null;
  if (override?.concourse) {
    chosen = { concourse: override.concourse, nearGate: override.nearGate ?? null, source: 'override' };
  } else {
    const fromAddress = concourseFromAddress(identity.address);
    if (fromAddress) chosen = { ...fromAddress, source: 'address' };
    else if (point) chosen = { concourse: nearestConcourse(point), nearGate: null, source: 'coordinates' };
  }
  if (!chosen) return null;

  const pointAgrees = point !== null && nearestConcourse(point) === chosen.concourse;
  const coordinates = pointAgrees ? point : airport.concourses[chosen.concourse];
  return {
    ...chosen,
    confirmed: chosen.source === 'override',
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
  };
}

/** Location text the app already reads with concourseFromText. */
export function concourseLocation(concourse: Concourse, nearGate: string | null): string {
  return nearGate ? `Concourse ${concourse}, near gate ${nearGate}` : `Concourse ${concourse}`;
}

export function concourseRank(concourse: Concourse | null): number {
  const index = concourse ? CONCOURSE_ORDER.indexOf(concourse) : -1;
  return index === -1 ? CONCOURSE_ORDER.length : index;
}
