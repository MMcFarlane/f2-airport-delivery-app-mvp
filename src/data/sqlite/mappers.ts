import type { CatalogSource } from '@/src/config/catalog';
import type {
  DietaryPreference,
  DiscountCode,
  MenuItem,
  MenuItemKind,
  Order,
  OrderLine,
  OrderStatus,
  Profile,
  Restaurant,
  Trip,
} from '@/src/domain';

export type RestaurantRow = {
  id: string;
  source: string;
  place_id: string | null;
  name: string;
  initials: string;
  color: string;
  cuisine: string;
  location: string;
  fastest_prep_minutes: number;
  open_until: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  photo_reference: string | null;
  primary_type: string | null;
};

export type MenuItemRow = {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  name: string;
  description: string;
  price_cents: number;
  prep_minutes: number;
  category: string | null;
  image_color: string;
  featured: number;
  popular: number;
  kind: string;
  badge: string | null;
  compare_at_cents: number | null;
  tags: string;
  position: number;
};

export type DiscountRow = {
  code: string;
  percent_off: number;
  label: string;
};

export type ProfileRow = {
  name: string;
  email: string;
  phone: string;
  card_brand: string;
  card_last4: string;
  dietary: string;
  order_updates: number;
  boarding_reminders: number;
  deals: number;
};

export type TripRow = {
  passenger_name: string;
  gate: string;
  departure_at: string;
  flight_number: string | null;
  airline: string | null;
  flight_status: string | null;
};

export type OrderRow = {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  status: string;
  code: string;
  gate: string;
  passenger_name: string;
  total_cents: number;
  placed_at: string;
  summary: string;
  delivered_at: string | null;
};

export type OrderLineRow = {
  order_id: string;
  item_id: string | null;
  name: string;
  price_cents: number;
  quantity: number;
  prep_minutes: number;
};

function catalogSourceOf(value: string): CatalogSource {
  return value === 'places' ? 'places' : 'fixtures';
}

function menuKind(value: string): MenuItemKind {
  return value === 'special' ? 'special' : 'item';
}

export function mapRestaurant(row: RestaurantRow): Restaurant {
  return {
    id: row.id,
    source: catalogSourceOf(row.source),
    placeId: row.place_id,
    name: row.name,
    initials: row.initials,
    color: row.color,
    cuisine: row.cuisine,
    location: row.location,
    fastestPrepMinutes: row.fastest_prep_minutes,
    openUntil: row.open_until,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    rating: row.rating,
    photoReference: row.photo_reference,
    primaryType: row.primary_type,
  };
}

export function mapMenuItem(row: MenuItemRow): MenuItem {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    restaurantName: row.restaurant_name,
    name: row.name,
    description: row.description,
    priceCents: row.price_cents,
    prepMinutes: row.prep_minutes,
    category: row.category,
    imageColor: row.image_color,
    featured: row.featured === 1,
    popular: row.popular === 1,
    kind: menuKind(row.kind),
    badge: row.badge,
    compareAtCents: row.compare_at_cents,
    tags: parseTags(row.tags),
    position: row.position,
  };
}

export function mapDiscount(row: DiscountRow): DiscountCode {
  return {
    code: row.code,
    percentOff: row.percent_off,
    label: row.label,
  };
}

export function mapProfile(row: ProfileRow): Profile {
  return {
    name: row.name,
    email: row.email,
    phone: row.phone,
    cardBrand: row.card_brand,
    cardLast4: row.card_last4,
    dietary: parseDietary(row.dietary),
    notifications: {
      orderUpdates: row.order_updates === 1,
      boardingReminders: row.boarding_reminders === 1,
      deals: row.deals === 1,
    },
  };
}

export function mapTrip(row: TripRow): Trip {
  return {
    passengerName: row.passenger_name,
    gate: row.gate,
    departureAt: row.departure_at,
    flightNumber: row.flight_number,
    airline: row.airline,
    flightStatus: row.flight_status,
  };
}

export function mapOrder(row: OrderRow, lines: OrderLineRow[]): Order {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    restaurantName: row.restaurant_name,
    status: row.status as OrderStatus,
    code: row.code,
    gate: row.gate,
    passengerName: row.passenger_name,
    totalCents: row.total_cents,
    placedAt: row.placed_at,
    summary: row.summary,
    deliveredAt: row.delivered_at,
    lines: lines.map(mapOrderLine),
  };
}

function mapOrderLine(row: OrderLineRow): OrderLine {
  return {
    itemId: row.item_id,
    name: row.name,
    priceCents: row.price_cents,
    quantity: row.quantity,
    prepMinutes: row.prep_minutes,
  };
}

function parseTags(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((tag): tag is string => typeof tag === 'string') : [];
  } catch {
    return [];
  }
}

function parseDietary(value: string): DietaryPreference[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is DietaryPreference => typeof entry === 'string');
  } catch {
    return [];
  }
}
