import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { demoOrderingNow, departureInstant, formatClock } from './clock';
import { cartArrival, itemFits, spareMinutes, timeWindow } from './time-window';
import { priceCart } from './pricing';

const departure = new Date('2026-10-17T15:40:00-04:00');
const now = new Date('2026-10-17T14:17:00-04:00');

describe('time window', () => {
  it('turns a 15:40 departure into boarding at 15:10 and deliver-by at 15:00', () => {
    const window = timeWindow(departure);

    assert.equal(window.boardingAt.toISOString(), '2026-10-17T19:10:00.000Z');
    assert.equal(window.deliverBy.toISOString(), '2026-10-17T19:00:00.000Z');
  });

  it('fits a 12-minute item and rejects a 48-minute item for a 15:00 deliver-by', () => {
    const { deliverBy } = timeWindow(departure);

    assert.equal(itemFits(now, 12, deliverBy), true);
    assert.equal(itemFits(now, 43, deliverBy), true);
    assert.equal(itemFits(now, 44, deliverBy), false);
    assert.equal(itemFits(now, 48, deliverBy), false);
  });

  it('cooks the cart in parallel and counts spare minutes until boarding', () => {
    const { boardingAt } = timeWindow(departure);
    const arrival = cartArrival(now, [12, 8]);

    assert.equal(arrival.toISOString(), '2026-10-17T18:29:00.000Z');
    assert.equal(spareMinutes(boardingAt, arrival), 41);
  });
});

describe('airport clock', () => {
  const day = { year: 2026, month: 10, day: 17 };

  it('stores 15:40 in America/New_York and aims to deliver by 15:00', () => {
    const stored = departureInstant('15:40', day);
    assert.ok(stored);
    assert.equal(stored.toISOString(), '2026-10-17T19:40:00.000Z');
    assert.equal(formatClock(timeWindow(stored).deliverBy), '15:00');
  });

  it('uses the artboard afternoon so a 12-minute item fits and a 48-minute item does not', () => {
    const stored = departureInstant('15:40', day);
    assert.ok(stored);
    const now = demoOrderingNow(stored);
    const { deliverBy } = timeWindow(stored);

    assert.equal(now.toISOString(), '2026-10-17T18:17:00.000Z');
    assert.equal(itemFits(now, 12, deliverBy), true);
    assert.equal(itemFits(now, 48, deliverBy), false);
  });
});

describe('pricing', () => {
  it('prices the reference burger and fries cart at $26.60', () => {
    const quote = priceCart([
      { priceCents: 1450, quantity: 1, discountPercent: 10 },
      { priceCents: 650, quantity: 1, discountPercent: 0 },
    ]);

    assert.equal(quote.subtotalCents, 2100);
    assert.equal(quote.discountCents, 145);
    assert.equal(quote.discountedFoodCents, 1955);
    assert.equal(quote.feeCents, 249);
    assert.equal(quote.taxCents, 156);
    assert.equal(quote.tipCents, 300);
    assert.equal(quote.totalCents, 2660);
  });

  it('leaves an empty cart at zero', () => {
    assert.deepEqual(priceCart([]), {
      subtotalCents: 0,
      discountCents: 0,
      discountedFoodCents: 0,
      feeCents: 0,
      taxCents: 0,
      tipCents: 0,
      totalCents: 0,
    });
  });
});
