import { concourseLocation, type ConcoursePlacement } from './concourse';
import type { PlaceIdentity, PlacesMenuRecord, PlacesRestaurantRecord } from './types';

const MARK_COLORS = ['#FFC940', '#3B6DFF', '#111111', '#D64545', '#F2B36B', '#4A4A4A', '#1F6B3A', '#7B5EA7'] as const;

const MENU_TEMPLATES = [
  {
    slug: 'quick',
    name: 'Quick bite',
    description: 'A short prep that can still make a tight departure.',
    priceCents: 900,
    prepMinutes: 8,
    category: 'Quick',
    imageColor: '#F2B36B',
    featured: true,
    popular: true,
    kind: 'item' as const,
    badge: null,
    compareAtCents: null,
  },
  {
    slug: 'plate',
    name: 'House plate',
    description: 'The kitchen’s standard plate, packed to travel.',
    priceCents: 1400,
    prepMinutes: 14,
    category: 'Plates',
    imageColor: '#E7C48A',
    featured: false,
    popular: true,
    kind: 'item' as const,
    badge: null,
    compareAtCents: null,
  },
  {
    slug: 'roast',
    name: 'Slow roast',
    description: 'A long prep that misses a tight connection.',
    priceCents: 2100,
    prepMinutes: 48,
    category: 'Plates',
    imageColor: '#D4B08A',
    featured: false,
    popular: false,
    kind: 'item' as const,
    badge: null,
    compareAtCents: null,
  },
  {
    slug: 'bundle',
    name: 'Gate bundle',
    description: 'A drink and a bite, packed together.',
    priceCents: 1600,
    prepMinutes: 12,
    category: null,
    imageColor: '#A8C48A',
    featured: false,
    popular: false,
    kind: 'special' as const,
    badge: 'BUNDLE',
    compareAtCents: 1900,
  },
] as const;

export function restaurantIdFor(placeId: string): string {
  return `place-${placeId}`;
}

export function initialsFor(name: string): string {
  const words = name
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0);
  if (words.length === 0) return 'AT';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

export function markColorFor(placeId: string): string {
  let hash = 0;
  for (const char of placeId) hash = (hash + char.charCodeAt(0)) % MARK_COLORS.length;
  return MARK_COLORS[hash] ?? MARK_COLORS[0];
}

export function cuisineFor(identity: PlaceIdentity): string {
  if (identity.primaryTypeLabel) return identity.primaryTypeLabel;
  if (!identity.primaryType) return 'Restaurant';
  return identity.primaryType
    .split('_')
    .filter((part) => part !== 'restaurant')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Restaurant';
}

export function buildMenu(restaurantId: string): PlacesMenuRecord[] {
  return MENU_TEMPLATES.map((template, position) => ({
    id: `${restaurantId}-${template.slug}`,
    restaurantId,
    name: template.name,
    description: template.description,
    priceCents: template.priceCents,
    prepMinutes: template.prepMinutes,
    category: template.category,
    imageColor: template.imageColor,
    featured: template.featured,
    popular: template.popular,
    kind: template.kind,
    badge: template.badge,
    compareAtCents: template.compareAtCents,
    tags: template.kind === 'special' ? ['Combos'] : [],
    position: position + 1,
  }));
}

export function buildRestaurant(
  identity: PlaceIdentity,
  position: number,
  placement: ConcoursePlacement,
): PlacesRestaurantRecord {
  const id = restaurantIdFor(identity.placeId);
  const menu = buildMenu(id);
  return {
    id,
    placeId: identity.placeId,
    name: identity.name,
    initials: initialsFor(identity.name),
    color: markColorFor(identity.placeId),
    cuisine: cuisineFor(identity),
    location: concourseLocation(placement.concourse, placement.nearGate),
    fastestPrepMinutes: Math.min(...menu.map((item) => item.prepMinutes)),
    address: identity.address,
    latitude: placement.latitude,
    longitude: placement.longitude,
    rating: identity.rating,
    photoReference: identity.photoReference,
    primaryType: identity.primaryType,
    concourse: placement.concourse,
    concourseSource: placement.source,
    concourseConfirmed: placement.confirmed,
    position,
  };
}
