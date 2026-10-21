import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { itemFits, timeWindow } from './time-window';
import {
  activeOrder,
  arrivesAtLabel,
  canAdvanceStatus,
  deliveredOrders,
  inProgressLabel,
  pastOrderMeta,
  planReorder,
  progressFilled,
  reorderMessage,
} from './orders';
import type { Order } from './types';

const departure = new Date('2026-10-17T15:40:00-04:00');
const deliverBy = timeWindow(departure).deliverBy;
const now = new Date('2026-10-17T14:17:00-04:00');

function order(partial: Pick<Order, 'id' | 'status'> & Partial<Order>): Order {
  return {
    restaurantId: 'runway-burger',
    restaurantName: 'Runway Burger',
    restaurantInitials: 'RB',
    restaurantColor: '#FFC940',
    restaurantLocation: 'Concourse B, near gate B9',
    restaurantCoordinates: null,
    passengerLocation: null,
    code: '7K4Q',
    gate: 'B14',
    passengerName: 'Jordan',
    totalCents: 1450,
    placedAt: '2026-10-17T14:16:00-04:00',
    summary: 'Double smash burger',
    deliveredAt: null,
    lines: [],
    ...partial,
  };
}

describe('orders', () => {
  it('shows the newest in-progress order and keeps delivered orders in list order', () => {
    const orders = [
      order({ id: 'live', status: 'being_prepared', placedAt: '2026-10-19T16:00:00-04:00' }),
      order({ id: 'seed', status: 'received', placedAt: '2026-10-17T14:16:00-04:00' }),
      order({ id: 'cafe', status: 'delivered', placedAt: '2026-09-28T07:41:00-04:00' }),
      order({ id: 'noodle', status: 'delivered', placedAt: '2026-09-14T18:02:00-04:00' }),
    ];

    assert.equal(activeOrder(orders)?.id, 'live');
    assert.deepEqual(
      deliveredOrders(orders).map((entry) => entry.id),
      ['cafe', 'noodle'],
    );
  });

  it('labels the artboard in-progress card', () => {
    assert.equal(inProgressLabel('being_prepared'), 'IN PROGRESS · BEING PREPARED');
    assert.equal(progressFilled('being_prepared'), 2);
    assert.equal(progressFilled('at_gate'), 4);
    assert.equal(arrivesAtLabel('B14', '14:29'), 'Arrives at Gate B14 ~14:29');
    assert.equal(canAdvanceStatus('courier_on_the_way'), true);
    assert.equal(canAdvanceStatus('at_gate'), false);
  });

  it('formats past orders the way the artboard does', () => {
    assert.equal(
      pastOrderMeta({ at: '2026-09-28T07:41:00-04:00', gate: 'C22' }),
      'SEP 28 · GATE C22 · DELIVERED 07:41',
    );
    assert.equal(
      pastOrderMeta({ at: '2026-09-14T18:02:00-04:00', gate: 'A7' }),
      'SEP 14 · GATE A7 · DELIVERED 18:02',
    );
    assert.equal(
      pastOrderMeta({ at: '2026-08-30T12:18:00-04:00', gate: 'B3' }),
      'AUG 30 · GATE B3 · DELIVERED 12:18',
    );
  });

  it('adds only lines that still fit the current window', () => {
    const fits = (prepMinutes: number) => itemFits(now, prepMinutes, deliverBy);
    const plan = planReorder(
      [
        { itemId: 'double-smash-burger', name: 'Double smash burger', quantity: 1, prepMinutes: 12 },
        { itemId: 'brisket', name: 'Brisket', quantity: 1, prepMinutes: 48 },
        { itemId: null, name: 'Oat milk latte', quantity: 1, prepMinutes: 5 },
      ],
      new Set(['double-smash-burger', 'brisket']),
      fits,
    );

    assert.deepEqual(
      plan.map((line) => line.outcome),
      ['add', 'too_late', 'unavailable'],
    );
    assert.equal(
      reorderMessage(plan),
      'Brisket is too late for this departure. Oat milk latte is no longer on the menu. Added the rest to your cart.',
    );
    assert.equal(reorderMessage(plan.filter((line) => line.outcome === 'add')), null);
  });
});
