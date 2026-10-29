import type { CatalogSource } from '@/src/config/catalog';

export const dietaryOptions = ['Vegetarian', 'Vegan', 'Gluten-free', 'Nut allergy', 'Halal'] as const;

export type DietaryPreference = (typeof dietaryOptions)[number];

export const orderStatuses = [
  'received',
  'being_prepared',
  'courier_on_the_way',
  'at_gate',
  'delivered',
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export type MenuItemKind = 'item' | 'special';

export type Restaurant = {
  id: string;
  source: CatalogSource;
  placeId: string | null;
  name: string;
  initials: string;
  color: string;
  cuisine: string;
  location: string;
  fastestPrepMinutes: number;
  openUntil: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  photoReference: string | null;
  primaryType: string | null;
  /** A person checked this restaurant's concourse. Stored for a later filter; no screen reads it. */
  concourseConfirmed: boolean;
};

export type MenuItem = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  name: string;
  description: string;
  priceCents: number;
  prepMinutes: number;
  category: string | null;
  imageColor: string;
  /** A bundled food photo, or null for the colored box. */
  imageKey: string | null;
  featured: boolean;
  popular: boolean;
  kind: MenuItemKind;
  badge: string | null;
  compareAtCents: number | null;
  tags: string[];
  position: number;
};

export type DiscountCode = {
  code: string;
  percentOff: number;
  label: string;
};

export type ProfileNotifications = {
  orderUpdates: boolean;
  boardingReminders: boolean;
  deals: boolean;
};

export type Profile = {
  name: string;
  email: string;
  phone: string;
  cardBrand: string;
  cardLast4: string;
  dietary: DietaryPreference[];
  notifications: ProfileNotifications;
};

export type GateSource = 'manual' | 'skylink';

export type Trip = {
  passengerName: string;
  gate: string;
  gateSource: GateSource;
  departureAt: string;
  flightNumber: string | null;
  airline: string | null;
  flightStatus: string | null;
};

/** Empty SkyLink gate and terminal strings become null. */
export type FlightGate = {
  gate: string | null;
  terminal: string | null;
  status: string | null;
};

export type DepartureFlight = {
  flightNumber: string;
  airline: string;
  status: string;
  destination: string;
  destinationIata: string;
  scheduledTime: string;
  departureDate: string;
};

export type CartLine = {
  itemId: string;
  name: string;
  restaurantId: string;
  restaurantName: string;
  priceCents: number;
  prepMinutes: number;
  quantity: number;
  note: string | null;
  discountCode: string | null;
  imageColor: string;
  imageKey: string | null;
};

/** A Google Places photo for one session. Never stored: Google does not allow caching photo names or URIs. */
export type PlacePhoto = {
  placeId: string;
  uri: string;
  width: number;
  height: number;
  authors: { name: string; uri: string | null }[];
};

export type Cart = {
  lines: CartLine[];
  tipCents: number;
};

export type OrderLine = {
  itemId: string | null;
  name: string;
  priceCents: number;
  quantity: number;
  prepMinutes: number;
};

export type Coordinates = {
  latitude: number;
  longitude: number;
};

/** A phone location fix. Stays on the device with the order. */
export type PassengerFix = Coordinates & {
  accuracyMeters: number | null;
  at: string;
};

export type Order = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantInitials: string;
  restaurantColor: string;
  restaurantLocation: string | null;
  restaurantCoordinates: Coordinates | null;
  passengerLocation: PassengerFix | null;
  status: OrderStatus;
  code: string;
  gate: string;
  passengerName: string;
  totalCents: number;
  placedAt: string;
  summary: string;
  deliveredAt: string | null;
  lines: OrderLine[];
};
