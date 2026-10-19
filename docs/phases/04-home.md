# Phase 4 — Home

Status: Done. Home matches `artboards/home/Departure board@1x.png`: greeting, trip board, and the three carousels. The header bag opens Cart. That PNG's fourth tab is Cart. Phase 8a shows Account there instead.

Depends on [03-trip-and-time-window.md](03-trip-and-time-window.md). Phase 3b can land before or after this phase.

Artboard: `artboards/home/Departure board@1x.png`

## Goal

After the trip sheet, Home shows:

- "Good afternoon," and the passenger name. The demo clock is 14:17, so the greeting is afternoon.
- Search opens the Browse hub from [08a-browse-hub.md](08a-browse-hub.md). The cart button shows the item count and opens Cart.
- A trip board: gate, boarding, departure, and Edit, which reopens the trip sheet. The yellow line is deliver-by and the minutes left before it. A 15:40 departure with the demo clock leaves 43 minutes, not the 45 printed on the PNG.
- Three carousels: Restaurants, Featured items, and Specials & bundles. Each has See all.
- Restaurant marks are initials, name, and prep minutes. A restaurant opens its menu.
- Featured cards show a prep chip, photo, name, restaurant, price, and add.
- Specials show the badge, title, description, price, and prep minutes.
- Items that miss the window stay visible. Their add button is disabled.

See all restaurants, featured, and specials open `/browse/restaurants`, `/browse/featured`, and `/browse/specials`.

## Done when

Completing the sheet reveals the trip board and the carousels. Only items that fit the window can be added. See all, a restaurant, and the cart button open the right routes.

## Out of scope

Filter chips and checkout. Those stay on the list screens and in Phase 7.
