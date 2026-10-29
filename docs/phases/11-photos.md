# Phase 11 — Restaurant and food photos

Status: Done (October 28, 2026). All 52 dish photos and 15 fixture photos are picked and bundled, checked on Android in Expo Go, and approved by the stakeholder. EAS production `CATALOG_SOURCE` is `places`, and the TestFlight build with photos follows `docs/testflight.md`. One accepted exception to "no brand logos": `bar-bundle` shows a Heineken bottle, and the development-only `fixture-pre-flight-combo` (Coca-Cola) and `fixture-wings-draft` (Bomonti) show logos. Swap them before any public release.

Depends on [10-concourse-seed.md](10-concourse-seed.md). Phase 9, the mock pass, was dropped after the stakeholder validated the app on TestFlight.

## Goal

The stakeholder asked for real restaurant and food images for investor demos. The approach is a mix of two sources:

- **Restaurant photos come from Google Places Photos.** These are the photos on the restaurant's Google Maps listing, fetched through Google's API by place ID. Nothing is scraped.
- **Food photos are licensed stock images bundled with the app.** Each one is matched to the dish it shows. Places has no menus and no per-dish photos, and the Places menus are generated anyway.

Anything without a photo keeps its colored box, so nothing looks broken.

## Facts this plan is built on

Checked against Google's docs on October 28, 2026.

- Place Details (New) `GET https://places.googleapis.com/v1/places/{placeId}` with field mask `photos` returns up to 10 photos. Each has a `name`, `widthPx`, `heightPx`, and `authorAttributions[]`. The `photos` field bills as Place Details Essentials (IDs Only), which has no monthly cap.
- Place Photos (New) `GET https://places.googleapis.com/v1/{photoName}/media?maxWidthPx=…&skipHttpRedirect=true` returns JSON with a short-lived `photoUri` on `googleusercontent.com`. That URI holds no key. It bills as Place Details Photos: 1,000 free a month, then $7 per 1,000.
- **Photo names cannot be cached, and they expire.** Only the place ID may be stored indefinitely. Places content may not be pre-fetched, cached, or stored.
- Wherever a Places photo is shown, its author must be credited. Places content shown without a Google map must also carry the Google Maps logo or the text "Google Maps". A thumbnail can skip the author credit if tapping it leads to a larger view that shows the credit.

## What follows from those facts

1. **The phone fetches restaurant photos at run time.** The seed stores only `placeId`. Saving photo names in `catalog.json`, or downloading Google's images into the repo, would break the caching rule.
2. **Photos need the Places catalog.** TestFlight builds run on `CATALOG_SOURCE=fixtures`, which has invented restaurants and no place IDs. The demo build switches to `CATALOG_SOURCE=places`. Fixtures stay the default for development.
3. **A Places key now ships in the app.** This reverses the rule in `plan.md` that the Places key stays off the device. It is acceptable for a TestFlight-only beta, on the same terms as `SKYLINK_API_KEY`. It must be a **new, dedicated key**: never the seed's key, and never the shared Maps key.

## Part A: Restaurant photos (Google Places)

### Key and Google Cloud setup

Do this together with the overdue Maps key replacement from [08b-courier-map.md](08b-courier-map.md):

1. Create a Google Cloud project for this app. Turn on Places API (New), Maps SDK for iOS, and Maps SDK for Android, and attach billing.
2. Create `GOOGLE_PLACES_CLIENT_KEY`. Allow only Places API (New), and restrict it to iOS apps with bundle ID `com.f2delivers.wingsnack`. iOS-restricted keys only work on REST calls that send the header `X-Ios-Bundle-Identifier: com.f2delivers.wingsnack`. The client sends it on every request.
3. Create the dedicated Maps key in the same project, as described in 08b, using bundle ID `com.f2delivers.wingsnack`. The bundle ID written in 08b is out of date.
4. Set quotas under APIs & Services → Places API (New) → Quotas. Cap Place Details at 2,000 requests a day and photo media at 300 a day. Also add a $10 budget alert to the billing account.
5. Put the key in `.env.local`, and in EAS with `env:set --environment production --visibility sensitive`. Change `CATALOG_SOURCE` in EAS production to `places`.

### Code

Follow the data boundary rule: screens and hooks never call Google directly.

