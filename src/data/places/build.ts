import { concourseLocation, type ConcoursePlacement } from './concourse';
import { cuisineGroupFor, dishImageKey, MENU_SLOTS } from './menus';
import type { PlaceIdentity, PlacesMenuRecord, PlacesRestaurantRecord } from './types';

const MARK_COLORS = ['#FFC940', '#3B6DFF', '#111111', '#D64545', '#F2B36B', '#4A4A4A', '#1F6B3A', '#7B5EA7'] as const;

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

/** Four demo dishes from the restaurant's cuisine group. IDs stay `{restaurantId}-{slot}` across re-seeds. */
export function buildMenu(restaurantId: string, primaryType: string | null): PlacesMenuRecord[] {
  const group = cuisineGroupFor(primaryType);
  return MENU_SLOTS.map((slot, position) => {
    const dish = group.dishes[slot.slug];
    return {
      id: `${restaurantId}-${slot.slug}`,
      restaurantId,
      name: dish.name,
      description: dish.description,
      priceCents: slot.priceCents,
      prepMinutes: slot.prepMinutes,
      category: dish.category,
      imageColor: slot.imageColor,
      imageKey: dishImageKey(group.id, slot.slug),
      featured: slot.featured,
      popular: slot.popular,
      kind: slot.kind,
      badge: slot.badge,
      compareAtCents: slot.compareAtCents,
      tags: dish.tags,
      position: position + 1,
    };
  });
}

export function buildRestaurant(
  identity: PlaceIdentity,
  position: number,
  placement: ConcoursePlacement,
): PlacesRestaurantRecord {
  const id = restaurantIdFor(identity.placeId);
  const menu = buildMenu(id, identity.primaryType);
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
