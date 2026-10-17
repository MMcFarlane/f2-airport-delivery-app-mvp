# Phase 2 — Data boundary

Status: Not started.

Depends on [01-theme.md](01-theme.md).

## Goal

The UI can read and write the demo through repository interfaces. SQLite is the only implementation in this phase. Screens do not import `expo-sqlite`.

## Files

- `src/domain/` — time window and pricing as pure functions. No I/O.
- `src/config/airport.ts` — ATL, KATL, `America/New_York`, center near `33.6407, -84.4277`.
- `src/data/repositories.ts` — `CatalogRepository`, `TripRepository`, `CartRepository`, `OrderRepository`, `ProfileRepository`, `FlightRepository`.
- `src/data/sqlite/` — schema, migrations, fixture seed, one class per repository.
- `src/data/index.ts` — `createDataSource()`.
- Hooks for trip, catalog, cart, orders, and profile that call `createDataSource()` only.

`FlightRepository` can return "not configured" until [03b-skylink.md](03b-skylink.md).

## Domain rules to implement now

See [../plan.md](../plan.md). Cover them with unit tests if a test runner already exists:

- 15:40 departure → boarding 15:10, deliver-by 15:00.
- An item fits only when `now + prepMinutes <= deliverBy`.
- Cart arrival uses the longest prep time.
- Spare minutes are `boarding - arrival`.
- FLY10 is 10% off the item it was applied to.
- Fee $2.49. Tax is 8% of discounted food. Default tip $3.
- The reference total is $26.60 for a $14.50 burger plus $6.50 fries.

## Fixture seed

Match the artboards:

- Restaurants: Gate Café, Jetstream Juice, Runway Burger, Terminal Taco, Wing Bar, Sky Noodle, Concourse Pizza. Include initials, color, cuisine, location, and a fastest prep time.
- Menu rows from the Runway Burger mock, including the 48-minute brisket that is too late for a 15:00 deliver-by.
- Featured items and specials from those list mocks.
- Discount code FLY10.
- Profile: Jordan, jordan@example.com, (555) 010-0142, Visa 4242, dietary chips, notification toggles.
- Three past orders: Gate Café, Sky Noodle, Runway Burger, with the dates, gates, and totals shown on the Orders artboard.

`CATALOG_SOURCE` defaults to `fixtures`.

## Done when

A hook can load the fixture restaurants and the pricing tests match the reference cart. No screen has to be redesigned in this phase.

## Out of scope

Google Places import and live SkyLink calls.
