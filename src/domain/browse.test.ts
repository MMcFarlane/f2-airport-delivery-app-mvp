import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  availabilityLabel,
  categoryChipLabels,
  cuisineChipLabels,
  featuredCountLabel,
  featuredVisible,
  menuAvailability,
  reachCountLabel,
  restaurantVisible,
  sortFeatured,
  sortRestaurants,
  sortSpecials,
  specialsLine,
  specialTagLabels,
  specialVisible,
  type MenuAvailability,
} from './browse';
import type { MenuItem, Restaurant } from './types';

const fits = (prepMinutes: number) => prepMinutes <= 43;

describe('menu availability', () => {
  it('marks a restaurant full when every item fits', () => {
    assert.equal(menuAvailability(5, [6], fits), 'full');
    assert.equal(menuAvailability(13, [], fits), 'full');
  });

  it('marks a restaurant partial when the fastest item fits and another does not', () => {
    assert.equal(menuAvailability(8, [12, 14, 10, 8, 48], fits), 'partial');
    assert.equal(menuAvailability(24, [52], fits), 'partial');
  });

  it('marks a restaurant late when even the fastest prep misses the window', () => {
    assert.equal(menuAvailability(52, [52], fits), 'late');
    assert.equal(availabilityLabel('late', '15:00'), 'Too late for 15:00');
    assert.equal(availabilityLabel('partial', '15:00'), 'Some items too slow for your flight');
    assert.equal(availabilityLabel('full', '15:00'), 'Full menu available');
  });
});

describe('browse filters', () => {
  const runway = restaurant({
    id: 'runway-burger',
    name: 'Runway Burger',
    cuisine: 'Burgers, fries, shakes',
    fastestPrepMinutes: 8,
  });
  const cafe = restaurant({
    id: 'gate-cafe',
    name: 'Gate Café',
    cuisine: 'Coffee, pastries',
    location: 'Near B12',
    fastestPrepMinutes: 5,
  });
  const pizza = restaurant({
    id: 'concourse-pizza',
    name: 'Concourse Pizza',
    cuisine: 'Pizza, salads',
    fastestPrepMinutes: 52,
  });

  const availability = new Map<string, MenuAvailability>([
    ['runway-burger', 'partial'],
    ['gate-cafe', 'full'],
    ['concourse-pizza', 'late'],
  ]);

  it('keeps restaurants that can reach the gate and hides a fully late one', () => {
    assert.equal(restaurantVisible(runway, 'partial', { type: 'fits' }, ''), true);
    assert.equal(restaurantVisible(pizza, 'late', { type: 'fits' }, ''), false);
  });

  it('filters under 10 minutes, cuisine, and search', () => {
    assert.equal(restaurantVisible(runway, 'partial', { type: 'under10' }, ''), true);
    assert.equal(restaurantVisible(pizza, 'late', { type: 'under10' }, ''), false);
    assert.equal(restaurantVisible(cafe, 'full', { type: 'cuisine', label: 'Coffee' }, ''), true);
    assert.equal(restaurantVisible(runway, 'partial', { type: 'cuisine', label: 'Coffee' }, ''), false);
    assert.equal(restaurantVisible(cafe, 'full', null, 'b12'), true);
    assert.equal(restaurantVisible(cafe, 'full', null, 'burger'), false);
  });

  it('sorts fastest first with late restaurants after ones that can arrive', () => {
    const sorted = sortRestaurants([pizza, runway, cafe], 'fastest', (entry) => availability.get(entry.id) ?? 'late');
    assert.deepEqual(
      sorted.map((entry) => entry.id),
      ['gate-cafe', 'runway-burger', 'concourse-pizza'],
    );
  });

  it('sorts restaurants by name', () => {
    const sorted = sortRestaurants([runway, cafe, pizza], 'name', (entry) => availability.get(entry.id) ?? 'late');
    assert.deepEqual(
      sorted.map((entry) => entry.name),
      ['Concourse Pizza', 'Gate Café', 'Runway Burger'],
    );
  });

  it('builds cuisine chips from the first cuisine word', () => {
    assert.deepEqual(cuisineChipLabels([cafe, runway, cafe]), ['Coffee', 'Burgers']);
  });
});

