# Phase 7 — Cart, pay, and confirmation

Status: Not started.

Depends on [06-menu-and-item.md](06-menu-and-item.md).

Artboards:

- `artboards/departure_and_food_order/Cart & checkout@1x.png`
- `artboards/departure_and_food_order/Order confirmed · code@1x.png`

## Cart

- Title "Your cart" and an item count
- Black summary: "Deliver to gate B14", arrival, boarding time, spare minutes, "Courier finds you by name", and Change (reopens the trip)
- Lines grouped by restaurant, with quantity steppers
- Applied code row with Remove
- Tip: $2, $3 selected by default, $5, Other
- Breakdown: subtotal, discount, gate delivery fee $2.49, tax at 8% of discounted food, tip, total
- Saved card: Visa ending 4242, with Change
- Pay button shows the total, for example "Pay $26.60"

Reference numbers for the mock cart (burger $14.50, fries $6.50, FLY10, tip $3): discount $1.45, tax $1.56, total $26.60.

## Pay

Payment is simulated. Do not call a card network. On Pay, write an order through `OrderRepository` with status "being prepared", a 4-character code, the gate, the passenger name, and the line items. Clear the cart.

## Confirmation

- "Order placed, Jordan"
- Restaurant is cooking. We'll bring it to Gate B14.
- Code such as 7 K 4 Q, one character per cell
- Copy: give this code to the courier, and hand over the order only once it matches
- Timeline: Order received, Being prepared (now), Courier on the way, At Gate B14
- Item summary and total
- Track order opens the Orders tab
- Back to home opens Home

## Done when

Paying the reference cart creates a local order, shows a 4-character code, and leaves the cart empty.

## Out of scope

Real charges and live courier location.
