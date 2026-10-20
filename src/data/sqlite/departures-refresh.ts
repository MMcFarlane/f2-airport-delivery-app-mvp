import type { SQLiteDatabase } from 'expo-sqlite';

import { SKYLINK_REFRESH_MINUTES } from '@/src/config/skylink';
import rawCatalog from '@/src/data/skylink/departures.json';
import {
  airportToday,
  departuresForAirportDay,
  scheduleRowsToFlights,
  shouldRefresh,
  type DepartureCatalog,
} from '@/src/data/skylink/board';
import { fetchDepartureRows } from '@/src/data/skylink/client';
import type { DepartureFlight } from '@/src/domain';

const bundled = rawCatalog as DepartureCatalog;

/**
 * Runs on every launch before any screen reads the board. Removes rows from past airport days,
 * so the departures and gate tables never hold more than today's data. An empty board falls back
 * to the bundled snapshot, so a first launch with no network still lists flights.
 */
export async function prepareDepartures(db: SQLiteDatabase, now = new Date()): Promise<void> {
  const today = airportToday(now);
  await db.runAsync('DELETE FROM departures WHERE departure_date < ?', today);
  await db.runAsync('DELETE FROM flight_gates WHERE departure_date < ?', today);

  const stored = await db.getFirstAsync<{ count: number }>('SELECT count(*) AS count FROM departures');
  if ((stored?.count ?? 0) > 0) return;

  await db.withTransactionAsync(async () => {
    await insertFlights(db, departuresForAirportDay(bundled, today));
    await db.runAsync(
      `INSERT INTO departure_board (id, fetched_at, source) VALUES (1, NULL, 'bundled')
       ON CONFLICT(id) DO UPDATE SET source = excluded.source`,
    );
  });
}

/**
 * Replaces the board with SkyLink's live ATL departures, at most once every SKYLINK_REFRESH_MINUTES.
 * Never throws: a missing key, HTTP error, timeout, or empty answer keeps the stored board.
 */
export async function refreshDepartures(db: SQLiteDatabase, apiKey: string | null, now = new Date()): Promise<void> {
  if (!apiKey) return;
  try {
    const board = await db.getFirstAsync<{ fetched_at: string | null }>(
      'SELECT fetched_at FROM departure_board WHERE id = 1',
    );
    if (!shouldRefresh(board?.fetched_at ?? null, now, SKYLINK_REFRESH_MINUTES)) return;

    const rows = await fetchDepartureRows(apiKey, now);
    const flights = scheduleRowsToFlights(rows.flights, now);
    if (flights.length === 0) {
      console.warn('SkyLink returned no ATL departures in the next 12 hours. Keeping the stored board.');
      return;
    }

    await db.withTransactionAsync(async () => {
      await db.execAsync('DELETE FROM departures');
      await insertFlights(db, flights);
      await db.runAsync(
        `INSERT INTO departure_board (id, fetched_at, source) VALUES (1, ?, 'skylink')
         ON CONFLICT(id) DO UPDATE SET fetched_at = excluded.fetched_at, source = excluded.source`,
        now.toISOString(),
      );
    });
  } catch (caught) {
    console.warn(caught instanceof Error ? caught.message : 'SkyLink departures refresh failed.', 'Keeping the stored board.');
  }
}

async function insertFlights(db: SQLiteDatabase, flights: readonly DepartureFlight[]): Promise<void> {
  for (const flight of flights) {
    await db.runAsync(
      `INSERT OR REPLACE INTO departures (
         flight_number, airline, status, destination, destination_iata, scheduled_time, departure_date
       ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      flight.flightNumber,
      flight.airline,
      flight.status,
      flight.destination,
      flight.destinationIata,
      flight.scheduledTime,
      flight.departureDate,
    );
  }
}
