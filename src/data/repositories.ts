import type { CatalogSource } from '@/src/config/catalog';
import type {
  Cart,
  DiscountCode,
  MenuItem,
  Order,
  OrderLine,
  OrderStatus,
  PassengerFix,
  PlacePhoto,
  Profile,
  Restaurant,
  DepartureFlight,
  FlightGate,
  GateSource,
  Trip,
} from '@/src/domain';

export type SaveTripInput = {
  passengerName: string;
  gate: string;
  gateSource?: GateSource;
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
  /** Captured at checkout so the courier view can find the passenger. Null when location is off. */
  passengerLocation?: PassengerFix | null;
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
  lookup(flightNumber: string): Promise<DepartureFlight | null>;
  listDepartures(): Promise<DepartureFlight[]>;
  /** The ATL departure gate from SkyLink. Null when there is no key, no ATL leg, or no answer. */
  departureGate(flightNumber: string): Promise<FlightGate | null>;
};

export type PhotoRepository = {
  /** The restaurant's first Google Places photo for this session. Null when there is no key, network, or photo. */
  coverFor(placeId: string): Promise<PlacePhoto | null>;
};

export type DataSource = {
  catalog: CatalogRepository;
  trip: TripRepository;
  cart: CartRepository;
  orders: OrderRepository;
  profile: ProfileRepository;
  flights: FlightRepository;
  photos: PhotoRepository;
};

export type { CatalogSource };
