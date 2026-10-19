import { addCalendarDays, diffCalendarDays, type DepartureCatalog } from '@/src/data/skylink/board';
import type { DepartureFlight } from '@/src/domain/types';

type SqlValue = string | number | null;

export type DepartureSql = {
  exec(sql: string): void;
  get<T>(sql: string, params?: readonly SqlValue[]): T | undefined;
  all<T>(sql: string, params?: readonly SqlValue[]): T[];
  run(sql: string, params?: readonly SqlValue[]): void;
};

export const DEPARTURES_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS departures (
  flight_number TEXT NOT NULL,
  airline TEXT NOT NULL,
  status TEXT NOT NULL,
  destination TEXT NOT NULL,
  destination_iata TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  departure_date TEXT NOT NULL,
  PRIMARY KEY (flight_number, departure_date, scheduled_time)
);

CREATE TABLE IF NOT EXISTS departure_board (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  seeded_at TEXT NOT NULL,
  last_rolled_on TEXT NOT NULL,
  calls_disabled INTEGER NOT NULL
);
`;

type BoardRow = {
  seeded_at: string;
  last_rolled_on: string;
  calls_disabled: number;
};

type FlightRow = {
  flight_number: string;
  airline: string;
  status: string;
  destination: string;
  destination_iata: string;
  scheduled_time: string;
  departure_date: string;
};

export function ensureDepartureSchema(db: DepartureSql): void {
  db.exec(DEPARTURES_SCHEMA_SQL);
}

export function readDepartureCatalog(db: DepartureSql): DepartureCatalog {
  const board = db.get<BoardRow>('SELECT seeded_at, last_rolled_on, calls_disabled FROM departure_board WHERE id = 1');
  const rows = db.all<FlightRow>(
    `SELECT flight_number, airline, status, destination, destination_iata, scheduled_time, departure_date
     FROM departures
     ORDER BY departure_date, scheduled_time, flight_number`,
  );
  return {
    seededAt: board?.seeded_at ?? null,
    lastRolledOn: board?.last_rolled_on ?? null,
    callsDisabled: board?.calls_disabled === 1,
    flights: rows.map(mapFlight),
  };
}

export function writeDepartureCatalog(db: DepartureSql, catalog: DepartureCatalog): void {
  db.exec('BEGIN');
  try {
    db.run('DELETE FROM departures');
    for (const flight of catalog.flights) {
      db.run(
        `INSERT INTO departures (
           flight_number, airline, status, destination, destination_iata, scheduled_time, departure_date
         ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          flight.flightNumber,
          flight.airline,
          flight.status,
          flight.destination,
          flight.destinationIata,
          flight.scheduledTime,
          flight.departureDate,
        ],
      );
    }
    db.run(
      `INSERT INTO departure_board (id, seeded_at, last_rolled_on, calls_disabled)
       VALUES (1, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         seeded_at = excluded.seeded_at,
         last_rolled_on = excluded.last_rolled_on,
         calls_disabled = excluded.calls_disabled`,
      [catalog.seededAt, catalog.lastRolledOn, catalog.callsDisabled ? 1 : 0],
    );
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function rollDepartureDates(db: DepartureSql, today: string): { advancedDays: number; flights: number } {
  const catalog = readDepartureCatalog(db);
  if (!catalog.lastRolledOn || !catalog.callsDisabled) {
    return { advancedDays: 0, flights: catalog.flights.length };
  }
  const advancedDays = diffCalendarDays(catalog.lastRolledOn, today);
  if (advancedDays <= 0) return { advancedDays: 0, flights: catalog.flights.length };

  const flights = catalog.flights.map((flight) => ({
    ...flight,
    departureDate: addCalendarDays(flight.departureDate, advancedDays),
  }));
  writeDepartureCatalog(db, { ...catalog, lastRolledOn: today, flights });
  return { advancedDays, flights: flights.length };
}

function mapFlight(row: FlightRow): DepartureFlight {
  return {
    flightNumber: row.flight_number,
    airline: row.airline,
    status: row.status,
    destination: row.destination,
    destinationIata: row.destination_iata,
    scheduledTime: row.scheduled_time,
    departureDate: row.departure_date,
  };
}