describe('featured and specials lists', () => {
  const coldBrew = item({
    id: 'cold-brew',
    name: 'Cold brew + croissant',
    restaurantName: 'Gate Café',
    priceCents: 850,
    prepMinutes: 6,
    category: 'Coffee',
  });
  const tacos = item({
    id: 'tacos',
    name: 'Chicken tinga tacos',
    restaurantName: 'Terminal Taco',
    priceCents: 975,
    prepMinutes: 11,
    category: 'Tacos',
  });
  const pizza = item({
    id: 'pizza',
    name: 'Wood-fired pizza',
    restaurantName: 'Concourse Pizza',
    priceCents: 1700,
    prepMinutes: 52,
    category: 'Pizza',
  });
  const combo = item({
    id: 'combo',
    name: 'Pre-flight combo',
    restaurantName: 'Runway Burger',
    priceCents: 1899,
    prepMinutes: 14,
    kind: 'special',
    badge: 'SAVE $4',
    tags: ['Combos'],
    position: 1,
  });
  const breakfast = item({
    id: 'breakfast',
    name: 'Breakfast for two',
    restaurantName: 'Gate Café',
    priceCents: 1400,
    prepMinutes: 7,
    kind: 'special',
    badge: 'BUNDLE',
    tags: ['Breakfast'],
    position: 2,
  });

  it('keeps a too-late featured item on All that fit and drops it from tighter chips', () => {
    assert.equal(featuredVisible(pizza, { type: 'all' }, ''), true);
    assert.equal(featuredVisible(pizza, { type: 'under10' }, ''), false);
    assert.equal(featuredVisible(pizza, { type: 'under10dollars' }, ''), false);
    assert.equal(featuredVisible(coldBrew, { type: 'under10' }, ''), true);
    assert.equal(featuredVisible(tacos, { type: 'under10' }, ''), false);
    assert.equal(featuredVisible(tacos, { type: 'under10dollars' }, ''), true);
    assert.equal(featuredVisible(coldBrew, { type: 'under10dollars' }, 'croissant'), true);
    assert.equal(featuredVisible(pizza, { type: 'category', label: 'Pizza' }, ''), true);
  });

  it('sorts featured items that fit ahead of too-late ones', () => {
    const sorted = sortFeatured([pizza, tacos, coldBrew], 'fastest', fits);
    assert.deepEqual(
      sorted.map((entry) => entry.id),
      ['cold-brew', 'tacos', 'pizza'],
    );
    assert.deepEqual(categoryChipLabels([coldBrew, tacos, pizza]), ['Coffee', 'Tacos', 'Pizza']);
    assert.equal(featuredCountLabel(5, '15:00', 'fastest'), '5 items arrive before 15:00 · sorted by fastest');
    assert.equal(featuredCountLabel(1, '15:00', 'price'), '1 item arrives before 15:00 · sorted by price');
  });

  it('filters specials by tag and keeps the listed order until fastest is chosen', () => {
    assert.equal(specialVisible(combo, 'Combos', ''), true);
    assert.equal(specialVisible(breakfast, 'Combos', ''), false);
    assert.equal(specialVisible(combo, null, 'runway'), true);
    assert.deepEqual(specialTagLabels([combo, breakfast, combo]), ['Combos', 'Breakfast']);

    const listed = sortSpecials([breakfast, combo], 'listed', fits);
    assert.deepEqual(
      listed.map((entry) => entry.id),
      ['combo', 'breakfast'],
    );

    const fastest = sortSpecials([combo, breakfast], 'fastest', fits);
    assert.deepEqual(
      fastest.map((entry) => entry.id),
      ['breakfast', 'combo'],
    );
    assert.equal(specialsLine('B14', '15:00'), 'Deals that still reach Gate B14 by 15:00');
    assert.equal(reachCountLabel(7, 'B14'), '7 restaurants can reach B14');
    assert.equal(reachCountLabel(1, 'B14'), '1 restaurant can reach B14');
  });
});

function restaurant(overrides: Partial<Restaurant> & Pick<Restaurant, 'id' | 'name' | 'cuisine' | 'fastestPrepMinutes'>): Restaurant {
  return {
    source: 'fixtures',
    placeId: null,
    initials: 'XX',
    color: '#111111',
    location: 'Concourse B',
    openUntil: null,
    address: null,
    latitude: null,
    longitude: null,
    rating: null,
    photoReference: null,
    primaryType: null,
    ...overrides,
  };
}

function item(
  overrides: Partial<MenuItem> & Pick<MenuItem, 'id' | 'name' | 'priceCents' | 'prepMinutes'>,
): MenuItem {
  return {
    restaurantId: 'restaurant',
    restaurantName: 'Restaurant',
    description: 'Packed for the gate',
    category: null,
    imageColor: '#F2B36B',
    featured: true,
    popular: false,
    kind: 'item',
    badge: null,
    compareAtCents: null,
    tags: [],
    position: 1,
    ...overrides,
  };
}
