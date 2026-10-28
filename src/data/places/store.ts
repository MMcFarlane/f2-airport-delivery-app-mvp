import { airport, type Concourse } from '../../config/airport';

import { buildMenu } from './build';
import type { ConcourseSource } from './concourse';
import type { PlacesCatalog, PlacesMenuRecord, PlacesRestaurantRecord } from './types';

export type Sql = {
  exec(sql: string): void | Promise<void>;
  get<T>(sql: string, params: readonly SqlValue[]): T | undefined | Promise<T | undefined>;
  all<T>(sql: string, params: readonly SqlValue[]): T[] | Promise<T[]>;
  run(sql: string, params: readonly SqlValue[]): void | Promise<void>;
};

type SqlValue = string | number | null;

export const PLACES_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS restaurants (
  id TEXT PRIMARY KEY NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('fixtures', 'places')),
  place_id TEXT UNIQUE,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  color TEXT NOT NULL,
  cuisine TEXT NOT NULL,
  location TEXT NOT NULL,
  fastest_prep_minutes INTEGER NOT NULL,
  open_until TEXT,
  address TEXT,
  latitude REAL,
  longitude REAL,
  rating REAL,
  photo_reference TEXT,
  primary_type TEXT,
  position INTEGER NOT NULL,
  concourse TEXT,
  concourse_source TEXT,
  concourse_confirmed INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY NOT NULL,
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  prep_minutes INTEGER NOT NULL,
  category TEXT,
  image_color TEXT NOT NULL,
  featured INTEGER NOT NULL DEFAULT 0,
  popular INTEGER NOT NULL DEFAULT 0,
  kind TEXT NOT NULL CHECK (kind IN ('item', 'special')),
  badge TEXT,
  compare_at_cents INTEGER,
  tags TEXT NOT NULL DEFAULT '[]',
  position INTEGER NOT NULL
);
`;

const UPSERT_RESTAURANT_SQL = `
INSERT INTO restaurants (
  id, source, place_id, name, initials, color, cuisine, location,
  fastest_prep_minutes, open_until, address, latitude, longitude, rating,
  photo_reference, primary_type, position, concourse, concourse_source, concourse_confirmed
) VALUES (?, 'places', ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(place_id) DO UPDATE SET
  name = excluded.name,
  cuisine = excluded.cuisine,
  location = excluded.location,
  address = excluded.address,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  rating = excluded.rating,
  photo_reference = excluded.photo_reference,
  primary_type = excluded.primary_type,
  position = excluded.position,
  concourse = excluded.concourse,
  concourse_source = excluded.concourse_source,
  concourse_confirmed = excluded.concourse_confirmed
`;

/** Columns added after the first seed. ensurePlacesSchema adds any an older data/places.db lacks. */
const ADDED_RESTAURANT_COLUMNS = [
  ['concourse', 'TEXT'],
  ['concourse_source', 'TEXT'],
  ['concourse_confirmed', 'INTEGER NOT NULL DEFAULT 0'],
] as const;

const MENU_COUNT_SQL = `SELECT COUNT(*) AS count FROM menu_items WHERE restaurant_id = ?`;

const LIST_RESTAURANTS_SQL = `
SELECT
  id, place_id, name, initials, color, cuisine, location, fastest_prep_minutes,
  address, latitude, longitude, rating, photo_reference, primary_type, position,
  concourse, concourse_source, concourse_confirmed
FROM restaurants
WHERE source = 'places'
ORDER BY position, name
`;

const LIST_ITEMS_SQL = `
SELECT
  menu_items.id, menu_items.restaurant_id, menu_items.name, menu_items.description,
  menu_items.price_cents, menu_items.prep_minutes, menu_items.category, menu_items.image_color,
  menu_items.featured, menu_items.popular, menu_items.kind, menu_items.badge,
  menu_items.compare_at_cents, menu_items.tags, menu_items.position
FROM menu_items
JOIN restaurants ON restaurants.id = menu_items.restaurant_id
WHERE restaurants.source = 'places'
ORDER BY menu_items.restaurant_id, menu_items.position
`;

const INSERT_MENU_SQL = `
INSERT INTO menu_items (
  id, restaurant_id, name, description, price_cents, prep_minutes, category,
  image_color, featured, popular, kind, badge, compare_at_cents, tags, position
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

type CountRow = { count: number | bigint };
type ColumnRow = { name: string };

export async function ensurePlacesSchema(sql: Sql): Promise<void> {
  await sql.exec('PRAGMA foreign_keys = ON');
  await sql.exec(PLACES_SCHEMA_SQL);
  const columns = new Set((await sql.all<ColumnRow>('PRAGMA table_info(restaurants)', [])).map((row) => row.name));
  for (const [name, definition] of ADDED_RESTAURANT_COLUMNS) {
    if (!columns.has(name)) await sql.exec(`ALTER TABLE restaurants ADD COLUMN ${name} ${definition}`);
  }
}

/** Seed only: deletes Places restaurants, and their menus, that the latest search did not keep. */
export async function removePlacesExcept(sql: Sql, placeIds: readonly string[]): Promise<number> {
  const stale = await sql.all<{ id: string; place_id: string }>(
    `SELECT id, place_id FROM restaurants WHERE source = 'places'`,
    [],
  );
  const keep = new Set(placeIds);
  const removed = stale.filter((row) => !keep.has(row.place_id));
  for (const row of removed) {
    await sql.run(`DELETE FROM menu_items WHERE restaurant_id = ?`, [row.id]);
    await sql.run(`DELETE FROM restaurants WHERE id = ?`, [row.id]);
  }
  return removed.length;
}

export async function applyCatalog(sql: Sql, catalog: PlacesCatalog): Promise<void> {
  for (const restaurant of catalog.restaurants) {
    await sql.run(UPSERT_RESTAURANT_SQL, restaurantParams(restaurant));
    const count = await sql.get<CountRow>(MENU_COUNT_SQL, [restaurant.id]);
    if (Number(count?.count ?? 0) > 0) continue;
    const items = catalog.items.filter((item) => item.restaurantId === restaurant.id);
    const menu = items.length > 0 ? items : buildMenu(restaurant.id);
    for (const item of menu) {
      await sql.run(INSERT_MENU_SQL, menuParams(item));
    }
  }
}

export async function readCatalog(sql: Sql): Promise<PlacesCatalog> {
  const restaurantRows = await sql.all<PlacesRestaurantRow>(LIST_RESTAURANTS_SQL, []);
  const itemRows = await sql.all<PlacesMenuRow>(LIST_ITEMS_SQL, []);
  return {
    restaurants: restaurantRows.map(mapRestaurant),
    items: itemRows.map(mapItem),
  };
}

type PlacesRestaurantRow = {
  id: string;
  place_id: string;
  name: string;
  initials: string;
  color: string;
  cuisine: string;
  location: string;
  fastest_prep_minutes: number;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  photo_reference: string | null;
  primary_type: string | null;
  position: number;
  concourse: string | null;
  concourse_source: string | null;
  concourse_confirmed: number;
};

type PlacesMenuRow = {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  price_cents: number;
  prep_minutes: number;
  category: string | null;
  image_color: string;
  featured: number;
  popular: number;
  kind: string;
  badge: string | null;
  compare_at_cents: number | null;
  tags: string;
  position: number;
};

function mapRestaurant(row: PlacesRestaurantRow): PlacesRestaurantRecord {
  return {
    id: row.id,
    placeId: row.place_id,
    name: row.name,
    initials: row.initials,
    color: row.color,
    cuisine: row.cuisine,
    location: row.location,
    fastestPrepMinutes: row.fastest_prep_minutes,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    rating: row.rating,
    photoReference: row.photo_reference,
    primaryType: row.primary_type,
    concourse: asConcourse(row.concourse),
    concourseSource: asConcourseSource(row.concourse_source),
    concourseConfirmed: row.concourse_confirmed === 1,
    position: row.position,
  };
}

function asConcourse(value: string | null): Concourse | null {
  return value !== null && value in airport.concourses ? (value as Concourse) : null;
}

function asConcourseSource(value: string | null): ConcourseSource | null {
  return value === 'override' || value === 'address' || value === 'coordinates' ? value : null;
}

function mapItem(row: PlacesMenuRow): PlacesMenuRecord {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    name: row.name,
    description: row.description,
    priceCents: row.price_cents,
    prepMinutes: row.prep_minutes,
    category: row.category,
    imageColor: row.image_color,
    featured: row.featured === 1,
    popular: row.popular === 1,
    kind: row.kind === 'special' ? 'special' : 'item',
    badge: row.badge,
    compareAtCents: row.compare_at_cents,
    tags: parseTags(row.tags),
    position: row.position,
  };
}

function parseTags(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((tag): tag is string => typeof tag === 'string') : [];
  } catch {
    return [];
  }
}

function restaurantParams(restaurant: PlacesRestaurantRecord): SqlValue[] {
  return [
    restaurant.id,
    restaurant.placeId,
    restaurant.name,
    restaurant.initials,
    restaurant.color,
    restaurant.cuisine,
    restaurant.location,
    restaurant.fastestPrepMinutes,
    restaurant.address,
    restaurant.latitude,
    restaurant.longitude,
    restaurant.rating,
    restaurant.photoReference,
    restaurant.primaryType,
    restaurant.position,
    restaurant.concourse ?? null,
    restaurant.concourseSource ?? null,
    restaurant.concourseConfirmed ? 1 : 0,
  ];
}

function menuParams(item: PlacesMenuRecord): SqlValue[] {
  return [
    item.id,
    item.restaurantId,
    item.name,
    item.description,
    item.priceCents,
    item.prepMinutes,
    item.category,
    item.imageColor,
    item.featured ? 1 : 0,
    item.popular ? 1 : 0,
    item.kind,
    item.badge,
    item.compareAtCents,
    JSON.stringify(item.tags),
    item.position,
  ];
}
