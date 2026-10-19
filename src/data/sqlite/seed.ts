import type { SQLiteDatabase } from 'expo-sqlite';

type SeedRestaurant = {
  id: string;
  name: string;
  initials: string;
  color: string;
  cuisine: string;
  location: string;
  fastestPrepMinutes: number;
  openUntil: string | null;
  position: number;
};

type SeedItem = {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  priceCents: number;
  prepMinutes: number;
  category: string | null;
  imageColor: string;
  featured: boolean;
  popular: boolean;
  kind: 'item' | 'special';
  badge: string | null;
  compareAtCents: number | null;
  tags: string[];
  position: number;
};

type SeedOrderLine = {
  itemId: string | null;
  name: string;
  priceCents: number;
  quantity: number;
  prepMinutes: number;
};

type SeedOrder = {
  id: string;
  restaurantId: string;
  code: string;
  gate: string;
  totalCents: number;
  placedAt: string;
  summary: string;
  lines: SeedOrderLine[];
};

const restaurants: SeedRestaurant[] = [
  {
    id: 'gate-cafe',
    name: 'Gate Café',
    initials: 'GC',
    color: '#FFFFFF',
    cuisine: 'Coffee, pastries',
    location: 'Near B12',
    fastestPrepMinutes: 5,
    openUntil: null,
    position: 1,
  },
  {
    id: 'jetstream-juice',
    name: 'Jetstream Juice',
    initials: 'JJ',
    color: '#3B6DFF',
    cuisine: 'Smoothies, bowls',
    location: 'Near B16',
    fastestPrepMinutes: 6,
    openUntil: null,
    position: 2,
  },
  {
    id: 'runway-burger',
    name: 'Runway Burger',
    initials: 'RB',
    color: '#FFC940',
    cuisine: 'Burgers, fries, shakes',
    location: 'Concourse B, near gate B9',
    fastestPrepMinutes: 8,
    openUntil: '22:00',
    position: 3,
  },
  {
    id: 'terminal-taco',
    name: 'Terminal Taco',
    initials: 'TT',
    color: '#111111',
    cuisine: 'Tacos, bowls',
    location: 'Near B20',
    fastestPrepMinutes: 11,
    openUntil: null,
    position: 4,
  },
  {
    id: 'wing-bar',
    name: 'Wing Bar',
    initials: 'WB',
    color: '#4A4A4A',
    cuisine: 'Wings, beer, wine',
    location: 'Food court',
    fastestPrepMinutes: 13,
    openUntil: null,
    position: 5,
  },
  {
    id: 'sky-noodle',
    name: 'Sky Noodle',
    initials: 'SN',
    color: '#D64545',
    cuisine: 'Ramen, poke, dumplings',
    location: 'Food court',
    fastestPrepMinutes: 14,
    openUntil: null,
    position: 6,
  },
  {
    id: 'concourse-pizza',
    name: 'Concourse Pizza',
    initials: 'CP',
    color: '#F2B36B',
    cuisine: 'Pizza, salads',
    location: 'Concourse A',
    fastestPrepMinutes: 24,
    openUntil: null,
    position: 7,
  },
];

