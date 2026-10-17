import type { CatalogSource } from '@/src/config/catalog';
import type {
  Cart,
  DiscountCode,
  MenuItem,
  Order,
  OrderLine,
  OrderStatus,
  Profile,
  Restaurant,
  Trip,
} from '@/src/domain';

export type SaveTripInput = {
  passengerName: string;
  gate: string;
  departureAt: string;
  flightNumber?: string | null;
  airline?: string | null;
  flightStatus?: string | null;
};

export type AddCartLineInput = {
  itemId: string;
  quantity?: number;
  note?: string | null;
  discountCode?: string | null;
};

export type CreateOrderInput = {
  restaurantId: string;
  gate: string;
  passengerName: string;
  totalCents: number;
  summary: string;
  status?: OrderStatus;
  lines: OrderLine[];
};

export type ProfilePatch = {
  name?: string;
  email?: string;
  phone?: string;
  cardBrand?: string;
  cardLast4?: string;
  dietary?: Profile['dietary'];
  notifications?: Partial<Profile['notifications']>;
};

export type NotConfigured = { configured: false };

export type CatalogRepository = {
  listRestaurants(): Promise<Restaurant[]>;
  getRestaurant(id: string): Promise<Restaurant | null>;
  listMenu(restaurantId: string): Promise<MenuItem[]>;
  listFeatured(): Promise<MenuItem[]>;
  listSpecials(): Promise<MenuItem[]>;
  getItem(id: string): Promise<MenuItem | null>;
  findDiscount(code: string): Promise<DiscountCode | null>;
};

export type TripRepository = {
  getTrip(): Promise<Trip | null>;
  saveTrip(input: SaveTripInput): Promise<Trip>;
};

export type CartRepository = {
  getCart(): Promise<Cart>;
  addLine(input: AddCartLineInput): Promise<Cart>;
  setQuantity(itemId: string, quantity: number): Promise<Cart>;
  setLineDiscount(itemId: string, code: string | null): Promise<Cart>;
  setTip(tipCents: number): Promise<Cart>;
  clear(): Promise<Cart>;
};

export type OrderRepository = {
  listOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | null>;
  createOrder(input: CreateOrderInput): Promise<Order>;
  advanceStatus(id: string): Promise<Order | null>;
};

export type ProfileRepository = {
  getProfile(): Promise<Profile>;
  updateProfile(patch: ProfilePatch): Promise<Profile>;
};

export type FlightRepository = {
  lookup(flightNumber: string): Promise<NotConfigured>;
  listDepartures(): Promise<NotConfigured>;
};

export type DataSource = {
  catalog: CatalogRepository;
  trip: TripRepository;
  cart: CartRepository;
  orders: OrderRepository;
  profile: ProfileRepository;
  flights: FlightRepository;
};

export type { CatalogSource };
