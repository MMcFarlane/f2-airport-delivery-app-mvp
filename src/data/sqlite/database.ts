import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { catalogSource } from '@/src/config/catalog';

import { prepareDepartures } from './departures-refresh';
import { importPlacesCatalog } from './import-places';
import {
  DEPARTURES_TABLE_SQL,
  PASSENGER_LOCATION_SQL,
  RESTAURANT_CONCOURSE_SQL,
  SCHEMA_SQL,
  SKYLINK_LIVE_SQL,
} from './schema';
import { insertDemoActiveOrder, seedFixtures, setFixtureCoordinates } from './seed';

const DATABASE_VERSION = 6;

export async function openDatabase(): Promise<SQLiteDatabase> {
  const db = await openDatabaseAsync('airport.db');
  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');
  await migrate(db);
  // Local only. The SkyLink refresh starts in createDataSource() so launch never waits on the network.
  await prepareDepartures(db);
  if (catalogSource() === 'places') {
    await importPlacesCatalog(db);
  }
  return db;
}

async function migrate(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = result?.user_version ?? 0;
  if (current >= DATABASE_VERSION) return;

  if (current === 0) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(SCHEMA_SQL);
      await db.execAsync(DEPARTURES_TABLE_SQL);
      await seedFixtures(db);
    });
  } else {
    if (current < 2) await insertDemoActiveOrder(db);
    if (current < 3) await db.execAsync(DEPARTURES_TABLE_SQL);
  }
  if (current < 4) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(SKYLINK_LIVE_SQL);
    });
  }
  if (current < 5) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(PASSENGER_LOCATION_SQL);
      await setFixtureCoordinates(db);
    });
  }
  if (current < 6) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(RESTAURANT_CONCOURSE_SQL);
    });
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
