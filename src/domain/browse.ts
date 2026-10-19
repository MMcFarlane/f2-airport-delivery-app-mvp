import type { MenuItem, Restaurant } from './types';

export type MenuAvailability = 'full' | 'partial' | 'late';

export type RestaurantSort = 'fastest' | 'name';

export type RestaurantFilter = { type: 'fits' } | { type: 'under10' } | { type: 'cuisine'; label: string };

export type FeaturedSort = 'fastest' | 'price';

export type FeaturedFilter =
  | { type: 'all' }
  | { type: 'under10' }
  | { type: 'under10dollars' }
  | { type: 'category'; label: string };

export type SpecialSort = 'listed' | 'fastest';

export function menuAvailability(
  fastestPrepMinutes: number,
  itemPrepMinutes: readonly number[],
  fits: (prepMinutes: number) => boolean,
): MenuAvailability {
  if (!fits(fastestPrepMinutes)) return 'late';
  return itemPrepMinutes.every((minutes) => fits(minutes)) ? 'full' : 'partial';
}

export function availabilityLabel(availability: MenuAvailability, deliverByClock: string): string {
  if (availability === 'full') return 'Full menu available';
  if (availability === 'partial') return 'Some items too slow for your flight';
  return `Too late for ${deliverByClock}`;
}

export function cuisineChipLabels(restaurants: readonly Pick<Restaurant, 'cuisine'>[]): string[] {
  const labels: string[] = [];
  for (const restaurant of restaurants) {
    const label = restaurant.cuisine.split(',')[0]?.trim();
    if (label && !labels.includes(label)) labels.push(label);
  }
  return labels;
}

export function categoryChipLabels(items: readonly Pick<MenuItem, 'category'>[]): string[] {
  const labels: string[] = [];
  for (const item of items) {
    if (item.category && !labels.includes(item.category)) labels.push(item.category);
  }
  return labels;
}

export function specialTagLabels(items: readonly Pick<MenuItem, 'tags'>[]): string[] {
  const labels: string[] = [];
  for (const item of items) {
    for (const tag of item.tags) {
      if (!labels.includes(tag)) labels.push(tag);
    }
  }
  return labels;
}

export function restaurantVisible(
  restaurant: Restaurant,
  availability: MenuAvailability,
  filter: RestaurantFilter | null,
  query: string,
): boolean {
  if (!matchesQuery(query, [restaurant.name, restaurant.cuisine, restaurant.location])) return false;
  if (!filter) return true;
  if (filter.type === 'fits') return availability !== 'late';
  if (filter.type === 'under10') return restaurant.fastestPrepMinutes < 10;
  return restaurant.cuisine.toLowerCase().includes(filter.label.toLowerCase());
}

export function sortRestaurants(
  restaurants: readonly Restaurant[],
  sort: RestaurantSort,
  availabilityOf: (restaurant: Restaurant) => MenuAvailability,
): Restaurant[] {
  return [...restaurants].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    const lateA = availabilityOf(a) === 'late' ? 1 : 0;
    const lateB = availabilityOf(b) === 'late' ? 1 : 0;
    if (lateA !== lateB) return lateA - lateB;
    return a.fastestPrepMinutes - b.fastestPrepMinutes || a.name.localeCompare(b.name);
  });
}

export function featuredVisible(item: MenuItem, filter: FeaturedFilter | null, query: string): boolean {
  if (!matchesQuery(query, [item.name, item.restaurantName, item.category ?? '', item.description])) return false;
  if (!filter || filter.type === 'all') return true;
  if (filter.type === 'under10') return item.prepMinutes < 10;
  if (filter.type === 'under10dollars') return item.priceCents < 1000;
  return item.category === filter.label;
}

export function sortFeatured(
  items: readonly MenuItem[],
  sort: FeaturedSort,
  fits: (prepMinutes: number) => boolean,
): MenuItem[] {
  return [...items].sort((a, b) => {
    const lateA = fits(a.prepMinutes) ? 0 : 1;
    const lateB = fits(b.prepMinutes) ? 0 : 1;
    if (lateA !== lateB) return lateA - lateB;
    if (sort === 'price') return a.priceCents - b.priceCents || a.prepMinutes - b.prepMinutes;
    return a.prepMinutes - b.prepMinutes || a.priceCents - b.priceCents;
  });
}

export function specialVisible(item: MenuItem, tag: string | null, query: string): boolean {
  if (!matchesQuery(query, [item.name, item.restaurantName, item.description, item.badge ?? ''])) return false;
  if (!tag) return true;
  return item.tags.some((entry) => entry.toLowerCase() === tag.toLowerCase());
}

export function sortSpecials(
  items: readonly MenuItem[],
  sort: SpecialSort,
  fits: (prepMinutes: number) => boolean,
): MenuItem[] {
  return [...items].sort((a, b) => {
    const lateA = fits(a.prepMinutes) ? 0 : 1;
    const lateB = fits(b.prepMinutes) ? 0 : 1;
    if (lateA !== lateB) return lateA - lateB;
    if (sort === 'fastest') return a.prepMinutes - b.prepMinutes || a.position - b.position;
    return a.position - b.position;
  });
}

export function reachCountLabel(count: number, gate: string): string {
  const noun = count === 1 ? 'restaurant' : 'restaurants';
  return `${count} ${noun} can reach ${gate}`;
}

