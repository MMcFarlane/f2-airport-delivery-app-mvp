import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { demoOrderingNow, formatClock } from './clock';
import {
  arrivalLine,
  cartFoodCents,
  cartItemCount,
  cuisineLocationLine,
  discountAppliedCopy,
  fittingPrepRange,
  itemPrepChip,
  itemsForMenuTab,
  lineTotalCents,
  menuTabs,
  openUntilLabel,
  prepRangeLabel,
  toGateChip,
  tooLateLabel,
} from './menu';
import { cartArrival, itemFits, timeWindow } from './time-window';

const departure = new Date('2026-10-17T15:40:00-04:00');

const runway = [
  { name: 'Double smash burger', description: 'Two beef patties', category: 'Burgers', popular: true },
  { name: 'Crispy chicken sandwich', description: 'Buttermilk thigh, slaw, hot honey', category: 'Chicken', popular: true },
  { name: 'Classic cheeseburger', description: 'Single patty, cheddar', category: 'Burgers', popular: true },
  { name: 'Loaded fries', description: 'Cheese sauce, bacon', category: 'Sides', popular: true },
  { name: 'Smoked brisket platter', description: '12-hour brisket', category: null, popular: true },
];

describe('menu tabs', () => {
  it('lists Popular and then each category in menu order', () => {
    assert.deepEqual(
      menuTabs(runway).map((tab) => tab.label),
      ['Popular', 'Burgers', 'Chicken', 'Sides'],
    );
  });

  it('keeps a 48-minute popular item on Popular and out of Burgers', () => {
    const popular = itemsForMenuTab(runway, 'popular', '');
    assert.equal(
      popular.some((item) => item.name === 'Smoked brisket platter'),
      true,
    );
    assert.equal(
      itemsForMenuTab(runway, 'category:Burgers', '').some((item) => item.name === 'Smoked brisket platter'),
      false,
    );
  });

  it('searches the whole menu by name and description', () => {
    assert.deepEqual(
      itemsForMenuTab(runway, 'category:Burgers', 'honey').map((item) => item.name),
      ['Crispy chicken sandwich'],
    );
  });
});

describe('menu timing copy', () => {
  const now = demoOrderingNow(departure);
  const deliverBy = timeWindow(departure).deliverBy;
  const fits = (minutes: number) => itemFits(now, minutes, deliverBy);

  it('chips the gate with the prep range that still fits, and marks 48 minutes too late', () => {
    const range = fittingPrepRange([12, 14, 10, 8, 48], fits);
    assert.deepEqual(range, { min: 8, max: 14 });
    assert.equal(toGateChip('B14', prepRangeLabel(range!)), 'To B14 · 8-14 min');
    assert.equal(fits(48), false);
    assert.equal(tooLateLabel(formatClock(deliverBy)), 'Too late for 15:00');
    assert.equal(openUntilLabel('22:00'), 'Open until 22:00');
  });

  it('arrives a 12-minute cart at the gate by 14:29', () => {
    const clock = formatClock(cartArrival(now, [12, 8]));
    assert.equal(clock, '14:29');
    assert.equal(arrivalLine('B14', clock), 'Arrives at B14 by ~14:29');
    assert.equal(itemPrepChip(12, 'B14', formatClock(cartArrival(now, [12]))), '12 min · at B14 by ~14:29');
  });
});

describe('menu prices', () => {
  it('joins cuisine and location the way the menu header reads', () => {
    assert.equal(
      cuisineLocationLine('Burgers, fries, shakes', 'Concourse B, near gate B9'),
      'Burgers · Fries · Shakes · Concourse B, near gate B9',
    );
  });

  it('takes 10% off the $14.50 burger and keeps the sticky bar on food', () => {
    assert.equal(lineTotalCents(1450, 1, 0), 1450);
    assert.equal(lineTotalCents(1450, 1, 10), 1305);
    assert.equal(discountAppliedCopy('FLY10', '10% off this item'), 'FLY10 applied: 10% off this item');
    assert.equal(cartItemCount([{ quantity: 1 }, { quantity: 1 }]), 2);
    assert.equal(
      cartFoodCents([
        { priceCents: 1450, quantity: 1, discountPercent: 0 },
        { priceCents: 650, quantity: 1, discountPercent: 0 },
      ]),
      2100,
    );
    assert.equal(
      cartFoodCents([
        { priceCents: 1450, quantity: 1, discountPercent: 10 },
        { priceCents: 650, quantity: 1, discountPercent: 0 },
      ]),
      1955,
    );
  });
});
