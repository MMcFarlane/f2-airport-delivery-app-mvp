import type { Concourse } from '../../config/airport';

import type { ConcourseSource } from './concourse';

export type PlacesRestaurantRecord = {
  id: string;
  placeId: string;
  name: string;
  initials: string;
  color: string;
  cuisine: string;
  location: string;
  fastestPrepMinutes: number;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  photoReference: string | null;
  primaryType: string | null;
  concourse: Concourse | null;
  /** How the concourse was decided. Kept for later checking, never shown in the app. */
  concourseSource: ConcourseSource | null;
  /** True only when a person checked the concourse. A later phase can hide the rest. */
  concourseConfirmed: boolean;
  position: number;
};

export type PlacesMenuRecord = {
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

export type PlacesCatalog = {
  restaurants: PlacesRestaurantRecord[];
  items: PlacesMenuRecord[];
};

export type PlaceIdentity = {
  placeId: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  photoReference: string | null;
  primaryType: string | null;
  primaryTypeLabel: string | null;
};
