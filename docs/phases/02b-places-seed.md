# Phase 2b — Places seed

Status: Not started.

Depends on [02-data-boundary.md](02-data-boundary.md).

## Goal

A developer script can fill SQLite with real ATL restaurants. The app still runs on fixtures when that seed has not been imported.

## Script

`scripts/seed-places.ts` calls Places API (New) Nearby Search for `restaurant` around the ATL terminal center from `src/config/airport.ts`.

Store name, Google place id, address, lat/lng, rating, photo reference, and primary type.

Upsert by place id. Re-seeding updates identity fields. It does not delete menu rows already attached to that place. A new place gets a small generated menu with prep times so the time window still runs.

The Places key stays in the environment for this script. Do not ship it inside the Expo app.

## Switch

`CATALOG_SOURCE=fixtures` returns the artboard restaurants. `CATALOG_SOURCE=places` returns the imported restaurants. Fixtures stay the default.

## Done when

Running the script with a key upserts ATL restaurants, a second run does not wipe their demo menus, and the catalog hook follows `CATALOG_SOURCE`. With no key, the script exits with a clear message and the app still opens on fixtures.

## Out of scope

Using Places photos as the final menu photography, and calling Places from the phone on every launch.
