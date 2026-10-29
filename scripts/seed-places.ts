import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { airport, type Concourse } from '../src/config/airport';
import { buildMenu, buildRestaurant } from '../src/data/places/build';
import {
  CONCOURSE_ORDER,
  concourseRank,
  keepPlace,
  placeOnConcourse,
  type ConcourseOverrides,
  type ConcoursePlacement,
} from '../src/data/places/concourse';
import { nodeSql } from '../src/data/places/node-sql';
import { applyCatalog, ensurePlacesSchema, readCatalog, removePlacesExcept } from '../src/data/places/store';
import type { PlaceIdentity } from '../src/data/places/types';
import type { Coordinates } from '../src/domain/types';

const NEARBY_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const TEXT_URL = 'https://places.googleapis.com/v1/places:searchText';
// No photos: photo names may not be stored. Phase 11 fetches them on the phone.
const PLACE_FIELDS = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.primaryType',
  'places.primaryTypeDisplayName',
  'places.types',
].join(',');
const FOOD_TYPES = [
  'restaurant',
  'cafe',
  'coffee_shop',
  'bakery',
  'bar',
  'fast_food_restaurant',
  'sandwich_shop',
  'meal_takeaway',
];
const NEARBY_RADIUS_METERS = 450;
const TEXT_PAGES = 3;
const DATABASE_PATH = resolve('data/places.db');
const CATALOG_PATH = resolve('src/data/places/catalog.json');
const OVERRIDES_PATH = resolve('src/data/places/concourse-overrides.json');
/** Offline: rebuilds the four demo dishes for the restaurants already seeded. Rows added by hand stay. */
const REBUILD_MENUS = process.argv.includes('--rebuild-menus');

const MISSING_KEY_MESSAGE = [
  'GOOGLE_PLACES_API_KEY is not set.',
  'Add it to .env or .env.local and run this script again. The app keeps using the fixture catalog.',
].join('\n');

type Kept = { identity: PlaceIdentity; placement: ConcoursePlacement };

if (REBUILD_MENUS) {
  void rebuildMenus().catch((caught: unknown) => {
    console.error(caught instanceof Error ? caught.message : 'Rebuilding the menus failed.');
    process.exit(1);
  });
} else {
  loadEnvFile(resolve('.env'));
  loadEnvFile(resolve('.env.local'), true);
  seedFromPlaces();
}

function seedFromPlaces(): void {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!apiKey) {
    console.error(MISSING_KEY_MESSAGE);
    process.exit(1);
  }

  void main(apiKey).catch((caught: unknown) => {
    console.error(caught instanceof Error ? caught.message : 'The Places seed failed.');
    process.exit(1);
  });
}

async function rebuildMenus(): Promise<void> {
  if (!existsSync(DATABASE_PATH)) {
    console.error('data/places.db does not exist yet. Run npm run seed:places first.');
    process.exit(1);
  }
  const database = new DatabaseSync(DATABASE_PATH);
  const sql = nodeSql(database);
  await ensurePlacesSchema(sql);
  const { restaurants } = await readCatalog(sql);
  await applyCatalog(sql, {
    restaurants,
    items: restaurants.flatMap((restaurant) => buildMenu(restaurant.id, restaurant.primaryType)),
  });
  const catalog = await readCatalog(sql);
  database.close();
  writeFileSync(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`Rebuilt the demo menus for ${catalog.restaurants.length} restaurants from src/data/places/menus.ts.`);
}

