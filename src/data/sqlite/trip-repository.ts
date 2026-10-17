import type { SQLiteDatabase } from 'expo-sqlite';

import type { SaveTripInput, TripRepository } from '@/src/data/repositories';

import { mapTrip, type TripRow } from './mappers';

export class SqliteTripRepository implements TripRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async getTrip() {
    const row = await this.db.getFirstAsync<TripRow>(
      `SELECT passenger_name, gate, departure_at, flight_number, airline, flight_status FROM trip WHERE id = 1`,
    );
    return row ? mapTrip(row) : null;
  }

  async saveTrip(input: SaveTripInput) {
    await this.db.runAsync(
      `INSERT INTO trip (id, passenger_name, gate, departure_at, flight_number, airline, flight_status)
       VALUES (1, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         passenger_name = excluded.passenger_name,
         gate = excluded.gate,
         departure_at = excluded.departure_at,
         flight_number = excluded.flight_number,
         airline = excluded.airline,
         flight_status = excluded.flight_status`,
      input.passengerName,
      input.gate,
      input.departureAt,
      input.flightNumber ?? null,
      input.airline ?? null,
      input.flightStatus ?? null,
    );
    const trip = await this.getTrip();
    if (!trip) {
      throw new Error('Trip did not save');
    }
    return trip;
  }
}
