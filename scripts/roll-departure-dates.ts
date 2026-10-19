import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { airportToday } from '../src/data/skylink/board';
import { departureSql, openDepartureDatabase } from '../src/data/skylink/node-db';
import { ensureDepartureSchema, readDepartureCatalog, rollDepartureDates } from '../src/data/skylink/store';

const DATABASE_PATH = resolve('data/departures.db');
const CATALOG_PATH = resolve('src/data/skylink/departures.json');

mkdirSync(resolve('data'), { recursive: true });
const database = openDepartureDatabase(DATABASE_PATH);
const sql = departureSql(database);
ensureDepartureSchema(sql);

const today = airportToday();
const result = rollDepartureDates(sql, today);
const catalog = readDepartureCatalog(sql);
database.close();
writeFileSync(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`);

if (catalog.flights.length === 0) {
  console.log('No seeded departures to roll. No SkyLink request was made.');
} else if (result.advancedDays === 0) {
  console.log(`Departure dates are current through ${today}. No SkyLink request was made.`);
} else {
  console.log(
    `Advanced ${result.flights} departure dates by ${result.advancedDays} day${result.advancedDays === 1 ? '' : 's'} to ${today}. No SkyLink request was made.`,
  );
}
