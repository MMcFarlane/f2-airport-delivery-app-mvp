import { airport } from '@/src/config/airport';
import { parseClock, todayInAirport, zonedDateTime, type CalendarDay } from '@/src/domain/clock';
import type { DepartureFlight, FlightGate } from '@/src/domain/types';

export const DEPARTURE_WINDOW_HOURS = 12;
export const SHORT_DEPARTURE_COUNT = 6;

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

/** The bundled offline snapshot. `lastRolledOn` is the airport day its dates belong to. */
export type DepartureCatalog = {
  seededAt: string | null;
  lastRolledOn: string | null;
  flights: DepartureFlight[];
};

export function parseSkyLinkDate(label: string, today: CalendarDay): string | null {
  const match = /^(\d{1,2})\s+([A-Za-z]{3})$/.exec(label.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = MONTHS[match[2].toLowerCase()];
  if (!month || day < 1 || day > 31) return null;
  const year = month < today.month || (month === today.month && day < today.day) ? today.year + 1 : today.year;
  return isoDate({ year, month, day });
}

export function isoDate(day: CalendarDay): string {
  return `${day.year}-${String(day.month).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
}

export function addCalendarDays(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}

export function diffCalendarDays(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  const to = Date.parse(`${toIso}T00:00:00Z`);
  return Math.round((to - from) / 86_400_000);
}

export function airportToday(now = new Date()): string {
  return isoDate(todayInAirport(now, airport.timezone));
}

export function calendarDayFromIso(iso: string): CalendarDay | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

export function departureDateOn(departureDate: string, lastRolledOn: string | null, today: string): string {
  if (!lastRolledOn) return departureDate;
  const days = diffCalendarDays(lastRolledOn, today);
  return days > 0 ? addCalendarDays(departureDate, days) : departureDate;
}

export function departuresForAirportDay(catalog: DepartureCatalog, today: string): DepartureFlight[] {
  return catalog.flights.map((flight) => ({
    ...flight,
    departureDate: departureDateOn(flight.departureDate, catalog.lastRolledOn, today),
  }));
}

export function normalizeFlightNumber(value: string): string {
  return value.replace(/\s+/g, '').toUpperCase();
}

export function findDeparture(flights: readonly DepartureFlight[], flightNumber: string): DepartureFlight | null {
  const needle = normalizeFlightNumber(flightNumber);
  if (!needle) return null;
  return flights.find((flight) => normalizeFlightNumber(flight.flightNumber) === needle) ?? null;
}

export function shortDepartureList(
  flights: readonly DepartureFlight[],
  query: string,
  limit = SHORT_DEPARTURE_COUNT,
): DepartureFlight[] {
  const needle = normalizeFlightNumber(query);
  const matched = needle
    ? flights.filter((flight) => normalizeFlightNumber(flight.flightNumber).includes(needle))
    : flights;
  return matched.slice(0, limit);
}

export function scheduleRowsToFlights(rows: readonly unknown[], now: Date): DepartureFlight[] {
  const today = todayInAirport(now, airport.timezone);
  const start = now.getTime();
  const end = start + DEPARTURE_WINDOW_HOURS * 60 * 60 * 1000;
  const flights: DepartureFlight[] = [];

  for (const row of rows) {
    const flight = scheduleRowToFlight(row, today);
    if (!flight) continue;
    const instant = flightDepartureInstant(flight);
    if (!instant || instant.getTime() < start || instant.getTime() >= end) continue;
    flights.push(flight);
  }

  flights.sort((left, right) => {
    const byDate = left.departureDate.localeCompare(right.departureDate);
    if (byDate !== 0) return byDate;
    return left.scheduledTime.localeCompare(right.scheduledTime);
  });
  return flights;
}

function scheduleRowToFlight(row: unknown, today: CalendarDay): DepartureFlight | null {
  if (!row || typeof row !== 'object') return null;
  const record = row as Record<string, unknown>;
  const flightNumber = text(record.Flight);
  const scheduledTime = normalizeClock(text(record.Time));
  const departureDate = parseSkyLinkDate(text(record.Date), today);
  if (!flightNumber || !scheduledTime || !departureDate) return null;
  return {
    flightNumber,
    airline: text(record.Airline),
    status: text(record.Status),
    destination: text(record.Destination),
    destinationIata: text(record.IATA),
    scheduledTime,
    departureDate,
  };
}

export function shouldRefresh(fetchedAt: string | null, now: Date, minutes: number): boolean {
  if (!fetchedAt) return true;
  const fetched = Date.parse(fetchedAt);
  if (Number.isNaN(fetched)) return true;
  return now.getTime() - fetched >= minutes * 60_000;
}

/** Drops flights that have already left so the picker never offers a departed flight. */
export function upcomingDepartures(flights: readonly DepartureFlight[], now: Date): DepartureFlight[] {
  return flights.filter((flight) => {
    const instant = flightDepartureInstant(flight);
    return instant !== null && instant.getTime() >= now.getTime();
  });
}

/**
 * Maps a SkyLink flight_status body to the ATL departure gate.
 * A flight number can fly several legs, so only a departure from this airport counts.
 * Live answers name the airport as "ATL • Atlanta" and send "--" for an unpublished gate.
 */
export function flightStatusToGate(body: unknown): FlightGate | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  const departure = record.departure;
  if (!departure || typeof departure !== 'object') return null;
  const leg = departure as Record<string, unknown>;
  const from = text(leg.airport).split(/[\s•]+/)[0]?.toUpperCase() ?? '';
  if (from !== airport.icao && from !== airport.iata) return null;
  return {
    gate: published(leg.gate)?.toUpperCase() ?? null,
    terminal: published(leg.terminal),
    status: published(record.status),
  };
}

function published(value: unknown): string | null {
  const trimmed = text(value);
  return trimmed && !/^-+$/.test(trimmed) ? trimmed : null;
}

export function flightDepartureInstant(flight: DepartureFlight): Date | null {
  const clock = parseClock(flight.scheduledTime);
  const [year, month, day] = flight.departureDate.split('-').map(Number);
  if (!clock || !year || !month || !day) return null;
  return zonedDateTime({ year, month, day }, clock.hour, clock.minute, airport.timezone);
}

function normalizeClock(value: string): string | null {
  const clock = parseClock(value);
  if (!clock) return null;
  return `${String(clock.hour).padStart(2, '0')}:${String(clock.minute).padStart(2, '0')}`;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
