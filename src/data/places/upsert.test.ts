import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { describe, it } from 'node:test';

import { buildRestaurant } from './build';
import { nodeSql } from './node-sql';
import { applyCatalog, ensurePlacesSchema, readCatalog } from './store';
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

describe('places seed', () => {
  it('updates identity on a second run and keeps the menu', async () => {
    const db = new DatabaseSync(':memory:');
    const sql = nodeSql(db);
    await ensurePlacesSchema(sql);

    const first = buildRestaurant(chickFilA, 1);
    await applyCatalog(sql, { restaurants: [first], items: [] });
    await sql.run(
      `INSERT INTO menu_items (
        id, restaurant_id, name, description, price_cents, prep_minutes, category,
        image_color, featured, popular, kind, badge, compare_at_cents, tags, position
      ) VALUES (?, ?, 'Extra side', 'Added after the first seed', 500, 6, 'Sides', '#F0D56A', 0, 0, 'item', NULL, NULL, '[]', 9)`,
      [`${first.id}-extra`, first.id],
    );

    const renamed = buildRestaurant(
      { ...chickFilA, name: 'South Bar', rating: 4.8, photoReference: 'places/place-a/photos/new' },
      4,
    );
    await applyCatalog(sql, { restaurants: [renamed, buildRestaurant(coffee, 2)], items: [] });

    const catalog = await readCatalog(sql);
    const original = catalog.restaurants.find((restaurant) => restaurant.placeId === 'place-a');
    const added = catalog.restaurants.find((restaurant) => restaurant.placeId === 'place-b');
    const menu = catalog.items.filter((item) => item.restaurantId === first.id);

    assert.equal(original?.name, 'South Bar');
    assert.equal(original?.rating, 4.8);
    assert.equal(original?.photoReference, 'places/place-a/photos/new');
    assert.equal(original?.initials, 'OF');
    assert.equal(original?.fastestPrepMinutes, 8);
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
});
