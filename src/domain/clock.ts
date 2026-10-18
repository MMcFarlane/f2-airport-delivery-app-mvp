import { airport } from '../config/airport';

const timeZone = airport.timezone;

export type CalendarDay = {
  year: number;
  month: number;
  day: number;
};

export const demoOrderingClock = { hour: 14, minute: 17 } as const;

export function calendarDay(instant: Date, zone = timeZone): CalendarDay {
  const parts = partsInZone(instant, zone);
  return {
    year: numberPart(parts, 'year'),
    month: numberPart(parts, 'month'),
    day: numberPart(parts, 'day'),
  };
}

export function todayInAirport(now = new Date(), zone = timeZone): CalendarDay {
  return calendarDay(now, zone);
}

export function parseClock(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

export function formatClock(instant: Date, zone = timeZone): string {
  const parts = partsInZone(instant, zone);
  const minute = String(numberPart(parts, 'minute')).padStart(2, '0');
  return `${String(clockHour(parts)).padStart(2, '0')}:${minute}`;
}

export function zonedDateTime(day: CalendarDay, hour: number, minute: number, zone = timeZone): Date {
  const utcGuess = Date.UTC(day.year, day.month - 1, day.day, hour, minute, 0);
  const firstOffset = zoneOffsetMs(new Date(utcGuess), zone);
  const instant = new Date(utcGuess - firstOffset);
  const secondOffset = zoneOffsetMs(instant, zone);
  return secondOffset === firstOffset ? instant : new Date(utcGuess - secondOffset);
}

export function departureInstant(clock: string, day: CalendarDay, zone = timeZone): Date | null {
  const parsed = parseClock(clock);
  if (!parsed) return null;
  return zonedDateTime(day, parsed.hour, parsed.minute, zone);
}

/** Artboard afternoon. A live evening clock would mark the 15:00 deliver-by as already missed. */
export function demoOrderingNow(departureAt: Date, zone = timeZone): Date {
  return zonedDateTime(calendarDay(departureAt, zone), demoOrderingClock.hour, demoOrderingClock.minute, zone);
}

function partsInZone(instant: Date, zone: string): Intl.DateTimeFormatPart[] {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
}

function zoneOffsetMs(instant: Date, zone: string): number {
  const parts = partsInZone(instant, zone);
  const asUtc = Date.UTC(
    numberPart(parts, 'year'),
    numberPart(parts, 'month') - 1,
    numberPart(parts, 'day'),
    clockHour(parts),
    numberPart(parts, 'minute'),
    numberPart(parts, 'second'),
  );
  return asUtc - instant.getTime();
}

function clockHour(parts: Intl.DateTimeFormatPart[]): number {
  const hour = numberPart(parts, 'hour');
  return hour === 24 ? 0 : hour;
}

function numberPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
  return Number(parts.find((part) => part.type === type)?.value ?? '0');
}
