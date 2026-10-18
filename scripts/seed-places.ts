import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { airport } from '../src/config/airport';
import { buildRestaurant } from '../src/data/places/build';
import { nodeSql } from '../src/data/places/node-sql';
import { applyCatalog, ensurePlacesSchema, readCatalog } from '../src/data/places/store';
import type { PlaceIdentity } from '../src/data/places/types';

const SEARCH_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.photos',
  'places.primaryType',
  'places.primaryTypeDisplayName',
].join(',');
const SEARCH_RADIUS_METERS = 1500;
const DATABASE_PATH = resolve('data/places.db');
const CATALOG_PATH = resolve('src/data/places/catalog.json');

const MISSING_KEY_MESSAGE = [
  'GOOGLE_PLACES_API_KEY is not set.',
  'Add it to .env or .env.local and run this script again. The app keeps using the fixture catalog.',
].join('\n');

loadEnvFile(resolve('.env'));
loadEnvFile(resolve('.env.local'), true);

const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
if (!apiKey) {
  console.error(MISSING_KEY_MESSAGE);
  process.exit(1);
}

void main(apiKey).catch((caught: unknown) => {
  console.error(caught instanceof Error ? caught.message : 'The Places seed failed.');
  process.exit(1);
});

async function main(key: string): Promise<void> {
  const places = await searchNearby(key);
  if (places.length === 0) {
    console.error('Places returned no ATL restaurants. The existing seed was left unchanged.');
    process.exit(1);
  }

  mkdirSync(resolve('data'), { recursive: true });
  const database = new DatabaseSync(DATABASE_PATH);
  const sql = nodeSql(database);
  await ensurePlacesSchema(sql);
  await applyCatalog(sql, {
    restaurants: places.map((place, index) => buildRestaurant(place, index + 1)),
    items: [],
  });
  const catalog = await readCatalog(sql);
  database.close();
  writeFileSync(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`Saved ${catalog.restaurants.length} ATL restaurants to src/data/places/catalog.json.`);
  console.log('Restart Expo with CATALOG_SOURCE=places to load them. The Places key stays in .env.');
}

async function searchNearby(key: string): Promise<PlaceIdentity[]> {
  let response: Response;
  try {
    response = await fetch(SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({
        includedTypes: ['restaurant'],
        maxResultCount: 20,
        rankPreference: 'DISTANCE',
        locationRestriction: {
          circle: {
            center: {
              latitude: airport.center.latitude,
              longitude: airport.center.longitude,
            },
            radius: SEARCH_RADIUS_METERS,
          },
        },
      }),
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'The Places request failed.';
    console.error(`Could not reach Places. ${message}`);
    process.exit(1);
  }

  const body = await response.text();
  if (!response.ok) {
    console.error(`Places returned ${response.status}. ${body.replaceAll(key, '[key]')}`);
    process.exit(1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    console.error('Places returned a response that was not JSON.');
    process.exit(1);
  }

  return parsePlaces(parsed);
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
  if (!placeId || !name) return null;
  const location = place.location;
  const latitude = location && typeof location === 'object' && 'latitude' in location ? numberOrNull(location.latitude) : null;
  const longitude = location && typeof location === 'object' && 'longitude' in location ? numberOrNull(location.longitude) : null;
  const photos = Array.isArray(place.photos) ? place.photos : [];
  const firstPhoto = photos[0];
  const photoReference =
    firstPhoto && typeof firstPhoto === 'object' && 'name' in firstPhoto && typeof firstPhoto.name === 'string'
      ? firstPhoto.name
      : null;

  return {
    placeId,
    name,
    address: typeof place.formattedAddress === 'string' ? place.formattedAddress : null,
    latitude,
    longitude,
    rating: numberOrNull(place.rating),
    photoReference,
    primaryType: typeof place.primaryType === 'string' ? place.primaryType : null,
    primaryTypeLabel: displayText(place.primaryTypeDisplayName),
  };
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
