import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { catalogSource } from '@/src/config/catalog';

import { importDepartures } from './import-departures';
import { importPlacesCatalog } from './import-places';
import { DEPARTURES_TABLE_SQL, SCHEMA_SQL } from './schema';
import { insertDemoActiveOrder, seedFixtures } from './seed';

const DATABASE_VERSION = 3;

export async function openDatabase(): Promise<SQLiteDatabase> {
  const db = await openDatabaseAsync('airport.db');
  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');
  await migrate(db);
  await importDepartures(db);
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

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
