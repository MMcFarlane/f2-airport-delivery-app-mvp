export const SCHEMA_SQL = `
CREATE TABLE restaurants (
  id TEXT PRIMARY KEY NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('fixtures', 'places')),
  place_id TEXT UNIQUE,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  color TEXT NOT NULL,
  cuisine TEXT NOT NULL,
  location TEXT NOT NULL,
  fastest_prep_minutes INTEGER NOT NULL,
  open_until TEXT,
  address TEXT,
  latitude REAL,
  longitude REAL,
  rating REAL,
  photo_reference TEXT,
  primary_type TEXT,
  position INTEGER NOT NULL
);

CREATE TABLE menu_items (
  id TEXT PRIMARY KEY NOT NULL,
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  prep_minutes INTEGER NOT NULL,
  category TEXT,
  image_color TEXT NOT NULL,
  featured INTEGER NOT NULL DEFAULT 0,
  popular INTEGER NOT NULL DEFAULT 0,
  kind TEXT NOT NULL CHECK (kind IN ('item', 'special')),
  badge TEXT,
  compare_at_cents INTEGER,
  tags TEXT NOT NULL DEFAULT '[]',
  position INTEGER NOT NULL
);

CREATE TABLE discount_codes (
  code TEXT PRIMARY KEY NOT NULL,
  percent_off INTEGER NOT NULL,
  label TEXT NOT NULL
);

CREATE TABLE profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  card_brand TEXT NOT NULL,
  card_last4 TEXT NOT NULL,
  dietary TEXT NOT NULL,
  order_updates INTEGER NOT NULL,
  boarding_reminders INTEGER NOT NULL,
  deals INTEGER NOT NULL
);

CREATE TABLE trip (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  passenger_name TEXT NOT NULL,
  gate TEXT NOT NULL,
  departure_at TEXT NOT NULL,
  flight_number TEXT,
  airline TEXT,
  flight_status TEXT
);

CREATE TABLE cart_meta (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  tip_cents INTEGER NOT NULL
);

CREATE TABLE cart_lines (
  item_id TEXT PRIMARY KEY NOT NULL REFERENCES menu_items(id),
  quantity INTEGER NOT NULL,
  note TEXT,
  discount_code TEXT
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY NOT NULL,
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id),
  restaurant_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('received', 'being_prepared', 'courier_on_the_way', 'at_gate', 'delivered')),
  code TEXT NOT NULL,
  gate TEXT NOT NULL,
  passenger_name TEXT NOT NULL,
  total_cents INTEGER NOT NULL,
  placed_at TEXT NOT NULL,
  summary TEXT NOT NULL,
  delivered_at TEXT
);

CREATE TABLE order_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL REFERENCES orders(id),
  item_id TEXT REFERENCES menu_items(id),
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  prep_minutes INTEGER NOT NULL
);

CREATE INDEX idx_restaurants_source ON restaurants(source, fastest_prep_minutes);
CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id, position);
`;
