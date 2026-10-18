# Phase 4 — Home

Status: Done. After the trip sheet, Home shows Restaurants, Featured items, and Specials and bundles. The gate pill reopens the sheet. See all opens `/browse/restaurants`, `/browse/featured`, and `/browse/specials`. A restaurant opens `/restaurant/[id]`. Items that miss the window stay visible with add disabled.

Depends on [03-trip-and-time-window.md](03-trip-and-time-window.md). Phase 3b can land before or after this phase.

There is no Home artboard. `artboards/home` is empty. Compose the screen from the spec and from the type, color, and cards used on the other PNGs.

## Goal

After the trip sheet, Home shows three horizontal carousels filtered by the delivery window:

- Restaurants
- Featured items
- Specials and bundles

Each row ends in See all.

- See all restaurants → the restaurants list (Phase 5)
- See all featured → the featured list
- See all specials → the specials list
- A restaurant logo opens that restaurant's menu (Phase 6)

The header shows the current gate and deliver-by time, and can reopen the trip sheet.

## Done when

Completing the sheet reveals the carousels, only items that fit the window are offered as addable, and See all and a restaurant logo navigate to the right routes even if those screens are still placeholders.

## Out of scope

Search, filter chips, and checkout.