async function main(key: string): Promise<void> {
  const found = new Map<string, PlaceIdentity>();
  for (const concourse of CONCOURSE_ORDER) {
    const center = airport.concourses[concourse];
    for (const place of await searchNearby(key, center)) found.set(place.placeId, place);
    for (const place of await searchText(key, concourse, center)) found.set(place.placeId, place);
  }
  if (found.size === 0) {
    console.error('Places returned no ATL restaurants. The existing seed was left unchanged.');
    process.exit(1);
  }

  const overrides = readOverrides();
  const kept: Kept[] = [];
  const dropped: PlaceIdentity[] = [];
  for (const identity of found.values()) {
    const override = overrides[identity.placeId];
    const placement = keepPlace(identity, override) ? placeOnConcourse(identity, override) : null;
    if (placement) kept.push({ identity, placement });
    else dropped.push(identity);
  }
  kept.sort(
    (a, b) =>
      concourseRank(a.placement.concourse) - concourseRank(b.placement.concourse) ||
      a.identity.name.localeCompare(b.identity.name),
  );
  if (kept.length === 0) {
    console.error('No Places result was inside the airport. The existing seed was left unchanged.');
    process.exit(1);
  }

  mkdirSync(resolve('data'), { recursive: true });
  const database = new DatabaseSync(DATABASE_PATH);
  const sql = nodeSql(database);
  await ensurePlacesSchema(sql);
  await applyCatalog(sql, {
    restaurants: kept.map(({ identity, placement }, index) => buildRestaurant(identity, index + 1, placement)),
    items: [],
  });
  const removed = await removePlacesExcept(
    sql,
    kept.map(({ identity }) => identity.placeId),
  );
  const catalog = await readCatalog(sql);
  database.close();
  writeFileSync(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`);

  printSummary(found.size, kept, dropped, removed);
  console.log(`Saved ${catalog.restaurants.length} ATL restaurants to src/data/places/catalog.json.`);
  console.log('Restart Expo with CATALOG_SOURCE=places to load them. The Places key stays in .env.');
}

async function searchNearby(key: string, center: Coordinates): Promise<PlaceIdentity[]> {
  const payload = await postPlaces(key, NEARBY_URL, PLACE_FIELDS, {
    includedTypes: FOOD_TYPES,
    maxResultCount: 20,
    rankPreference: 'DISTANCE',
    locationRestriction: { circle: { center, radius: NEARBY_RADIUS_METERS } },
  });
  return parsePlaces(payload);
}

async function searchText(key: string, concourse: Concourse, center: Coordinates): Promise<PlaceIdentity[]> {
  const places: PlaceIdentity[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < TEXT_PAGES; page += 1) {
    const payload = await postPlaces(key, TEXT_URL, `${PLACE_FIELDS},nextPageToken`, {
      textQuery: `restaurants in Concourse ${concourse} Hartsfield-Jackson Atlanta Airport`,
      pageSize: 20,
      locationBias: { circle: { center, radius: NEARBY_RADIUS_METERS } },
      ...(pageToken ? { pageToken } : {}),
    });
    places.push(...parsePlaces(payload));
    pageToken =
      payload && typeof payload === 'object' && 'nextPageToken' in payload && typeof payload.nextPageToken === 'string'
        ? payload.nextPageToken
        : undefined;
    if (!pageToken) break;
  }
  return places;
}

async function postPlaces(key: string, url: string, fieldMask: string, body: object): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify(body),
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'The Places request failed.';
    console.error(`Could not reach Places. ${message}`);
    process.exit(1);
  }

  const text = await response.text();
  if (!response.ok) {
    console.error(`Places returned ${response.status}. ${text.replaceAll(key, '[key]')}`);
    process.exit(1);
  }

  try {
    return JSON.parse(text);
  } catch {
    console.error('Places returned a response that was not JSON.');
    process.exit(1);
  }
}

function readOverrides(): ConcourseOverrides {
  if (!existsSync(OVERRIDES_PATH)) return {};
  const parsed: unknown = JSON.parse(readFileSync(OVERRIDES_PATH, 'utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    console.error('src/data/places/concourse-overrides.json must be an object keyed by place id.');
    process.exit(1);
  }
  return parsed as ConcourseOverrides;
}

function printSummary(foundCount: number, kept: Kept[], dropped: PlaceIdentity[], removed: number): void {
  console.log(`Places returned ${foundCount} food places. Kept ${kept.length}, dropped ${dropped.length}.`);
  if (removed > 0) console.log(`Removed ${removed} restaurants the earlier seed had and this one did not keep.`);
  const perConcourse = CONCOURSE_ORDER.map(
    (concourse) => `${concourse} ${kept.filter(({ placement }) => placement.concourse === concourse).length}`,
  );
  console.log(`By concourse: ${perConcourse.join(' · ')}`);

  const unconfirmed = kept.filter(({ placement }) => !placement.confirmed);
  console.log(`\nUnconfirmed: ${unconfirmed.length} of ${kept.length}. Add place ids to concourse-overrides.json after checking atl.com.`);
  for (const source of ['address', 'coordinates'] as const) {
    const rows = unconfirmed.filter(({ placement }) => placement.source === source);
    if (rows.length === 0) continue;
    console.log(`\nFrom ${source} (${rows.length}):`);
    for (const { identity, placement } of rows) {
      console.log(`  ${placement.concourse}  ${identity.name}  ${identity.placeId}  ${identity.address ?? ''}`);
    }
  }
  if (dropped.length > 0) {
    console.log(`\nDropped (${dropped.length}):`);
    for (const identity of dropped) console.log(`  ${identity.name}  ${identity.placeId}  ${identity.address ?? ''}`);
  }
  console.log('');
}

function parsePlaces(payload: unknown): PlaceIdentity[] {
  if (!payload || typeof payload !== 'object' || !('places' in payload)) return [];
  const places = payload.places;
  if (!Array.isArray(places)) return [];
  return places.flatMap((place) => {
    const identity = parsePlace(place);
    return identity ? [identity] : [];
  });
}

function parsePlace(value: unknown): PlaceIdentity | null {
  if (!value || typeof value !== 'object') return null;
  const place = value as Record<string, unknown>;
  const placeId = typeof place.id === 'string' ? place.id : '';
  const name = displayText(place.displayName);
  if (!placeId || !name || !servesFood(place.types)) return null;
  const location = place.location;
  const latitude = location && typeof location === 'object' && 'latitude' in location ? numberOrNull(location.latitude) : null;
  const longitude = location && typeof location === 'object' && 'longitude' in location ? numberOrNull(location.longitude) : null;

  return {
    placeId,
    name,
    address: typeof place.formattedAddress === 'string' ? place.formattedAddress : null,
    latitude,
    longitude,
    rating: numberOrNull(place.rating),
    photoReference: null,
    primaryType: typeof place.primaryType === 'string' ? place.primaryType : null,
    primaryTypeLabel: displayText(place.primaryTypeDisplayName),
  };
}

/** Text Search also returns shops and lounges. Keep places Google types as food or drink. */
function servesFood(types: unknown): boolean {
  if (!Array.isArray(types)) return false;
  return types.some(
    (type) => typeof type === 'string' && (type === 'food' || FOOD_TYPES.includes(type) || type.endsWith('_restaurant')),
  );
}

function displayText(value: unknown): string | null {
  if (!value || typeof value !== 'object' || !('text' in value)) return null;
  return typeof value.text === 'string' && value.text.trim() ? value.text.trim() : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function loadEnvFile(path: string, override = false): void {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (override || process.env[key] === undefined) process.env[key] = value;
  }
}
