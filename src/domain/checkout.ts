import { formatClock } from './clock';
import { addMinutes } from './time-window';
import type { PriceLine } from './pricing';
import type { OrderStatus } from './types';

export const TIP_PRESETS_CENTS = [200, 300, 500] as const;

/** A just-placed order reads as received a minute before the demo clock (14:16 when now is 14:17). */
const RECEIVED_OFFSET_MINUTES = 1;

/** The courier step is five minutes before arrival (14:24 when the gate time is 14:29). */
const COURIER_LEAD_MINUTES = 5;

const TIMELINE: readonly OrderStatus[] = ['received', 'being_prepared', 'courier_on_the_way', 'at_gate'];

export const courierCodeCopy =
  'Give this code to your courier when they arrive. Only hand over your order once it matches.';

export type CartGroup<T> = {
  restaurantId: string;
  restaurantName: string;
  lines: T[];
};

export type TimelineStep = {
  label: string;
  detail: string;
  state: 'done' | 'current' | 'upcoming';
};

type PricedLine = {
  priceCents: number;
  quantity: number;
  discountCode: string | null;
};

export function cartPriceLines(lines: readonly PricedLine[], percents: Readonly<Record<string, number>>): PriceLine[] {
  return lines.map((line) => ({
    priceCents: line.priceCents,
    quantity: line.quantity,
    discountPercent: line.discountCode ? (percents[line.discountCode.toUpperCase()] ?? 0) : 0,
  }));
}

export function groupCartByRestaurant<T extends { restaurantId: string; restaurantName: string }>(
  lines: readonly T[],
): CartGroup<T>[] {
  const groups: CartGroup<T>[] = [];
  for (const line of lines) {
    const existing = groups.find((group) => group.restaurantId === line.restaurantId);
    if (existing) existing.lines.push(line);
    else groups.push({ restaurantId: line.restaurantId, restaurantName: line.restaurantName, lines: [line] });
  }
  return groups;
}

export function itemCountLabel(count: number): string {
  return count === 1 ? '1 item' : `${count} items`;
}

export function deliverToLabel(gate: string): string {
  return `Deliver to gate ${gate}`;
}

export function arrivalBoardLine(arrivalClock: string, boardingClock: string): string {
  return `Arrives ~${arrivalClock} · boarding ${boardingClock}`;
}

export function spareCopy(minutes: number): string {
  const spare = minutes < 0 ? 'This misses boarding' : `${minutes} min to spare`;
  return `${spare}. Courier finds you by name.`;
}

export function appliedCodeCopy(percentOff: number, itemName: string): string {
  const noun = itemName.trim().split(/\s+/).at(-1)?.toLowerCase();
  return noun ? `${percentOff}% off the ${noun}` : `${percentOff}% off`;
}

export function discountRowLabel(codes: readonly string[]): string {
  const unique = [...new Set(codes.map((code) => code.toUpperCase()))];
  return unique.length === 0 ? 'Discount' : `Discount (${unique.join(', ')})`;
}

export function isTipPreset(cents: number): boolean {
  return (TIP_PRESETS_CENTS as readonly number[]).includes(cents);
}

export function tipChipLabel(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
}

export function parseTipCents(value: string): number | null {
  const trimmed = value.trim().replace(/^\$/, '');
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const cents = Math.round(Number(trimmed) * 100);
  return Number.isFinite(cents) ? cents : null;
}

export function givenName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? '';
}

export function placedTitle(name: string): string {
  const given = givenName(name);
  return given ? `Order placed, ${given}` : 'Order placed';
}

export function cookingLine(restaurantName: string, gate: string): string {
  return `${restaurantName} is cooking. We'll bring it to Gate ${gate}.`;
}

export function orderItemSummary(names: readonly string[]): string {
  return names.filter((name) => name.trim().length > 0).join(', ');
}

export function codeCharacters(code: string): string[] {
  return code.replace(/\s+/g, '').toUpperCase().split('');
}

export function confirmationTimeline(input: {
  now: Date;
  arrivalAt: Date;
  gate: string;
  status: OrderStatus;
}): TimelineStep[] {
  const receivedAt = addMinutes(input.now, -RECEIVED_OFFSET_MINUTES);
  const courierAt = addMinutes(input.arrivalAt, -COURIER_LEAD_MINUTES);
  const currentIndex = input.status === 'delivered' ? -1 : TIMELINE.indexOf(input.status);
  const clocks = [
    { label: 'Order received', clock: formatClock(receivedAt), approximate: false },
    { label: 'Being prepared', clock: formatClock(input.now), approximate: false },
    { label: 'Courier on the way', clock: formatClock(courierAt), approximate: true },
    { label: `At Gate ${input.gate}`, clock: formatClock(input.arrivalAt), approximate: true },
  ];

  return clocks.map((step, index) => {
    const state = stepState(index, currentIndex);
    return {
      label: step.label,
      state,
      detail: state === 'current' ? 'now' : step.approximate ? `~${step.clock}` : step.clock,
    };
  });
}

function stepState(index: number, currentIndex: number): TimelineStep['state'] {
  if (currentIndex < 0 || index < currentIndex) return 'done';
  if (index === currentIndex) return 'current';
  return 'upcoming';
}