const menuItems: SeedItem[] = [
  {
    id: 'double-smash-burger',
    restaurantId: 'runway-burger',
    name: 'Double smash burger',
    description:
      "Two thin-smashed beef patties, melted American cheese, pickles, onions and house sauce on a toasted potato bun. Packed to travel, so it's still hot at the gate.",
    priceCents: 1450,
    prepMinutes: 12,
    category: 'Burgers',
    imageColor: '#F2B36B',
    featured: true,
    popular: true,
    kind: 'item',
    badge: null,
    compareAtCents: null,
    tags: [],
    position: 1,
  },
  {
    id: 'crispy-chicken-sandwich',
    restaurantId: 'runway-burger',
    name: 'Crispy chicken sandwich',
    description: 'Buttermilk thigh, slaw, hot honey',
    priceCents: 1300,
    prepMinutes: 14,
    category: 'Chicken',
    imageColor: '#E7C48A',
    featured: false,
    popular: true,
    kind: 'item',
    badge: null,
    compareAtCents: null,
    tags: [],
    position: 2,
  },
  {
    id: 'classic-cheeseburger',
    restaurantId: 'runway-burger',
    name: 'Classic cheeseburger',
    description: 'Single patty, cheddar, lettuce, tomato',
    priceCents: 1100,
    prepMinutes: 10,
    category: 'Burgers',
    imageColor: '#E8B56A',
    featured: false,
    popular: true,
    kind: 'item',
    badge: null,
    compareAtCents: null,
    tags: [],
    position: 3,
  },
  {
    id: 'loaded-fries',
    restaurantId: 'runway-burger',
    name: 'Loaded fries',
    description: 'Cheese sauce, bacon, scallions',
    priceCents: 650,
    prepMinutes: 8,
    category: 'Sides',
    imageColor: '#F0D56A',
    featured: false,
    popular: true,
    kind: 'item',
    badge: null,
    compareAtCents: null,
    tags: [],
    position: 4,
  },
  {
    id: 'smoked-brisket-platter',
    restaurantId: 'runway-burger',
    name: 'Smoked brisket platter',
    description: '12-hour brisket, two sides, cornbread',
    priceCents: 2100,
    prepMinutes: 48,
    category: null,
    imageColor: '#D4B08A',
    featured: false,
    popular: true,
    kind: 'item',
    badge: null,
    compareAtCents: null,
    tags: [],
    position: 5,
  },
  {
    id: 'cold-brew-croissant',
    restaurantId: 'gate-cafe',
    name: 'Cold brew + croissant',
    description: 'Cold brew and an almond croissant',
    priceCents: 850,
    prepMinutes: 6,
    category: 'Coffee',
    imageColor: '#C4A574',
    featured: true,
    popular: false,
    kind: 'item',
    badge: null,
    compareAtCents: null,
    tags: [],
    position: 1,
  },
  {
    id: 'acai-bowl',
    restaurantId: 'jetstream-juice',
    name: 'Açaí bowl',
    description: 'Açaí, granola, and fruit',
    priceCents: 1100,
    prepMinutes: 8,
    category: 'Bowls',
    imageColor: '#7B5EA7',
    featured: true,
    popular: false,
    kind: 'item',
    badge: null,
    compareAtCents: null,
    tags: [],
    position: 1,
  },
  {
    id: 'chicken-tinga-tacos',
    restaurantId: 'terminal-taco',
    name: 'Chicken tinga tacos',
    description: 'Shredded chicken tinga, onion, and cilantro',
    priceCents: 975,
    prepMinutes: 11,
    category: 'Tacos',
    imageColor: '#E08A5A',
    featured: true,
    popular: false,
    kind: 'item',
    badge: null,
    compareAtCents: null,
    tags: [],
    position: 1,
  },
  {
    id: 'spicy-tuna-poke-bowl',
    restaurantId: 'sky-noodle',
    name: 'Spicy tuna poke bowl',
    description: 'Spicy tuna, rice, and greens',
    priceCents: 1600,
    prepMinutes: 18,
    category: 'Bowls',
    imageColor: '#E07A6A',
    featured: true,
    popular: false,
    kind: 'item',
    badge: null,
    compareAtCents: null,
    tags: [],
    position: 1,
  },
  {
    id: 'wood-fired-pizza',
    restaurantId: 'concourse-pizza',
    name: 'Wood-fired pizza',
    description: 'Wood-fired pie with tomato and mozzarella',
    priceCents: 1700,
    prepMinutes: 52,
    category: 'Pizza',
    imageColor: '#E6D3A3',
    featured: true,
    popular: false,
    kind: 'item',
    badge: null,
    compareAtCents: null,
    tags: [],
    position: 1,
  },
  {
    id: 'pre-flight-combo',
    restaurantId: 'runway-burger',
    name: 'Pre-flight combo',
    description: 'Smash burger, fries and a drink',
    priceCents: 1899,
    prepMinutes: 14,
    category: null,
    imageColor: '#F2B36B',
    featured: false,
    popular: false,
    kind: 'special',
    badge: 'SAVE $4',
    compareAtCents: 2299,
    tags: ['Combos'],
    position: 1,
  },
  {
    id: 'breakfast-for-two',
    restaurantId: 'gate-cafe',
    name: 'Breakfast for two',
    description: '2 coffees + 2 pastries',
    priceCents: 1400,
    prepMinutes: 7,
    category: null,
    imageColor: '#D4B08A',
    featured: false,
    popular: false,
    kind: 'special',
    badge: 'BUNDLE',
    compareAtCents: 1700,
    tags: ['Breakfast'],
    position: 2,
  },
  {
    id: 'carry-on-snack-pack',
    restaurantId: 'jetstream-juice',
    name: 'Carry-on snack pack',
    description: 'Wrap, fruit cup, water. Packed to fly.',
    priceCents: 1150,
    prepMinutes: 9,
    category: null,
    imageColor: '#A8C48A',
    featured: false,
    popular: false,
    kind: 'special',
    badge: 'FOR THE FLIGHT',
    compareAtCents: 1425,
    tags: ['For the flight'],
    position: 3,
  },
  {
    id: 'taco-duo',
    restaurantId: 'terminal-taco',
    name: 'Taco duo + agua fresca',
    description: 'Any two tacos and a drink',
    priceCents: 1600,
    prepMinutes: 11,
    category: null,
    imageColor: '#E08A5A',
    featured: false,
    popular: false,
    kind: 'special',
    badge: '2 FOR $16',
    compareAtCents: 1950,
    tags: ['Combos'],
    position: 4,
  },
  {
    id: 'wings-draft',
    restaurantId: 'wing-bar',
    name: 'Wings + draft beer',
    description: '6 wings, any 16 oz draft. 21+, ID at gate.',
    priceCents: 1500,
    prepMinutes: 13,
    category: null,
    imageColor: '#C47A45',
    featured: false,
    popular: false,
    kind: 'special',
    badge: 'HAPPY HOUR',
    compareAtCents: 1900,
    tags: ['Drinks'],
    position: 5,
  },
];

