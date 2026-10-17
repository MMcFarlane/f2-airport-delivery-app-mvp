# Phase 5 — Browse lists

Status: Not started.

Depends on [04-home.md](04-home.md).

Artboards:

- `artboards/restaurant_details/All restaurants · search & filter@1x.png`
- `artboards/restaurant_details/All featured items · search & filter@1x.png`
- `artboards/restaurant_details/All specials & bundles@1x.png`

The Browse tab stays active on all three.

## Restaurants

- Search: "Search restaurants or cuisines"
- Chips: Fits my window, Under 10 min, and cuisine chips such as Coffee and Burgers
- Count line: "7 restaurants can reach B14"
- Sort: Fastest first
- A restaurant is "Full menu available" when every item fits, and "Some items too slow for your flight" when only some do
- Each row shows initials, name, cuisine, nearby gate, and the fastest prep time

## Featured items

- Search: "Search dishes and drinks"
- Chips: All that fit, Under 10 min, Under $10, plus a category chip
- Count line such as "5 items arrive before 15:00 · sorted by fastest"
- Grid cards with prep badge, name, restaurant, price, and add
- A too-late card shows the prep time, "Too late", and a disabled add button
- A cart badge shows the item count

## Specials and bundles

- Search icon
- Chips: All, Combos, Breakfast, For the flight, and the remaining tags from the mock
- Line: "Deals that still reach Gate B14 by 15:00"
- Rows with a badge (Save $4, Bundle, For the flight, 2 for $16, Happy hour), title, restaurant, price, compare-at price, prep time, and add

## Done when

Search, chips, and sort work on all three lists. Too-late rows stay visible and cannot be added. Tapping a restaurant opens its menu route.

## Out of scope

Item detail content and payment. Add buttons can navigate or no-op until Phase 6 if the item screen does not exist yet. Prefer navigating once that route exists.
