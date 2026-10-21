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

### Known issue: shared key (fix by Friday, October 23, 2026)

The `GOOGLE_MAPS_API_KEY` in `.env.local` is temporary. It is the "Maps Platform API Key" from the personal Google Cloud project `total-ensign-465616-f9` ("n8n-workflow-automations"). Another app also uses it, for directions and a map of venue locations. As checked on October 20, 2026:

- Maps SDK for iOS and Maps SDK for Android are enabled in that project, the key is allowed to call both, and billing is on.
- The key has no application restriction. It allows about 30 Maps APIs, which the other app needs.

Because the key is shared, do not lock it to this app's bundle ID or trim its API list: that would break the other app. Every native build of this app embeds the key, and both apps' usage bills to the same account.

Replace it before the end of the week with a dedicated key:

1. Create a new key, ideally in a project for this app. Allow only Maps SDK for iOS and Maps SDK for Android.
2. Restrict it to iOS bundle ID `com.anonymous.f2airportdeliveryapp`, and to Android package `com.anonymous.f2airportdeliveryapp` with the signing SHA-1. Update both restrictions when the app gets its real identifier.
3. Put it in `.env.local` as `GOOGLE_MAPS_API_KEY`, run `npx expo prebuild --clean`, and rebuild the development client.
4. Do not ship or share any build made with the shared key.

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
