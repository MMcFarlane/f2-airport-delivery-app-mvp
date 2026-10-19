import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { airport } from '../src/config/airport';
import { skyLinkNetworkAllowed } from '../src/config/skylink';
import { airportToday, scheduleRowsToFlights, type DepartureCatalog } from '../src/data/skylink/board';
import { departureSql, openDepartureDatabase } from '../src/data/skylink/node-db';
import { ensureDepartureSchema, readDepartureCatalog, writeDepartureCatalog } from '../src/data/skylink/store';

const DATABASE_PATH = resolve('data/departures.db');
const CATALOG_PATH = resolve('src/data/skylink/departures.json');
const DEPARTURES_URL = `https://data.skylinkapi.com/v3.1/schedules/departures?iata=${airport.iata}`;

loadEnvFile(resolve('.env'));
loadEnvFile(resolve('.env.local'), true);

void main().catch((caught: unknown) => {
  console.error(caught instanceof Error ? caught.message : 'The departures seed failed.');
  process.exit(1);
});

async function main(): Promise<void> {
  mkdirSync(resolve('data'), { recursive: true });
  const database = openDepartureDatabase(DATABASE_PATH);
  const sql = departureSql(database);
  ensureDepartureSchema(sql);
  const existing = readDepartureCatalog(sql);
  const seedOnce = process.env.SKYLINK_SEED_ONCE === '1';
  if (!skyLinkNetworkAllowed(existing.callsDisabled, seedOnce)) {
    database.close();
    console.log('SkyLink calls are disabled. No request was made.');
    return;
  }

  const apiKey = process.env.SKYLINK_API_KEY?.trim();
  if (!apiKey) {
    database.close();
    console.error('SKYLINK_API_KEY is not set. Add it to .env.local. No request was made.');
    process.exit(1);
  }

  const now = new Date();
  const rows = await fetchDepartureRows(apiKey, now);
  const flights = scheduleRowsToFlights(rows.flights, now);
  if (flights.length === 0) {
    database.close();
    console.error('SkyLink returned no ATL departures inside the 12-hour window. The database was left unchanged.');
    process.exit(1);
  }

  const catalog: DepartureCatalog = {
    seededAt: now.toISOString(),
    lastRolledOn: airportToday(now),
    callsDisabled: true,
    flights,
  };
  writeDepartureCatalog(sql, catalog);
  database.close();
  writeFileSync(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`);
  const first = flights[0];
  const last = flights[flights.length - 1];
  console.log(`Seeded ${flights.length} ATL departures from one 12-hour window into data/departures.db.`);
  console.log(`SkyLink reported ${rows.totalFlights} flights across ${rows.pagesFetched} pages.`);
  console.log(`Kept ${first?.scheduledTime} ${first?.departureDate} through ${last?.scheduledTime} ${last?.departureDate}.`);
  console.log('SkyLink calls are disabled.');
}

async function fetchDepartureRows(apiKey: string, now: Date): Promise<{ flights: unknown[]; totalFlights: number; pagesFetched: number }> {
  const url = `${DEPARTURES_URL}&ts=${now.getTime()}`;
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { 'x-api-key': apiKey, Accept: 'application/json' },
      signal: AbortSignal.timeout(40_000),
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'network error';
    throw new Error(`SkyLink departures request failed: ${message}`);
  }
  if (!response.ok) {
    throw new Error(`SkyLink departures request failed with HTTP ${response.status}.`);
  }
  const body = (await response.json()) as { flights?: unknown; total_flights?: unknown; pages_fetched?: unknown };
  return {
    flights: Array.isArray(body.flights) ? body.flights : [],
    totalFlights: typeof body.total_flights === 'number' ? body.total_flights : 0,
    pagesFetched: typeof body.pages_fetched === 'number' ? body.pages_fetched : 0,
  };
}

function loadEnvFile(path: string, override = false): void {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (override || process.env[key] === undefined) process.env[key] = value;
  }
}
