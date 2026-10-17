# Phase 6 — Menu and item

Status: Not started.

Depends on [05-browse.md](05-browse.md).

Artboards:

- `artboards/departure_and_food_order/Restaurant menu@1x.png`
- `artboards/departure_and_food_order/Item detail@1x.png`

## Menu

- Back and search
- Cover, initials, name, cuisine, and location ("Concourse B, near gate B9")
- Chips: "To B14 · 8-15 min" and "Open until 22:00"
- Category tabs: Popular, Burgers, Chicken, Sides, Drinks
- Each row: name, description, price, prep minutes, photo, add button
- Too-late row: muted photo, disabled add, copy "Too late for 15:00"
- Sticky cart bar: item count, "View cart", arrival such as "Arrives at B14 by ~14:29", and the total

## Item

- Photo, back
- Prep chip: "12 min · at B14 by ~14:27"
- Restaurant name, item name, price
- Description
- Discount code field and Apply. FLY10 shows "FLY10 applied: 10% off this item"
- Optional kitchen note, placeholder "e.g. no onions"
- Quantity stepper
- Add to cart shows the original price struck through and the discounted price in yellow

## Done when

A 48-minute item cannot be added. Applying FLY10 changes the button from $14.50 to $13.85. Adding an item updates the sticky cart bar.

## Out of scope

The pay button and the confirmation code. Those are Phase 7.
