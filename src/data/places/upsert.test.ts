import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { describe, it } from 'node:test';

import { buildRestaurant } from './build';
import { placeOnConcourse, type ConcourseOverride } from './concourse';
import { nodeSql } from './node-sql';
import { applyCatalog, ensurePlacesSchema, readCatalog, removePlacesExcept } from './store';
import type { PlaceIdentity } from './types';

const chickFilA: PlaceIdentity = {
  placeId: 'place-a',
  name: 'One Flew South',
  address: '6000 N Terminal Pkwy, Atlanta, GA',
  latitude: 33.6408,
  longitude: -84.4279,
  rating: 4.4,
  photoReference: 'places/place-a/photos/abc',
  primaryType: 'american_restaurant',
  primaryTypeLabel: 'American restaurant',
};

const coffee: PlaceIdentity = {
  ...chickFilA,
  placeId: 'place-b',
  name: 'Cafe Intermezzo',
  rating: 4.1,
  photoReference: null,
};

function build(identity: PlaceIdentity, position: number, override?: ConcourseOverride) {
  const placement = placeOnConcourse(identity, override);
  assert.ok(placement);
  return buildRestaurant(identity, position, placement);
}

describe('places seed', () => {
  it('updates identity on a second run and keeps the menu', async () => {
    const db = new DatabaseSync(':memory:');
    const sql = nodeSql(db);
    await ensurePlacesSchema(sql);

    const first = build(chickFilA, 1);
    await applyCatalog(sql, { restaurants: [first], items: [] });
    await sql.run(
      `INSERT INTO menu_items (
        id, restaurant_id, name, description, price_cents, prep_minutes, category,
        image_color, featured, popular, kind, badge, compare_at_cents, tags, position
      ) VALUES (?, ?, 'Extra side', 'Added after the first seed', 500, 6, 'Sides', '#F0D56A', 0, 0, 'item', NULL, NULL, '[]', 9)`,
      [`${first.id}-extra`, first.id],
    );

    assert.equal(first.location, 'Concourse D');
    assert.equal(first.concourseSource, 'coordinates');
    assert.equal(first.concourseConfirmed, false);

    const renamed = build(
      { ...chickFilA, name: 'South Bar', rating: 4.8, photoReference: 'places/place-a/photos/new' },
      4,
      { concourse: 'A', nearGate: 'A10' },
    );
    await applyCatalog(sql, { restaurants: [renamed, build(coffee, 2)], items: [] });

    const catalog = await readCatalog(sql);
    const original = catalog.restaurants.find((restaurant) => restaurant.placeId === 'place-a');
    const added = catalog.restaurants.find((restaurant) => restaurant.placeId === 'place-b');
    const menu = catalog.items.filter((item) => item.restaurantId === first.id);

    assert.equal(original?.name, 'South Bar');
    assert.equal(original?.rating, 4.8);
    assert.equal(original?.photoReference, 'places/place-a/photos/new');
    assert.equal(original?.initials, 'OF');
    assert.equal(original?.fastestPrepMinutes, 8);
    assert.equal(original?.location, 'Concourse A, near gate A10');
    assert.equal(original?.position, 4);
    assert.equal(original?.concourse, 'A');
    assert.equal(original?.concourseSource, 'override');
    assert.equal(original?.concourseConfirmed, true);
    assert.equal(added?.name, 'Cafe Intermezzo');
    assert.equal(menu.length, 5);
    assert.deepEqual(
      menu.map((item) => [item.name, item.prepMinutes]),
      [
        ['Quick bite', 8],
        ['House plate', 14],
        ['Slow roast', 48],
        ['Gate bundle', 12],
        ['Extra side', 6],
      ],
    );
    assert.equal(catalog.items.filter((item) => item.restaurantId === added?.id).length, 4);
    db.close();
  });

  it('removes restaurants the latest search dropped, with their menus', async () => {
    const db = new DatabaseSync(':memory:');
    const sql = nodeSql(db);
    await ensurePlacesSchema(sql);
    await applyCatalog(sql, { restaurants: [build(chickFilA, 1), build(coffee, 2)], items: [] });

    assert.equal(await removePlacesExcept(sql, ['place-b']), 1);

    const catalog = await readCatalog(sql);
    assert.deepEqual(catalog.restaurants.map((restaurant) => restaurant.placeId), ['place-b']);
    assert.ok(catalog.items.every((item) => item.restaurantId === 'place-place-b'));
    db.close();
  });

  it('adds the concourse columns to a seed database made before them', async () => {
    const db = new DatabaseSync(':memory:');
    const sql = nodeSql(db);
    db.exec(`CREATE TABLE restaurants (
      id TEXT PRIMARY KEY NOT NULL, source TEXT NOT NULL, place_id TEXT UNIQUE, name TEXT NOT NULL,
      initials TEXT NOT NULL, color TEXT NOT NULL, cuisine TEXT NOT NULL, location TEXT NOT NULL,
      fastest_prep_minutes INTEGER NOT NULL, open_until TEXT, address TEXT, latitude REAL, longitude REAL,
      rating REAL, photo_reference TEXT, primary_type TEXT, position INTEGER NOT NULL
    )`);
    await ensurePlacesSchema(sql);
    await applyCatalog(sql, { restaurants: [build(chickFilA, 1, { concourse: 'B' })], items: [] });

    const [restaurant] = (await readCatalog(sql)).restaurants;
    assert.equal(restaurant?.concourse, 'B');
    assert.equal(restaurant?.concourseConfirmed, true);
    db.close();
  });
});
