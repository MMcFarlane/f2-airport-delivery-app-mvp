export { colors } from './colors';

export const radii = {
  card: 20,
  control: 28,
  chip: 20,
  thumb: 16,
  badge: 10,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const type = {
  title: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '800' as const,
    letterSpacing: -0.6,
    color: '#111111',
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700' as const,
    color: '#111111',
  },
  body: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400' as const,
    color: '#5C5C58',
  },
  label: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700' as const,
    color: '#111111',
  },
  button: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700' as const,
  },
  badge: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800' as const,
    letterSpacing: 0.3,
  },
} as const;
