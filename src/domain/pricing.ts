export const GATE_FEE_CENTS = 249;
export const TAX_RATE_PERCENT = 8;
export const DEFAULT_TIP_CENTS = 300;

export type PriceLine = {
  priceCents: number;
  quantity: number;
  discountPercent: number;
};

export type PriceQuote = {
  subtotalCents: number;
  discountCents: number;
  discountedFoodCents: number;
  feeCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
};

const EMPTY_QUOTE: PriceQuote = {
  subtotalCents: 0,
  discountCents: 0,
  discountedFoodCents: 0,
  feeCents: 0,
  taxCents: 0,
  tipCents: 0,
  totalCents: 0,
};

export function lineDiscountCents(priceCents: number, quantity: number, discountPercent: number): number {
  return Math.round((priceCents * quantity * discountPercent) / 100);
}

export function priceCart(lines: readonly PriceLine[], tipCents: number = DEFAULT_TIP_CENTS): PriceQuote {
  if (lines.length === 0) {
    return EMPTY_QUOTE;
  }

  const subtotalCents = lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0);
  const discountCents = lines.reduce(
    (sum, line) => sum + lineDiscountCents(line.priceCents, line.quantity, line.discountPercent),
    0,
  );
  const discountedFoodCents = subtotalCents - discountCents;
  const taxCents = Math.round((discountedFoodCents * TAX_RATE_PERCENT) / 100);
  const totalCents = discountedFoodCents + GATE_FEE_CENTS + taxCents + tipCents;

  return {
    subtotalCents,
    discountCents,
    discountedFoodCents,
    feeCents: GATE_FEE_CENTS,
    taxCents,
    tipCents,
    totalCents,
  };
}
