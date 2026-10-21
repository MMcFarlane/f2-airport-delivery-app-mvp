# Phase 9 — Mock pass

Status: Not started.

Depends on [08b-courier-map.md](08b-courier-map.md).

## Goal

Walk every screen against its PNG and against the rules in [../plan.md](../plan.md). Use `CATALOG_SOURCE=fixtures` so the names match the artboards. Write down where the app, the PNG, and the rules differ. Do not change the app to close those gaps.

## Checks

- Trip sheet copy, helper time, and the 15:40 → deliver-by 15:00 example
- Menu category tabs, too-late brisket, sticky cart bar
- Item discount math: FLY10 takes the burger from $14.50 to $13.85
- Cart breakdown totals $26.60 for the reference cart
- Confirmation code and timeline
- Restaurant, featured, and specials search and chips
- Browse hub gate pill, unfiltered counts of 7, 6, and 5, the category lines, and a chip that changes those counts
- Tabbed screens show Home, Browse, Orders, and Account. Menu, item, cart, and confirmation show no tab bar
- Orders in-progress card and past orders
- Account trip, dietary chips, and toggles
- Empty cart
- A departure so soon that nothing in the window fits
- An invalid discount code
- Reorder when the new departure makes an old item too late
- Courier view with location allowed: map, both pins, line, distance, and "Live location"
- Courier view after denying location at Pay: the order still places and the pin falls back to the gate's concourse
- Courier view has no tab bar, and the web build shows the summary card

Then, if `SKYLINK_API_KEY` is present, pick one live ATL flight and confirm the sheet fills departure time, fills the gate when SkyLink has one, and keeps the gate editable when SkyLink sends `--`. Confirm a typed gate survives a relaunch.

## Done when

The differences are recorded in this file. Product code, the fixture catalog, and earlier phase files stay as they are.

## Out of scope

Fixes, catalog edits, and new features. This phase reports differences. It does not close them.
