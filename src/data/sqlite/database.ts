import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { SCHEMA_SQL } from './schema';
import { seedFixtures } from './seed';

const DATABASE_VERSION = 1;

export async function openDatabase(): Promise<SQLiteDatabase> {
  const db = await openDatabaseAsync('airport.db');
  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');
  await migrate(db);
  return db;
}

async function migrate(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = result?.user_version ?? 0;
  if (current >= DATABASE_VERSION) {
    return;
  }

  if (current === 0) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(SCHEMA_SQL);
      await seedFixtures(db);
    });
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
