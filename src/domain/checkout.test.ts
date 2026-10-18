import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  appliedCodeCopy,
  arrivalBoardLine,
  cartPriceLines,
  codeCharacters,
  confirmationTimeline,
  cookingLine,
  discountRowLabel,
  groupCartByRestaurant,
  itemCountLabel,
  orderItemSummary,
  parseTipCents,
  placedTitle,
  spareCopy,
  tipChipLabel,
} from './checkout';
import { formatClock } from './clock';
import { priceCart } from './pricing';
import { cartArrival } from './time-window';

const now = new Date('2026-10-17T14:17:00-04:00');

describe('checkout pricing', () => {
  it('prices the reference burger and fries cart at $26.60', () => {
    const lines = cartPriceLines(
      [
        { priceCents: 1450, quantity: 1, discountCode: 'FLY10' },
        { priceCents: 650, quantity: 1, discountCode: null },
      ],
      { FLY10: 10 },
    );
    const quote = priceCart(lines);

    assert.equal(quote.discountCents, 145);
    assert.equal(quote.taxCents, 156);
    assert.equal(quote.totalCents, 2660);
    assert.equal(discountRowLabel(['FLY10']), 'Discount (FLY10)');
    assert.equal(appliedCodeCopy(10, 'Double smash burger'), '10% off the burger');
  });
});

describe('checkout copy', () => {
  it('describes the reference delivery and confirmation', () => {
    const arrival = formatClock(cartArrival(now, [12, 8]));

    assert.equal(arrival, '14:29');
    assert.equal(itemCountLabel(2), '2 items');
    assert.equal(arrivalBoardLine(arrival, '15:10'), 'Arrives ~14:29 · boarding 15:10');
    assert.equal(spareCopy(41), '41 min to spare. Courier finds you by name.');
    assert.equal(placedTitle('Jordan Lee'), 'Order placed, Jordan');
    assert.equal(cookingLine('Runway Burger', 'B14'), "Runway Burger is cooking. We'll bring it to Gate B14.");
    assert.equal(orderItemSummary(['Double smash burger', 'Loaded fries']), 'Double smash burger, Loaded fries');
    assert.deepEqual(codeCharacters('7 K 4 Q'), ['7', 'K', '4', 'Q']);
    assert.equal(tipChipLabel(300), '$3');
    assert.equal(parseTipCents('$4.50'), 450);
    assert.equal(parseTipCents('3.555'), null);
  });

  it('builds the confirmation timeline for an order that is being prepared', () => {
    const steps = confirmationTimeline({
      now,
      arrivalAt: cartArrival(now, [12]),
      gate: 'B14',
      status: 'being_prepared',
    });

    assert.deepEqual(
      steps.map((step) => [step.label, step.detail, step.state]),
      [
        ['Order received', '14:16', 'done'],
        ['Being prepared', 'now', 'current'],
        ['Courier on the way', '~14:24', 'upcoming'],
        ['At Gate B14', '~14:29', 'upcoming'],
      ],
    );
  });

  it('keeps lines under the restaurant they came from', () => {
    const groups = groupCartByRestaurant([
      { restaurantId: 'runway-burger', restaurantName: 'Runway Burger', name: 'Double smash burger' },
      { restaurantId: 'gate-cafe', restaurantName: 'Gate Café', name: 'Latte' },
      { restaurantId: 'runway-burger', restaurantName: 'Runway Burger', name: 'Loaded fries' },
    ]);

    assert.deepEqual(
      groups.map((group) => [group.restaurantName, group.lines.map((line) => line.name)]),
      [
        ['Runway Burger', ['Double smash burger', 'Loaded fries']],
        ['Gate Café', ['Latte']],
      ],
    );
  });
});
