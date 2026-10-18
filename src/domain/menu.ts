import { lineDiscountCents } from './pricing';
import type { MenuItem } from './types';

export type MenuTab = {
  id: string;
  label: string;
};

type MenuRow = Pick<MenuItem, 'name' | 'description' | 'category' | 'popular'>;

export function menuTabs(items: readonly Pick<MenuItem, 'category' | 'popular'>[]): MenuTab[] {
  const tabs: MenuTab[] = [];
  if (items.some((item) => item.popular)) {
    tabs.push({ id: 'popular', label: 'Popular' });
  }
  const seen = new Set<string>();
  for (const item of items) {
    if (!item.category || seen.has(item.category)) continue;
    seen.add(item.category);
    tabs.push({ id: `category:${item.category}`, label: item.category });
  }
  return tabs;
}

export function itemsForMenuTab<T extends MenuRow>(items: readonly T[], tabId: string | null, query: string): T[] {
  const needle = query.trim().toLowerCase();
  return items.filter((item) => {
    if (needle && !`${item.name} ${item.description}`.toLowerCase().includes(needle)) return false;
    if (needle) return true;
    if (tabId === null) return true;
    if (tabId === 'popular') return item.popular;
    if (tabId.startsWith('category:')) return item.category === tabId.slice('category:'.length);
    return false;
  });
}

export function fittingPrepRange(
  prepMinutes: readonly number[],
  fits: (prepMinutes: number) => boolean,
): { min: number; max: number } | null {
  const fitting = prepMinutes.filter((minutes) => fits(minutes));
  if (fitting.length === 0) return null;
  return {
    min: Math.min(...fitting),
    max: Math.max(...fitting),
  };
}

export function prepRangeLabel(range: { min: number; max: number }): string {
  return range.min === range.max ? `${range.min} min` : `${range.min}-${range.max} min`;
}

export function toGateChip(gate: string, rangeLabel: string): string {
  return `To ${gate} · ${rangeLabel}`;
}

export function openUntilLabel(openUntil: string): string {
  return `Open until ${openUntil}`;
}

export function tooLateLabel(deliverByClock: string): string {
  return `Too late for ${deliverByClock}`;
}

export function arrivalLine(gate: string, clock: string): string {
  return `Arrives at ${gate} by ~${clock}`;
}

export function itemPrepChip(prepMinutes: number, gate: string, arrivalClock: string): string {
  return `${prepMinutes} min · at ${gate} by ~${arrivalClock}`;
}

export function cuisineLocationLine(cuisine: string, location: string): string {
  const parts = cuisine
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1));
  return [...parts, location].filter(Boolean).join(' · ');
}

/** Price after an item-level percent off. FLY10 on $14.50 is $13.05, the same $1.45 used by the cart. */
export function lineTotalCents(priceCents: number, quantity: number, discountPercent: number): number {
  return priceCents * quantity - lineDiscountCents(priceCents, quantity, discountPercent);
}

export function cartItemCount(lines: readonly { quantity: number }[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function cartFoodCents(
  lines: readonly { priceCents: number; quantity: number; discountPercent: number }[],
): number {
  return lines.reduce((sum, line) => sum + lineTotalCents(line.priceCents, line.quantity, line.discountPercent), 0);
}

export function discountAppliedCopy(code: string, label: string): string {
  return `${code} applied: ${label}`;
}
