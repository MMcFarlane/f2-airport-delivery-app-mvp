import { calendarDay, formatClock } from './clock';
import type { Order, OrderStatus } from './types';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] as const;

const PROGRESS: readonly OrderStatus[] = ['received', 'being_prepared', 'courier_on_the_way', 'at_gate'];

const STATUS_LABEL: Record<OrderStatus, string> = {
  received: 'RECEIVED',
  being_prepared: 'BEING PREPARED',
  courier_on_the_way: 'COURIER ON THE WAY',
  at_gate: 'AT GATE',
  delivered: 'DELIVERED',
};

export const PROGRESS_SEGMENTS = PROGRESS.length;

export const reorderFootnote =
  'When you reorder, we check every item against your current gate and departure time first.';

export type ReorderLine = {
  itemId: string | null;
  name: string;
  quantity: number;
  prepMinutes: number;
};

export type ReorderDecision = ReorderLine & {
  outcome: 'add' | 'too_late' | 'unavailable';
};

/** Newest non-delivered order. `listOrders` is already newest first. */
export function activeOrder(orders: readonly Order[]): Order | null {
  return orders.find((order) => order.status !== 'delivered') ?? null;
}

export function deliveredOrders(orders: readonly Order[]): Order[] {
  return orders.filter((order) => order.status === 'delivered');
}

export function inProgressLabel(status: OrderStatus): string {
  return `IN PROGRESS · ${STATUS_LABEL[status]}`;
}

export function progressFilled(status: OrderStatus): number {
  const index = PROGRESS.indexOf(status);
  return index < 0 ? PROGRESS_SEGMENTS : index + 1;
}

export function canAdvanceStatus(status: OrderStatus): boolean {
  return status !== 'at_gate' && status !== 'delivered';
}

export function arrivesAtLabel(gate: string, clock: string): string {
  return `Arrives at Gate ${gate} ~${clock}`;
}

export function pastOrderMeta(input: { at: string; gate: string }): string {
  const instant = new Date(input.at);
  const day = calendarDay(instant);
  const month = MONTHS[day.month - 1] ?? 'JAN';
  return `${month} ${day.day} · GATE ${input.gate.toUpperCase()} · DELIVERED ${formatClock(instant)}`;
}

export function planReorder(
  lines: readonly ReorderLine[],
  availableIds: ReadonlySet<string>,
  fits: (prepMinutes: number) => boolean,
): ReorderDecision[] {
  return lines.map((line) => {
    if (!line.itemId || !availableIds.has(line.itemId)) {
      return { ...line, outcome: 'unavailable' };
    }
    if (!fits(line.prepMinutes)) {
      return { ...line, outcome: 'too_late' };
    }
    return { ...line, outcome: 'add' };
  });
}

export function reorderMessage(decisions: readonly ReorderDecision[]): string | null {
  const skipped = decisions.filter((decision) => decision.outcome !== 'add');
  if (skipped.length === 0) return null;
  const reasons = skipped.map((decision) =>
    decision.outcome === 'too_late'
      ? `${decision.name} is too late for this departure.`
      : `${decision.name} is no longer on the menu.`,
  );
  const added = decisions.some((decision) => decision.outcome === 'add');
  return added ? `${reasons.join(' ')} Added the rest to your cart.` : reasons.join(' ');
}
