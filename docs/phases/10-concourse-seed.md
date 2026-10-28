# Phase 10 — Concourse-wide Places seed

Status: Not started.

Depends on [02b-places-seed.md](02b-places-seed.md) and [08b-courier-map.md](08b-courier-map.md). Comes before [11-photos.md](11-photos.md), so photos are added to the full restaurant list.

## Goal

The Places catalog covers restaurants on every ATL concourse, not just the 20 nearest one point. Each restaurant gets a concourse that the app can trust, and restaurants before security are left out.

## What is wrong today

A check of `src/data/places/catalog.json` on October 28, 2026 found:

- **All 20 restaurants are inside the airport, but all of them sit within 230 m of the airport center point** (33.6407, -84.4277), which falls between Concourses D and E. `scripts/seed-places.ts` makes one Nearby Search ranked by distance, and that search returns at most 20 places. Concourses T, A, B, C, and F get almost nothing.
- **Google's coordinates don't match the concourse.** TGI Fridays has the address "Concourse B, Gate B19", and IHOP has "Concourse T", but Google places both near D/E. Many addresses say only "6000 N Terminal Pkwy".
- **`location` holds the first part of the address** ("6000 N Terminal Pkwy"). The app's own concourse logic needs text like "Concourse B, near gate B9" (`concourseFromText` in `src/domain/locate.ts`), so it reads no concourse here. The courier pin then trusts the bad coordinates (`restaurantPoint`).
- **Places can't tell whether a restaurant is before or after security.** One entry (Terrapin Taphouse) has the address "Atlanta, GA 30337" and nothing more.
- **The upsert doesn't update `location` or `cuisine`.** Re-running the current seed wouldn't fix existing rows.

## Search

For each concourse in `airport.concourses` (T, A, B, C, D, E, F):

1. Run a **Nearby Search** at the concourse center with `rankPreference: DISTANCE` and a radius of 450 m. Use `includedTypes` to cover food that isn't tagged `restaurant`: `restaurant`, `cafe`, `coffee_shop`, `bakery`, `bar`, `fast_food_restaurant`, `sandwich_shop`, `meal_takeaway`.
2. Run a **Text Search** (`places:searchText`) for `restaurants in Concourse {X} Hartsfield-Jackson Atlanta Airport`, with `locationBias` set to the same circle. Follow `nextPageToken` up to 3 pages (60 results).

Merge everything by place ID. Keep the field mask to the identity fields this phase needs. Leave out `places.photos`: [11-photos.md](11-photos.md) explains why photo names must not be stored. About 30 requests in total, run once by a developer, stays inside the free monthly usage.

## Keep or drop

Keep a place only if both are true:

- Its coordinates fall inside an airport box built from the concourse centers, plus a 600 m margin north and south and 250 m east and west.
- Its address mentions the airport: `6000 N Terminal Pkwy`, `Spine Rd`, `Concourse`, `Terminal`, or `Hartsfield`.

Also drop anything a manual override marks as landside (before security; see below). Couriers deliver to gates, so a restaurant before security can't take part in the demo.

## Concourse for each restaurant

Decide in this order, and record which rule decided (`concourseSource`):

1. **Manual override.** `src/data/places/concourse-overrides.json` maps place ID to `{ concourse, nearGate?, landside? }`. Fill it in by checking the official dining directory on atl.com. Store only the name, concourse, and gate facts, not their images or text.
2. **Address.** A `Concourse X` or gate pattern such as `B19` in the address.
3. **Coordinates.** The nearest concourse center. This choice is marked as unconfirmed.

The seed then writes:

- `location`: `Concourse B, near gate B19` when a gate is known, otherwise `Concourse B`. Both work with `concourseFromText` as it is.
- `latitude`/`longitude`: Google's point when its nearest concourse matches the chosen one, otherwise the chosen concourse's center. The courier pin then lands on the right concourse without changing `locate.ts`.

### Confirmed status (stored only, never shown)

A restaurant is **confirmed** only when a person has checked it against the ATL directory, which means it has a manual override. Concourses taken from the address or the coordinates are unconfirmed, even when they are probably right.

- The seed stores `concourse_source` (`override`, `address`, or `coordinates`) and `concourse_confirmed` (1 or 0) on each restaurant. Both are carried through `catalog.json` into the app's database.
- **The app shows no difference.** No "unconfirmed" label, badge, or styling. Unconfirmed restaurants are listed, orderable, and look exactly like confirmed ones. This is a demo.
- The fields are kept so that a later phase can confirm the remaining restaurants and turn off unconfirmed ones with a single filter on `concourse_confirmed`. That switch is not built in this phase.
- At the end, the seed prints a developer-only review list of unconfirmed restaurants, grouped by `concourse_source`, so the overrides file can be filled in over time.

## Code changes

- `scripts/seed-places.ts`: per-concourse Nearby and Text searches, merging, the keep-or-drop filter, and the summary printout.
- `src/data/places/concourse.ts`: put the filter and the concourse rules here as pure functions. Add `concourse.test.ts` to `npm test`, with cases for TGI Fridays (address says B, point near D → B), IHOP (address says T), "6000 N Terminal Pkwy" only (falls back to coordinates), a landside override, and a place outside the box.
- `src/data/places/build.ts`: `locationFor` builds the concourse text above instead of using the first part of the address.
- `src/data/places/store.ts`: the upsert also updates `location`, `cuisine`, and `position`. Menu rows are still kept.
- `src/data/places/types.ts`: add `concourse`, `concourseSource`, and `concourseConfirmed` to `PlacesRestaurantRecord`. Add matching columns to `PLACES_SCHEMA_SQL`, and have the upsert update them.
- `src/data/sqlite/schema.ts`: add a version 6 migration that adds `concourse TEXT`, `concourse_source TEXT`, and `concourse_confirmed INTEGER NOT NULL DEFAULT 0` to `restaurants`. Fixture rows keep the default and are never filtered by it.
- `src/domain/types.ts`: add `concourseConfirmed: boolean` to `Restaurant`, mapped in `src/data/sqlite/mappers.ts` and `src/data/places/store.ts`. Nothing in screens, hooks, or browse filters reads it in this phase.
- `position`: order by concourse (T, A, B, C, D, E, F), then by name, so Home and Browse mix concourses instead of clustering D/E first.

## Done when

- `npm run seed:places` writes restaurants from at least six of the seven concourses to `catalog.json`. Every restaurant's `location` starts with `Concourse`.
- No kept restaurant is landside, and none is outside the airport box.
- TGI Fridays shows Concourse B and IHOP shows Concourse T. Their courier pins land on those concourses.
- Every restaurant has `concourse_source` and `concourse_confirmed` in `catalog.json` and in the app database after migration 6, on a fresh install and on an upgraded one.
- No screen shows confirmed status. Confirmed and unconfirmed restaurants look and behave the same.
- The seed's review list shows how many restaurants are unconfirmed. The number doesn't have to be zero.
- `npm test`, `npx tsc --noEmit`, and `npx expo lint` pass. With `CATALOG_SOURCE=places`, Home, Browse, the menu, and the Courier view work on a development build.

## Out of scope

Photos (see [11-photos.md](11-photos.md)), real menus, opening hours, live updates from the ATL directory, and the switch that turns off unconfirmed restaurants.