- **Config.** `app.config.ts` passes `extra.placesClientKey` (or `null`) from `GOOGLE_PLACES_CLIENT_KEY`. Add the key to `.env.example`. A new `src/config/places.ts` reads it the way `src/config/skylink.ts` reads the SkyLink key.
- **Domain type.** Add `PlacePhoto` to `src/domain/types.ts`: `{ uri, width, height, authors: { name, uri | null }[], placeId }`.
- **Repository.** Add `PhotoRepository` to `src/data/repositories.ts` with `coverFor(placeId): Promise<PlacePhoto | null>`. It returns `null` when there is no key, the network is down, Google returns an error, or the place has no photos. It never throws to a screen.
- **Client.** Put it in `src/data/places/photos-client.ts`. It makes one Place Details call (field mask `photos`), then one media call for the first photo, at `maxWidthPx=800`. It sends `X-Goog-Api-Key` and `X-Ios-Bundle-Identifier` as headers. The key never goes in a URL.
- **Session-only cache.** Keep results in a module-level `Map` keyed by place ID, and drop entries after 30 minutes. Do not write them to SQLite, `catalog.json`, or AsyncStorage. In-flight requests for the same place share one promise. Wire this up in `createDataSource()`. With fixtures or no key, return a no-op repository.
- **Hook.** Add `useRestaurantCover(placeId | null)` to `src/hooks/`, built on `useAsyncValue`.
- **Where it shows.** Restaurant cards on Home and Browse, and the restaurant menu cover. Remove the "Cover photo" caption only when a real photo has loaded.
- **Attribution.** On the menu cover, add a small overlay: "Photo: {author} · Google Maps". Tapping the author opens their `uri` in `expo-web-browser`. Cards need no credit, because they open the menu. Add a "View on Google Maps" link on the menu, built from the place ID: `https://www.google.com/maps/search/?api=1&query={name}&query_place_id={placeId}`. That avoids requesting `googleMapsUri`, which is a Pro-tier field.

## Part B: Food photos (licensed stock, bundled)

### Dish-matched menus

The Places menus are four generic rows for every restaurant: Quick bite, House plate, Slow roast, Gate bundle. A real photo needs a real dish name. Replace `MENU_TEMPLATES` in `src/data/places/build.ts` with templates per cuisine group, chosen from `primaryType`:

| Group | `primaryType` values (examples) |
| --- | --- |
| Burgers | `hamburger_restaurant`, `american_restaurant` |
| Pizza and Italian | `pizza_restaurant`, `italian_restaurant` |
| Mexican | `mexican_restaurant` |
| Asian | `chinese_restaurant`, `japanese_restaurant`, `sushi_restaurant`, `asian_restaurant` |
| Breakfast and bakery | `breakfast_restaurant`, `bagel_shop`, `bakery` |
| Coffee and dessert | `cafe`, `coffee_shop`, `dessert_shop`, `ice_cream_shop` |
| Sandwiches and hot dogs | `sandwich_shop`, `hot_dog_restaurant`, `deli` |
| Wings and bar | `chicken_wings_restaurant`, `bar`, `brewpub`, `sports_bar` |
| Seafood | `seafood_restaurant` |
| Barbecue | `barbecue_restaurant` |
| General | anything else |

Each group keeps the same four slots, with the same prep times, prices, flags, and kinds as today. That way the delivery-window demo still has a quick item, a standard plate, one item that is too late for a tight connection, and a bundle. Only the name, description, and `imageKey` change. For example, Pizza: "Pepperoni slice", "Margherita pizza", "Baked lasagna", "Slice + soda bundle".

`menu_items` gains an `image_key` column (`imageKey: string | null` on `MenuItem`). The seed's upsert still keeps menu rows on a re-seed. Add `--rebuild-menus` to `npm run seed:places`, which replaces only rows whose IDs end in the template slugs. Run it once for this phase.

### Fixture items

The fixture dishes (Double smash burger, Açaí bowl, Wood-fired pizza, and so on) get an `imageKey` too, so development and the fallback build also show food photos. Fixture restaurant covers stay colored boxes.

### Assets

- About 44 group images (11 groups × 4 slots) plus about 15 fixture dish images. Put them in `assets/images/food/{key}.jpg`, about 800 px wide and under 150 KB each.
- Source them from Unsplash or Pexels. Both licenses allow commercial app use without attribution. Record each file's source URL, author, and license in `assets/images/food/CREDITS.md` anyway, so we can answer investor questions about where the images came from. No brand logos, no identifiable faces, and no AI-generated images unless the stakeholder approves them.
- The stakeholder approves the image set before the TestFlight build.

### Code

- `src/components/ui/food-images.ts`: a static map from `imageKey` to `require('…/food/{key}.jpg')`. Metro needs static requires. The domain only carries the key string.
- Where it shows: `MenuCard`, `FeaturedTile`, `HomeFeaturedCard`, `HomeSpecialCard`, `SpecialTile`, `RestaurantMenu` rows, `ItemDetail`, and the `CartCheckout` swatch. Remove the "Photo" and "Item photo" captions when an image exists. Stock images need no on-screen credit.

## Shared image component