const pastOrders: SeedOrder[] = [
  {
    id: 'order-gate-cafe-sep28',
    restaurantId: 'gate-cafe',
    code: 'C4N2',
    gate: 'C22',
    totalCents: 980,
    placedAt: '2026-09-28T07:41:00-04:00',
    summary: 'Oat milk latte, almond croissant',
    lines: [
      { itemId: null, name: 'Oat milk latte', priceCents: 540, quantity: 1, prepMinutes: 5 },
      { itemId: null, name: 'Almond croissant', priceCents: 440, quantity: 1, prepMinutes: 5 },
    ],
  },
  {
    id: 'order-sky-noodle-sep14',
    restaurantId: 'sky-noodle',
    code: 'M8PQ',
    gate: 'A7',
    totalCents: 2415,
    placedAt: '2026-09-14T18:02:00-04:00',
    summary: 'Spicy tuna poke bowl, miso soup',
    lines: [
      {
        itemId: 'spicy-tuna-poke-bowl',
        name: 'Spicy tuna poke bowl',
        priceCents: 1600,
        quantity: 1,
        prepMinutes: 18,
      },
      { itemId: null, name: 'Miso soup', priceCents: 815, quantity: 1, prepMinutes: 14 },
    ],
  },
  {
    id: 'order-runway-burger-aug30',
    restaurantId: 'runway-burger',
    code: 'R3WD',
    gate: 'B3',
    totalCents: 2340,
    placedAt: '2026-08-30T12:18:00-04:00',
    summary: 'Pre-flight combo',
    lines: [
      {
        itemId: 'pre-flight-combo',
        name: 'Pre-flight combo',
        priceCents: 2340,
        quantity: 1,
        prepMinutes: 14,
      },
    ],
  },
];

function flag(value: boolean): number {
  return value ? 1 : 0;
}

