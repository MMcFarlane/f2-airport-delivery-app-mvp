# Phase 9 — Mock pass

Status: Not started.

Depends on [08a-browse-hub.md](08a-browse-hub.md).

## Goal

Walk every screen against its PNG and against the rules in [../plan.md](../plan.md). Use `CATALOG_SOURCE=fixtures` so the names match the artboards.

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

Then, if `SKYLINK_API_KEY` is present, look up one live ATL flight and confirm the sheet fills departure time and keeps the gate editable when SkyLink returns an empty gate.

## Done when

Each mismatch you find is fixed, and the phase status at the top of the earlier files is updated to done.

## Out of scope

New features. This phase only closes gaps against the spec, the domain rules, and the PNGs.
