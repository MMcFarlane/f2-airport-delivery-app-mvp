# Phase 3 — Trip and time window

Status: Done. The first launch opens the trip sheet. Saving writes the trip through `TripRepository`. Home lists the Runway Burger menu against that window, and Account can change the same trip.

Depends on [02-data-boundary.md](02-data-boundary.md).

Artboard: `artboards/departure_and_food_order/Trip setup pop-up@1x.png`.

## Goal

The first launch opens the "Before you order" sheet. Manual entry is enough for this phase. SkyLink lookup is Phase 3b.

## Sheet

- Eyebrow: Before you order
- Title: Let's get food to your gate
- Copy: We'll only show items that can be cooked and delivered before you board.
- Scan boarding pass is visible and does nothing beyond a disabled or "later" state. Scanning is out of this build.
- Name, gate, and departure time. The mock uses Jordan, B14, and 15:40.
- Helper: Boarding usually starts 30 min before departure, so we'll aim to deliver by 15:00.
- Button: Show me what I can get.

Save the trip through `TripRepository`. Changing gate or departure time from Account or the cart updates the same trip.

## Filtering

Any list that asks "what can I order?" uses the domain time window against the active trip. Too-late items remain in the data. This phase only has to prove the rule on a simple list or debug view if Home is not built yet.

## Done when

Saving Jordan / B14 / 15:40 stores the trip, the helper shows deliver-by 15:00, and a 48-minute item is too late while a 12-minute item fits.

## Out of scope

Flight-number lookup, home carousels, and a working camera scanner.
