import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { airportToday, scheduleRowsToFlights, type DepartureCatalog } from '../src/data/skylink/board';
import { fetchDepartureRows } from '../src/data/skylink/client';

/**
 * Refreshes the bundled offline snapshot. The app fetches the live board on launch
 * and falls back to this file only when it has no stored board and no network.
 */
const CATALOG_PATH = resolve('src/data/skylink/departures.json');

loadEnvFile(resolve('.env'));
loadEnvFile(resolve('.env.local'), true);

void main().catch((caught: unknown) => {
  console.error(caught instanceof Error ? caught.message : 'The departures seed failed.');
  process.exit(1);
});

async function main(): Promise<void> {
  const apiKey = process.env.SKYLINK_API_KEY?.trim();
  if (!apiKey) {
    console.error('SKYLINK_API_KEY is not set. Add it to .env.local. No request was made.');
    process.exit(1);
  }

  const now = new Date();
  const rows = await fetchDepartureRows(apiKey, now, 40_000);
  const flights = scheduleRowsToFlights(rows.flights, now);
  if (flights.length === 0) {
    console.error('SkyLink returned no ATL departures inside the 12-hour window. The snapshot was left unchanged.');
    process.exit(1);
  }

  const catalog: DepartureCatalog = {
    seededAt: now.toISOString(),
    lastRolledOn: airportToday(now),
    flights,
  };
  writeFileSync(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`);
  const first = flights[0];
  const last = flights[flights.length - 1];
  console.log(`Wrote ${flights.length} ATL departures from one 12-hour window to src/data/skylink/departures.json.`);
  console.log(`SkyLink reported ${rows.totalFlights} flights across ${rows.pagesFetched} pages.`);
  console.log(`Kept ${first?.scheduledTime} ${first?.departureDate} through ${last?.scheduledTime} ${last?.departureDate}.`);
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