export async function seedFixtures(db: SQLiteDatabase): Promise<void> {
  for (const restaurant of restaurants) {
    await db.runAsync(
      `INSERT INTO restaurants (
        id, source, place_id, name, initials, color, cuisine, location,
        fastest_prep_minutes, open_until, address, latitude, longitude, rating,
        photo_reference, primary_type, position
      ) VALUES (?, 'fixtures', NULL, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, ?)`,
      restaurant.id,
      restaurant.name,
      restaurant.initials,
      restaurant.color,
      restaurant.cuisine,
      restaurant.location,
      restaurant.fastestPrepMinutes,
      restaurant.openUntil,
      restaurant.position,
    );
  }

  for (const item of menuItems) {
    await db.runAsync(
      `INSERT INTO menu_items (
        id, restaurant_id, name, description, price_cents, prep_minutes, category,
        image_color, featured, popular, kind, badge, compare_at_cents, tags, position
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      item.id,
      item.restaurantId,
      item.name,
      item.description,
      item.priceCents,
      item.prepMinutes,
      item.category,
      item.imageColor,
      flag(item.featured),
      flag(item.popular),
      item.kind,
      item.badge,
      item.compareAtCents,
      JSON.stringify(item.tags),
      item.position,
    );
  }

  await db.runAsync(
    `INSERT INTO discount_codes (code, percent_off, label) VALUES ('FLY10', 10, '10% off this item')`,
  );

  await db.runAsync(
    `INSERT INTO profile (
      id, name, email, phone, card_brand, card_last4, dietary, order_updates, boarding_reminders, deals
    ) VALUES (1, 'Jordan', 'jordan@example.com', '(555) 010-0142', 'Visa', '4242', ?, 1, 1, 0)`,
    JSON.stringify(['Vegetarian', 'Nut allergy']),
  );

  await db.runAsync(`INSERT INTO cart_meta (id, tip_cents) VALUES (1, 300)`);

  for (const order of pastOrders) {
    const restaurant = restaurants.find((entry) => entry.id === order.restaurantId);
    await db.runAsync(
      `INSERT INTO orders (
        id, restaurant_id, restaurant_name, status, code, gate, passenger_name,
        total_cents, placed_at, summary, delivered_at
      ) VALUES (?, ?, ?, 'delivered', ?, ?, 'Jordan', ?, ?, ?, ?)`,
      order.id,
      order.restaurantId,
      restaurant?.name ?? order.restaurantId,
      order.code,
      order.gate,
      order.totalCents,
      order.placedAt,
      order.summary,
      order.placedAt,
    );

    for (const line of order.lines) {
      await db.runAsync(
        `INSERT INTO order_lines (order_id, item_id, name, price_cents, quantity, prep_minutes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        order.id,
        line.itemId,
        line.name,
        line.priceCents,
        line.quantity,
        line.prepMinutes,
      );
    }
  }

  await insertDemoActiveOrder(db);
}

/** Artboard in-progress card. A newer checkout order replaces it on the Orders tab. */
const demoActiveOrder: SeedOrder = {
  id: 'order-runway-burger-active',
  restaurantId: 'runway-burger',
  code: '7K4Q',
  gate: 'B14',
  totalCents: 1450,
  placedAt: '2026-10-17T14:16:00-04:00',
  summary: 'Double smash burger',
  lines: [
    {
      itemId: 'double-smash-burger',
      name: 'Double smash burger',
      priceCents: 1450,
      quantity: 1,
      prepMinutes: 12,
    },
  ],
};

export async function insertDemoActiveOrder(db: SQLiteDatabase): Promise<void> {
  const existing = await db.getFirstAsync<{ id: string }>(`SELECT id FROM orders WHERE id = ?`, demoActiveOrder.id);
  if (existing) return;

  const restaurant = await db.getFirstAsync<{ name: string }>(
    `SELECT name FROM restaurants WHERE id = ?`,
    demoActiveOrder.restaurantId,
  );
  if (!restaurant) return;

  await db.runAsync(
    `INSERT INTO orders (
      id, restaurant_id, restaurant_name, status, code, gate, passenger_name,
      total_cents, placed_at, summary, delivered_at
    ) VALUES (?, ?, ?, 'being_prepared', ?, ?, 'Jordan', ?, ?, ?, NULL)`,
    demoActiveOrder.id,
    demoActiveOrder.restaurantId,
    restaurant.name,
    demoActiveOrder.code,
    demoActiveOrder.gate,
    demoActiveOrder.totalCents,
    demoActiveOrder.placedAt,
    demoActiveOrder.summary,
  );

  for (const line of demoActiveOrder.lines) {
    await db.runAsync(
      `INSERT INTO order_lines (order_id, item_id, name, price_cents, quantity, prep_minutes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      demoActiveOrder.id,
      line.itemId,
      line.name,
      line.priceCents,
      line.quantity,
      line.prepMinutes,
    );
  }
}
