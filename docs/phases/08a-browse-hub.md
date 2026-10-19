# Phase 8a — Browse hub

Status: Not started.

Depends on [08-orders-and-account.md](08-orders-and-account.md).

Artboard: `artboards/browse/Browse · search everything@1x.png`. Save the Browse search-everything mock at that path as part of this phase.

The Browse tab root is still three links. Phase 5 already shipped the restaurant, featured, and specials lists. This phase replaces that stub with the hub.

## Footer

Tabbed screens use Home, Browse, Orders, and Account. The yellow indicator marks that screen's tab. Browse stays active on the hub and the three lists.

- Home (`artboards/home/Departure board@1x.png`) keeps Home active. That PNG's fourth icon is a bag labeled Cart. The header bag, with the item count, stays and opens Cart.
- The Browse hub, restaurants, featured items, and specials keep Browse active. Their fourth tab is Account. Featured items also has a header bag with the count; that bag opens Cart. Restaurants keeps the gate pill. Specials keeps search. The hub has no header bag.
- Orders keeps Orders active. Account is the fourth tab. A successful reorder still opens Cart.
- Account (`artboards/restaurant_details/Profile@1x.png`) keeps Account active. The home name can still open it.

These designs have no tab bar:

- The restaurant menu uses the View cart bar.
- Item detail has no footer.
- Cart and checkout has a back control and no footer. Move `app/(tabs)/cart.tsx` to `app/cart.tsx` so it sits on the root stack with restaurant, item, and order confirmation.
- Order confirmation has no footer.
- The trip sheet already covers the whole frame, including the tab bar.

Do not add a header bag to a screen whose PNG does not show one.

## Hub

- Title "Browse", and a gate pill reading `{gate} · BY {deliverBy}` (reference trip: `B14 · BY 15:00`). The pill opens the trip sheet.
- Search field, placeholder "Search restaurants, dishes, deals".
- Chips: Ready in 10 min (clock icon), Under 20 min, and Under $10. One chip can be on. Tapping the active chip clears it. Nothing is selected on open, so the reference catalog shows 7, 6, and 5. A selected chip is yellow with black text. List screens keep their current black chips.
- Three black cards with a yellow count: All restaurants, Featured items, Specials & bundles.
- Categories, in two columns. Each card has the title and detail on the left and a color swatch on the right. Sample the swatches from the PNG.

## Counts and categories

Put the filter and category rules in `src/domain/` and cover them with tests. Do not change the seed or any prep time. The fixture catalog already has 7 restaurants, 6 featured items, and 5 specials. Those totals include the 52-minute pizza. Too-late rows stay in the totals. The list screens still mark them too late.

A chip filters restaurants, featured items, and specials:

- Ready in 10 min: prep is 10 minutes or less. A restaurant uses its fastest prep.
- Under 20 min: prep is under 20 minutes.
- Under $10: the item price is under $10. A restaurant matches when any menu item does.

Search matches a restaurant name, cuisine, and location, and an item name, description, category, and badge.

Place cards show the place count and the fastest prep of the restaurants that belong. Zero places reads `0 PLACES`.

- Coffee & pastries — cuisine or item category matches coffee or pastry. Fixture: `1 PLACE · 5 MIN+` (Gate Café). The PNG says 2 places and 4 min.
- Breakfast — an item or special tagged Breakfast. Fixture: `1 PLACE · 5 MIN+`. The PNG says 3 places and 6 min.
- Burgers & sandwiches — cuisine or category matches burger or sandwich. Fixture: `1 PLACE · 8 MIN+` (Runway Burger). The PNG says 10 min.
- Healthy & bowls — bowl, smoothie, or poke. Fixture: `3 PLACES · 6 MIN+` (Jetstream Juice, Terminal Taco, Sky Noodle).
- Bar & drinks 21+ — beer, wine, or wings. Fixture: `1 PLACE · 13 MIN+` (Wing Bar).
- For the flight — a special tagged For the flight. The detail is always `PACKED TO TRAVEL`.

## Navigation

The stat cards open `/browse/restaurants`, `/browse/featured`, and `/browse/specials`. A place card opens the restaurant list for that category. For the flight opens the specials list on the For the flight tag.

Pass the search text, the hub chip, and the category into those lists. A hub chip or category replaces the restaurant list's default "Fits my window" chip until the person picks a chip on that list.

## Done when

The Browse tab shows the hub. With no chip selected, the reference trip shows 7 restaurants, 6 featured items, and 5 specials, and the category lines above. Choosing a chip changes those counts. Account is the fourth tab on Home, Browse, Orders, and Account. Cart opens from the home bag, the featured bag, the menu View cart bar, and a successful reorder, and that screen has no tab bar.

## Out of scope

Catalog edits, new list designs, and a header bag on any screen that does not already draw one.
