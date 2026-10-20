import type { SQLiteDatabase } from 'expo-sqlite';

import { SKYLINK_GATE_CACHE_MINUTES } from '@/src/config/skylink';
import type { FlightRepository } from '@/src/data/repositories';
import {
  airportToday,
  findDeparture,
  flightStatusToGate,
  normalizeFlightNumber,
  shouldRefresh,
  upcomingDepartures,
} from '@/src/data/skylink/board';
import { fetchFlightStatus } from '@/src/data/skylink/client';
import type { DepartureFlight, FlightGate } from '@/src/domain';

type DepartureRow = {
  flight_number: string;
  airline: string;
  status: string;
  destination: string;
  destination_iata: string;
  scheduled_time: string;
  departure_date: string;
};

type GateRow = {
  gate: string | null;
  terminal: string | null;
  status: string | null;
  fetched_at: string;
};

/** Reads the ATL board that refreshDepartures() keeps current, and looks up gates from SkyLink flight_status. */
export class SqliteFlightRepository implements FlightRepository {
  constructor(
    private readonly db: SQLiteDatabase,
    private readonly refreshing: Promise<void>,
    private readonly apiKey: string | null,
  ) {}

  async lookup(flightNumber: string): Promise<DepartureFlight | null> {
    return findDeparture(await this.listDepartures(), flightNumber);
  }

  async listDepartures(): Promise<DepartureFlight[]> {
    // The launch refresh is bounded by the SkyLink timeout and never rejects.
    await this.refreshing;
    const rows = await this.db.getAllAsync<DepartureRow>(
      `SELECT flight_number, airline, status, destination, destination_iata, scheduled_time, departure_date
       FROM departures
       ORDER BY departure_date, scheduled_time, flight_number`,
    );
    const flights = rows.map((row) => ({
      flightNumber: row.flight_number,
      airline: row.airline,
      status: row.status,
      destination: row.destination,
      destinationIata: row.destination_iata,
      scheduledTime: row.scheduled_time,
      departureDate: row.departure_date,
    }));
    return upcomingDepartures(flights, new Date());
  }

  async departureGate(flightNumber: string): Promise<FlightGate | null> {
    const number = normalizeFlightNumber(flightNumber);
    if (!number || !this.apiKey) return null;
    const now = new Date();
    const onBoard = findDeparture(await this.listDepartures(), number);
    const departureDate = onBoard?.departureDate ?? airportToday(now);

    const cached = await this.db.getFirstAsync<GateRow>(
      'SELECT gate, terminal, status, fetched_at FROM flight_gates WHERE flight_number = ? AND departure_date = ?',
      number,
      departureDate,
    );
    if (cached && !shouldRefresh(cached.fetched_at, now, SKYLINK_GATE_CACHE_MINUTES)) {
      return { gate: cached.gate, terminal: cached.terminal, status: cached.status };
    }

    try {
      const gate = flightStatusToGate(await fetchFlightStatus(this.apiKey, number));
      await this.db.runAsync(
        `INSERT INTO flight_gates (flight_number, departure_date, gate, terminal, status, fetched_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(flight_number, departure_date) DO UPDATE SET
           gate = excluded.gate,
           terminal = excluded.terminal,
           status = excluded.status,
           fetched_at = excluded.fetched_at`,
        number,
        departureDate,
        gate?.gate ?? null,
        gate?.terminal ?? null,
        gate?.status ?? null,
        now.toISOString(),
      );
      return gate;
    } catch (caught) {
      console.warn(caught instanceof Error ? caught.message : 'SkyLink flight status failed.');
      return cached ? { gate: cached.gate, terminal: cached.terminal, status: cached.status } : null;
    }
  }
}
