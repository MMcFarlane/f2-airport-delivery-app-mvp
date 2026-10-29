import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { FIXTURE_PHOTO_QUERIES } from '../sqlite/fixture-photos';

import { buildMenu } from './build';
import catalog from './catalog.json';
import { CUISINE_GROUPS, cuisineGroupFor, DEFAULT_GROUP_ID, MENU_SLOTS } from './menus';

describe('cuisine menus', () => {
  it('maps Places types to cuisine groups', () => {
    assert.equal(cuisineGroupFor('pizza_restaurant').id, 'pizza');
    assert.equal(cuisineGroupFor('coffee_shop').id, 'coffee');
    assert.equal(cuisineGroupFor('bagel_shop').id, 'breakfast');
    assert.equal(cuisineGroupFor('brewpub').id, 'bar');
    assert.equal(cuisineGroupFor('american_restaurant').id, DEFAULT_GROUP_ID);
    assert.equal(cuisineGroupFor('restaurant').id, DEFAULT_GROUP_ID);
    assert.equal(cuisineGroupFor(null).id, DEFAULT_GROUP_ID);
  });

  it('lists each Places type in at most one group', () => {
    const types = CUISINE_GROUPS.flatMap((group) => group.primaryTypes);
    assert.equal(new Set(types).size, types.length);
  });

  it('keeps the delivery-window slots the same in every group', () => {
    for (const group of CUISINE_GROUPS) {
      const menu = buildMenu('place-x', group.primaryTypes[0] ?? null);
      assert.deepEqual(
        menu.map((item) => [item.id, item.prepMinutes, item.priceCents, item.kind, item.featured]),
        MENU_SLOTS.map((slot) => [`place-x-${slot.slug}`, slot.prepMinutes, slot.priceCents, slot.kind, slot.featured]),
        group.id,
      );
      assert.ok(menu.every((item) => item.imageKey?.startsWith(`${group.id}-`)), group.id);
      assert.equal(menu[3]?.category, null, `${group.id} bundle has no menu tab`);
    }
  });

  it('gives every seeded restaurant a group dish with a photo key', () => {
    for (const restaurant of catalog.restaurants) {
      const menu = buildMenu(restaurant.id, restaurant.primaryType);
      assert.equal(menu.length, 4);
      assert.ok(menu.every((item) => item.imageKey));
    }
  });

  it('gives every photo a search query', () => {
    for (const group of CUISINE_GROUPS) {
      for (const slot of MENU_SLOTS) assert.ok(group.dishes[slot.slug].photoQuery.trim(), `${group.id}-${slot.slug}`);
    }
    assert.ok(Object.values(FIXTURE_PHOTO_QUERIES).every((query) => query.trim()));
  });
});
