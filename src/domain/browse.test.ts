import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  availabilityLabel,
  categoryChipLabels,
  cuisineChipLabels,
  featuredCountLabel,
  featuredVisible,
  hubCategorySummaries,
  hubCounts,
  itemPassesHub,
  menuAvailability,
  parseHubCategory,
  parseHubChip,
  reachCountLabel,
  restaurantInCategory,
  restaurantPassesHub,
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

describe('browse hub', () => {
  const restaurants = [
    restaurant({ id: 'gate-cafe', name: 'Gate Café', cuisine: 'Coffee, pastries', location: 'Near B12', fastestPrepMinutes: 5 }),
    restaurant({ id: 'jetstream-juice', name: 'Jetstream Juice', cuisine: 'Smoothies, bowls', fastestPrepMinutes: 6 }),
    restaurant({ id: 'runway-burger', name: 'Runway Burger', cuisine: 'Burgers, fries, shakes', fastestPrepMinutes: 8 }),
    restaurant({ id: 'terminal-taco', name: 'Terminal Taco', cuisine: 'Tacos, bowls', fastestPrepMinutes: 11 }),
    restaurant({ id: 'wing-bar', name: 'Wing Bar', cuisine: 'Wings, beer, wine', fastestPrepMinutes: 13 }),
    restaurant({ id: 'sky-noodle', name: 'Sky Noodle', cuisine: 'Ramen, poke, dumplings', fastestPrepMinutes: 14 }),
    restaurant({ id: 'concourse-pizza', name: 'Concourse Pizza', cuisine: 'Pizza, salads', fastestPrepMinutes: 24 }),
  ];
  const featured = [
    item({ id: 'smash', restaurantId: 'runway-burger', name: 'Double smash burger', priceCents: 1450, prepMinutes: 12, category: 'Burgers' }),
    item({ id: 'cold-brew', restaurantId: 'gate-cafe', name: 'Cold brew + croissant', description: 'Cold brew and an almond croissant', priceCents: 850, prepMinutes: 6, category: 'Coffee' }),
    item({ id: 'acai', restaurantId: 'jetstream-juice', name: 'Açaí bowl', priceCents: 1100, prepMinutes: 8, category: 'Bowls' }),
    item({ id: 'tacos', restaurantId: 'terminal-taco', name: 'Chicken tinga tacos', priceCents: 975, prepMinutes: 11, category: 'Tacos' }),
    item({ id: 'poke', restaurantId: 'sky-noodle', name: 'Spicy tuna poke bowl', priceCents: 1600, prepMinutes: 18, category: 'Bowls' }),
    item({ id: 'pizza', restaurantId: 'concourse-pizza', name: 'Wood-fired pizza', priceCents: 1700, prepMinutes: 52, category: 'Pizza' }),
  ];
  const specials = [
    item({ id: 'combo', restaurantId: 'runway-burger', name: 'Pre-flight combo', description: 'Smash burger, fries and a drink', priceCents: 1899, prepMinutes: 14, badge: 'SAVE $4', tags: ['Combos'] }),
    item({ id: 'breakfast', restaurantId: 'gate-cafe', name: 'Breakfast for two', priceCents: 1400, prepMinutes: 7, tags: ['Breakfast'] }),
    item({ id: 'flight', restaurantId: 'jetstream-juice', name: 'Carry-on snack pack', priceCents: 1150, prepMinutes: 9, tags: ['For the flight'] }),
    item({ id: 'duo', restaurantId: 'terminal-taco', name: 'Taco duo + agua fresca', priceCents: 1600, prepMinutes: 11, tags: ['Combos'] }),
    item({ id: 'wings', restaurantId: 'wing-bar', name: 'Wings + draft beer', priceCents: 1500, prepMinutes: 13, tags: ['Drinks'] }),
  ];
  const fries = item({
    id: 'fries',
    restaurantId: 'runway-burger',
    name: 'Loaded fries',
    priceCents: 650,
    prepMinutes: 8,
    category: 'Sides',
  });
  const items = [...featured, ...specials, fries];

  it('keeps the 52-minute pizza in the unfiltered totals', () => {
    assert.deepEqual(hubCounts(restaurants, featured, specials, items, null, ''), {
      restaurants: 7,
      featured: 6,
      specials: 5,
    });
    assert.deepEqual(
      hubCategorySummaries(restaurants, items, null, '').map((entry) => [entry.title, entry.detail]),
      [
        ['Coffee & pastries', '1 PLACE · 5 MIN+'],
        ['Breakfast', '1 PLACE · 5 MIN+'],
        ['Burgers & sandwiches', '1 PLACE · 8 MIN+'],
        ['Healthy & bowls', '3 PLACES · 6 MIN+'],
        ['Bar & drinks 21+', '1 PLACE · 13 MIN+'],
        ['For the flight', 'PACKED TO TRAVEL'],
      ],
    );
  });

  it('filters restaurants, featured items, and specials by the hub chips', () => {
    assert.deepEqual(hubCounts(restaurants, featured, specials, items, 'ready10', ''), {
      restaurants: 3,
      featured: 2,
      specials: 2,
    });
    assert.deepEqual(hubCounts(restaurants, featured, specials, items, 'under20', ''), {
      restaurants: 6,
      featured: 5,
      specials: 5,
    });
    assert.deepEqual(hubCounts(restaurants, featured, specials, items, 'under10dollars', ''), {
      restaurants: 3,
      featured: 2,
      specials: 0,
    });
    assert.equal(itemPassesHub(item({ id: 'ten', name: 'Ten', priceCents: 1000, prepMinutes: 10 }), 'ready10', ''), true);
    assert.equal(itemPassesHub(item({ id: 'eleven', name: 'Eleven', priceCents: 900, prepMinutes: 11 }), 'ready10', ''), false);
    assert.equal(itemPassesHub(item({ id: 'nineteen', name: 'Nineteen', priceCents: 900, prepMinutes: 19 }), 'under20', ''), true);
    assert.equal(itemPassesHub(item({ id: 'twenty', name: 'Twenty', priceCents: 900, prepMinutes: 20 }), 'under20', ''), false);
    assert.equal(itemPassesHub(item({ id: 'cheap', name: 'Cheap', priceCents: 999, prepMinutes: 30 }), 'under10dollars', ''), true);
    assert.equal(itemPassesHub(item({ id: 'ten-dollars', name: 'Ten dollars', priceCents: 1000, prepMinutes: 5 }), 'under10dollars', ''), false);
  });

  it('matches restaurant fields and item name, description, category, and badge', () => {
    assert.equal(hubCounts(restaurants, featured, specials, items, null, 'croissant').featured, 1);
    assert.equal(hubCounts(restaurants, featured, specials, items, null, 'croissant').restaurants, 0);
    assert.equal(hubCounts(restaurants, featured, specials, items, null, 'b12').restaurants, 1);
    assert.equal(hubCounts(restaurants, featured, specials, items, null, 'save $4').specials, 1);
    assert.equal(restaurantPassesHub(restaurants[2]!, items, 'under10dollars', ''), true);
    assert.equal(restaurantPassesHub(restaurants[6]!, items, 'under10dollars', ''), false);
  });

  it('counts places from restaurants that belong, and drops a category to zero places', () => {
    const ready = hubCategorySummaries(restaurants, items, 'ready10', '');
    assert.equal(ready.find((entry) => entry.id === 'healthy')?.detail, '1 PLACE · 6 MIN+');
    assert.equal(ready.find((entry) => entry.id === 'bar')?.detail, '0 PLACES');
    assert.equal(ready.find((entry) => entry.id === 'flight')?.detail, 'PACKED TO TRAVEL');

    const deli = restaurant({ id: 'deli', name: 'Deli', cuisine: 'Salads', fastestPrepMinutes: 9 });
    const sandwich = item({ id: 'sandwich', restaurantId: 'deli', name: 'Turkey sandwich', priceCents: 900, prepMinutes: 9, category: 'Sandwiches' });
    assert.equal(restaurantInCategory(deli, [sandwich], 'burgers'), true);
    assert.equal(restaurantInCategory(restaurants[0]!, items, 'flight'), false);
    assert.equal(parseHubChip('ready10'), 'ready10');
    assert.equal(parseHubChip('fits'), null);
    assert.equal(parseHubCategory('flight'), 'flight');
    assert.equal(parseHubCategory('pastry'), null);
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
    concourseConfirmed: false,
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
