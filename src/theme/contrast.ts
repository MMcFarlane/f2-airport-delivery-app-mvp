import { colors } from './colors';

export function markInk(hex: string): string {
  return luminance(hex) > 0.62 ? colors.ink : colors.surface;
}

export function markNeedsBorder(hex: string): boolean {
  return luminance(hex) > 0.92;
}

function luminance(hex: string): number {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return 1;
  const red = Number.parseInt(raw.slice(0, 2), 16);
  const green = Number.parseInt(raw.slice(2, 4), 16);
  const blue = Number.parseInt(raw.slice(4, 6), 16);
  if (Number.isNaN(red) || Number.isNaN(green) || Number.isNaN(blue)) return 1;
  return (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
}
