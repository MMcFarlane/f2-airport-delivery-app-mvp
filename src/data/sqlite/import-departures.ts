import type { SQLiteDatabase } from 'expo-sqlite';

import rawCatalog from '@/src/data/skylink/departures.json';
import { airportToday, departuresForAirportDay, type DepartureCatalog } from '@/src/data/skylink/board';

const catalog = rawCatalog as DepartureCatalog;

export async function importDepartures(db: SQLiteDatabase, today = airportToday()): Promise<void> {
  const flights = departuresForAirportDay(catalog, today);
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM departures');
    for (const flight of flights) {
      await db.runAsync(
        `INSERT INTO departures (
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
  });
}