Install `expo-image` with `npx expo install expo-image`. It needs a new development client and a new TestFlight build. Add `src/components/ui/Photo.tsx`, which takes either a remote Places photo or a bundled `imageKey`. It renders `expo-image` with the existing `imageColor` box as placeholder and fallback, plus a short fade. Use `cachePolicy="memory"` for Places photos (they must not be stored on disk) and the default for bundled images. The "too late" dimming stays as it is.

## Seed cleanup

Stop saving photo names. Phase 10 already drops `places.photos` from the field mask. Write `photoReference: null`, and mark the field deprecated in `PlacesRestaurantRecord` and `Restaurant`.

## Cost

Each restaurant cover viewed in a session costs one free Details call and one photo media call. Scrolling the full list after Phase 10 (roughly 60 to 100 restaurants) uses about 100 media calls, so about ten full scrolls a month stay inside the 1,000 free. Beyond that it costs about $0.70 per full scroll, and the daily quota caps the worst case at about $2 a day. Food photos cost nothing to serve.

## Done when

- With `CATALOG_SOURCE=places` and the key set, restaurant cards and the menu cover show Places photos on an iOS development build. The menu cover shows the author credit, "Google Maps", and the View on Google Maps link.
- Every Places menu row and fixture dish shows a dish-matched stock photo, and `CREDITS.md` lists every file.
- With no key or no network, covers fall back to colored boxes and food photos still show. Nothing errors.
- `catalog.json` holds no photo names, and nothing stores Places photo names or URIs on disk.
- Tests for cuisine grouping, template selection, `--rebuild-menus`, and the photo client's parsing and error fallback pass in `npm test`. `npx tsc --noEmit` and `npx expo lint` pass.
- A TestFlight build made with the production EAS env shows both kinds of photo. Follow [../testflight.md](../testflight.md).
- `plan.md` is updated in four places: "What this build includes", the keys paragraph (the Places client key now ships), External APIs (runtime photo calls), and the phase table.

## Build notes (October 28, 2026)

Where the build differs from the plan above, or adds to it:

- **Photos load only when on screen.** Home and Browse render all 138 restaurants at once, so a cover on every card would cost about 138 photo requests per session. `useSeenOnScreen` (`src/components/ui/viewport.ts`) waits until a tile or card is within 120 px of the screen before asking for its cover. Scroll views call `notifyViewportChanged`. A cover is fetched once per restaurant per 30 minutes and shared between Home, Browse, and the menu (`PlacesPhotoRepository`).
- **One photo size.** Covers and cards share one 800 px photo, so each restaurant costs one media call, not two.
- **Restaurant tiles and cards show the cover in place of the initials mark.** The initials come back if there is no key, no network, or no photo.
- **13 cuisine groups** in `src/data/places/menus.ts`, including `healthy` and `grill` (the default for `restaurant` and `american_restaurant`). In groups where a 48-minute dish would be odd, the long-prep slot is a large order such as "Coffee box for the team" or "Party sub platter".
- **`--rebuild-menus` runs offline.** It rebuilds the four dishes for the restaurants already in `data/places.db` without calling Google, so the restaurant list doesn't change. Menu rows from `catalog.json` are upserted by id, so devices that imported the old menus get the new dishes in place, and cart lines keep working.
- **App database version 7** adds `menu_items.image_key` and sets `fixture-{id}` keys on the fixture dishes.
- **Stock photos are picked by hand, with no API.** Pexels paused new API keys on September 30, 2026, with no restart date. Downloading from the Pexels and Unsplash websites is still allowed under the same free licenses. `npm run fetch:food-photos` creates or updates `assets/images/food/picks.json`, with one entry per photo key: the dish, which Places types use it, and Pexels and Unsplash search links (landscape, and Unsplash+ hidden). Paste a link into `url`: either a pexels.com photo page, or for Unsplash the image address (right-click the photo, then **Copy Image Address**). Unsplash page links aren't accepted, because they can't be turned into a download reliably without the API. Unsplash+ photos are refused because they need a paid license. Then re-run the script. It downloads each new or changed pick at about 1200 px (roughly 130–220 KB). It writes `credits.json`, `CREDITS.md`, and the generated registry `src/components/ui/food-images.ts`. Clearing a `url` deletes that photo. The 52 dish photos are required. The 15 fixture photos are optional, because they only appear in the development catalog. When picking, skip photos with brand logos, recognizable faces, or a dish that doesn't match the name. A trial pick for "Pepperoni slice" was really a cheese slice next to a branded cup.
- **Release checklist:** run `npx eas-cli@latest env:set --name CATALOG_SOURCE --value places --environment production --visibility plaintext`, then follow `docs/testflight.md`. That build also replaces the old shared Maps key in TestFlight.

## Out of scope

A proxy server for the keys, photos supplied by restaurants or their operators (that's the production path), real menus, Places photos for fixture restaurants, and Android or web image tuning beyond the colored-box fallback.
