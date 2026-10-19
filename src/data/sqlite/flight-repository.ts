import type { SQLiteDatabase } from 'expo-sqlite';

import type { FlightRepository } from '@/src/data/repositories';
import { findDeparture } from '@/src/data/skylink/board';
import type { DepartureFlight } from '@/src/domain';

type DepartureRow = {
  flight_number: string;
  airline: string;
  status: string;
  destination: string;
  destination_iata: string;
  scheduled_time: string;
  departure_date: string;
};

/** Reads the seeded ATL board. SkyLink calls stay disabled in src/config/skylink.ts. */
export class SqliteFlightRepository implements FlightRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async lookup(flightNumber: string): Promise<DepartureFlight | null> {
    return findDeparture(await this.listDepartures(), flightNumber);
  }

  async listDepartures(): Promise<DepartureFlight[]> {
    const rows = await this.db.getAllAsync<DepartureRow>(
      `SELECT flight_number, airline, status, destination, destination_iata, scheduled_time, departure_date
       FROM departures
       ORDER BY departure_date, scheduled_time, flight_number`,
    );
    return rows.map((row) => ({
      flightNumber: row.flight_number,
      airline: row.airline,
      status: row.status,
      destination: row.destination,
      destinationIata: row.destination_iata,
      scheduledTime: row.scheduled_time,
      departureDate: row.departure_date,
    }));
  }
}
