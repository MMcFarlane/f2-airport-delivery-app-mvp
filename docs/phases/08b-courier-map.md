# Phase 8b — Courier map

Status: Done in code, and the web and iOS bundles build. It still needs a rebuilt development client with `GOOGLE_MAPS_API_KEY` set to be checked on a device. The Courier view opens from the active order card and from the confirmation screen. It shows a map with a restaurant pin, a passenger pin and a straight line between them, plus the distance and walk time. Pay asks for location but never requires it. Without location, the passenger pin falls back to the gate's concourse.

Depends on [08-orders-and-account.md](08-orders-and-account.md). This phase goes before [09-mock-pass.md](09-mock-pass.md) so the mock pass covers it.

## Why it is a demo screen

A courier needs to find the passenger who ordered. This build has no server, so the passenger's location cannot reach a separate courier phone. The Courier view runs on the passenger's own phone and is labeled Demo. A real courier device needs a backend. That is still out of scope.

## Libraries

- `react-native-maps` with `PROVIDER_GOOGLE` on iOS and Android. Expo's `expo-maps` would use Apple Maps on iOS.
- `expo-location` for the "while using" permission, one fix at checkout, and a live watch while the Courier view is open. Screens never import it directly. They go through `src/hooks/usePassengerLocation.ts`.
- Both libraries include native code, so rebuild the development client with `npx expo run:ios` or `npx expo run:android`.

## Keys

`GOOGLE_MAPS_API_KEY` in `.env.local` needs Maps SDK for iOS and Maps SDK for Android enabled. It is a different key from the Places key. `app.config.ts` passes it to the `react-native-maps` config plugin. Only `extra.googleMapsConfigured`, a boolean, reaches JavaScript. Without a key:

- iOS shows Apple Maps.
- Android shows a summary card.
- Web always shows the summary card, because `react-native-maps` has no web build (`CourierMap.web.tsx`).

### Resolved: shared key (replaced October 28, 2026)

Until October 28, 2026, `GOOGLE_MAPS_API_KEY` was a temporary key shared with another app in the personal project `total-ensign-465616-f9`. It had no application restriction. It has now been replaced in `.env.local` with a dedicated key restricted to bundle ID `com.f2delivers.wingsnack`. That key lives in this app's own Google Cloud project, next to `GOOGLE_PLACES_CLIENT_KEY` (see [11-photos.md](11-photos.md)).

- The key is built into the native app, so the new key takes effect only after the next native build: run `npx expo prebuild --clean` and rebuild the development client, or run a new EAS build.
- Native builds made before October 28, 2026, including the first TestFlight build, contain the old shared key. Replace them with a new build, and don't hand out the old binaries.

## Coordinates

- **Concourses:** the T, A–F centers in `src/config/airport.ts` come from OpenStreetMap `aeroway=terminal` buildings. A gate such as `B14` maps to its concourse center.
- **Fixture restaurants:** they have approximate coordinates along Concourse B, plus Concourse A for Concourse Pizza. Gate positions inside a concourse are not surveyed. Database version 5 fills these in on existing installs. No price or prep time changed.
- **Places restaurants:** they use their Google coordinates. A restaurant with no coordinates falls back to the concourse named in its location text, then to the airport center.

## Rules (`src/domain/locate.ts`, tested)

- **Distance:** straight-line distance (haversine).
- **Walk time:** about 80 m a minute, rounded up, with a minimum of 1 minute.
- **Where the passenger pin goes:** the live fix, then the fix taken at checkout, then the gate's concourse, then the airport center.
- **Directions:** Google's walking directions don't route inside ATL terminals, so the app draws a straight line. "Open in Google Maps" hands the two points to Google Maps.

## Checkout

Pay asks for location and waits up to 5 seconds for a fix, showing "Locating you…" on the button. The fix is stored on the order in `passenger_latitude`, `passenger_longitude`, `passenger_accuracy_m` and `located_at`. If the passenger denies access, location services are off, or there is no fix, the order still places. The line under Pay reads "We share your location with the courier so they can find you at the gate." Location stays on the device.

## Courier view (`/courier/[id]`)

The screen sits on the root stack with no tab bar. It has:

- a back control, the title "Courier view" and a Demo badge;
- the map;
- the passenger name, gate and code;
- "≈ 420 m · 6 min walk";
- a line saying where the passenger pin comes from:
  - "Live location · ±12 m"
  - "Location from checkout · 14:18"
  - "Location off — showing Concourse B"
- "Turn on location", which asks again or opens Settings;
- "Open in Google Maps".

It opens from "Courier view" on the active order card and from "Open courier view" on the confirmation screen. Delivered orders don't offer it.

## Done when

On a rebuilt development client with a Maps key:

- Paying with location allowed opens a Courier view with a Google Map, both pins, the line, the distance and "Live location".
- Paying with location denied still places the order, and the Courier view shows "Location off — showing Concourse B".
- Moving the simulator location moves the passenger pin and refits the map.
- On web, the summary card and the Google Maps link work.

## Out of scope

- Sending the location to another device or a server.
- Background location.
- Indoor floor-level positioning.
- Turn-by-turn directions.
- Live courier GPS.