export function featuredCountLabel(count: number, deliverByClock: string, sort: FeaturedSort): string {
  const items = count === 1 ? 'item arrives' : 'items arrive';
  const sorted = sort === 'price' ? 'price' : 'fastest';
  return `${count} ${items} before ${deliverByClock} · sorted by ${sorted}`;
}

export function specialsLine(gate: string, deliverByClock: string): string {
  return `Deals that still reach Gate ${gate} by ${deliverByClock}`;
}

function matchesQuery(query: string, fields: readonly string[]): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((field) => field.toLowerCase().includes(needle));
}

export const hubChipIds = ['ready10', 'under20', 'under10dollars'] as const;

export type HubChip = (typeof hubChipIds)[number];

export const hubCategoryIds = ['coffee', 'breakfast', 'burgers', 'healthy', 'bar', 'flight'] as const;

export type HubCategoryId = (typeof hubCategoryIds)[number];

export type HubCategorySummary = {
  id: HubCategoryId;
  title: string;
  detail: string;
};

export type HubCounts = {
  restaurants: number;
  featured: number;
  specials: number;
};

const hubCategories: { id: HubCategoryId; title: string }[] = [
  { id: 'coffee', title: 'Coffee & pastries' },
  { id: 'breakfast', title: 'Breakfast' },
  { id: 'burgers', title: 'Burgers & sandwiches' },
  { id: 'healthy', title: 'Healthy & bowls' },
  { id: 'bar', title: 'Bar & drinks 21+' },
  { id: 'flight', title: 'For the flight' },
];

const categoryNeedles: Record<Exclude<HubCategoryId, 'breakfast' | 'flight'>, readonly string[]> = {
  coffee: ['coffee', 'pastry'],
  burgers: ['burger', 'sandwich'],
  healthy: ['bowl', 'smoothie', 'poke'],
  bar: ['beer', 'wine', 'wings'],
};

export function parseHubChip(value: string | null | undefined): HubChip | null {
  return hubChipIds.find((chip) => chip === value) ?? null;
}

export function parseHubCategory(value: string | null | undefined): HubCategoryId | null {
  return hubCategoryIds.find((category) => category === value) ?? null;
}

export function restaurantPassesHub(
  restaurant: Restaurant,
  items: readonly MenuItem[],
  chip: HubChip | null,
  query: string,
): boolean {
  if (!matchesQuery(query, [restaurant.name, restaurant.cuisine, restaurant.location])) return false;
  if (chip === 'ready10') return restaurant.fastestPrepMinutes <= 10;
  if (chip === 'under20') return restaurant.fastestPrepMinutes < 20;
  if (chip === 'under10dollars') {
    return items.some((item) => item.restaurantId === restaurant.id && item.priceCents < 1000);
  }
  return true;
}

export function itemPassesHub(item: MenuItem, chip: HubChip | null, query: string): boolean {
  if (!matchesQuery(query, [item.name, item.description, item.category ?? '', item.badge ?? ''])) return false;
  if (chip === 'ready10') return item.prepMinutes <= 10;
  if (chip === 'under20') return item.prepMinutes < 20;
  if (chip === 'under10dollars') return item.priceCents < 1000;
  return true;
}

export function restaurantInCategory(
  restaurant: Restaurant,
  items: readonly MenuItem[],
  category: HubCategoryId,
): boolean {
  if (category === 'flight') return false;
  const own = items.filter((item) => item.restaurantId === restaurant.id);
  if (category === 'breakfast') {
    return own.some((item) => item.tags.some((tag) => tag.toLowerCase() === 'breakfast'));
  }
  const haystack = [restaurant.cuisine, ...own.map((item) => item.category ?? '')].join('\n').toLowerCase();
  return categoryNeedles[category].some((needle) => haystack.includes(needle));
}

export function hubCounts(
  restaurants: readonly Restaurant[],
  featured: readonly MenuItem[],
  specials: readonly MenuItem[],
  items: readonly MenuItem[],
  chip: HubChip | null,
  query: string,
): HubCounts {
  return {
    restaurants: restaurants.filter((restaurant) => restaurantPassesHub(restaurant, items, chip, query)).length,
    featured: featured.filter((item) => itemPassesHub(item, chip, query)).length,
    specials: specials.filter((item) => itemPassesHub(item, chip, query)).length,
  };
}

export function hubCategorySummaries(
  restaurants: readonly Restaurant[],
  items: readonly MenuItem[],
  chip: HubChip | null,
  query: string,
): HubCategorySummary[] {
  return hubCategories.map((category) => {
    if (category.id === 'flight') return { ...category, detail: 'PACKED TO TRAVEL' };
    const places = restaurants.filter(
      (restaurant) =>
        restaurantInCategory(restaurant, items, category.id) && restaurantPassesHub(restaurant, items, chip, query),
    );
    return { ...category, detail: placeDetail(places) };
  });
}

function placeDetail(places: readonly Restaurant[]): string {
  if (places.length === 0) return '0 PLACES';
  const fastest = Math.min(...places.map((place) => place.fastestPrepMinutes));
  const label = places.length === 1 ? 'PLACE' : 'PLACES';
  return `${places.length} ${label} · ${fastest} MIN+`;
}
