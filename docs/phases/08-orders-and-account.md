# Phase 8 — Orders and account

Status: Not started.

Depends on [07-cart-pay-code.md](07-cart-pay-code.md).

Artboards:

- `artboards/restaurant_details/Orders · active & past@1x.png`
- `artboards/restaurant_details/Profile@1x.png`

## Orders

The Orders tab stays active.

- In-progress card: restaurant, "Arrives at Gate B14 ~14:29", code, and a progress bar. This is the order Phase 7 just created. Seed data can also supply one if no live order exists.
- A demo control advances status: received → being prepared → courier on the way → at gate. This is for the demo, so the timeline is not frozen.
- Past orders: Gate Café $9.80, Sky Noodle $24.15, Runway Burger $23.40, with the dates, gates, and delivered times from the artboard.
- Each past order has Receipt and Reorder.
- Footnote: "When you reorder, we check every item against your current gate and departure time first."
- Reorder adds only items that still fit. If something is too late, say so and do not add that line.

## Account

Account is not a tab. The home artboard's fourth tab is Cart. This screen stays at `/account` until it has an entry point.

- Jordan, email, phone, Edit
- Current trip: Gate B14 · Dep 15:40, and Change opens the trip sheet
- Dietary chips: Vegetarian, Vegan, Gluten-free, Nut allergy, Halal. Multiple can be on. Persist them.
- Notification toggles: order updates by text, boarding reminders, deals at my airport
- Rows: Payment methods (Visa 4242), Past orders (count, opens Orders), Promo codes (FLY10), Help and support

Edit, payment change, receipt, and help can be simple local screens or sheets. They do not need a backend.

## Done when

The order from Phase 7 shows as in progress, the demo control moves the timeline, reorder refuses items that miss the current window, and profile edits survive a reload.

## Out of scope

SMS, push, and a real receipt PDF.
