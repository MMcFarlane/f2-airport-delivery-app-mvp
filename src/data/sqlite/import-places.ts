import type { SQLiteDatabase } from 'expo-sqlite';

import rawCatalog from '@/src/data/places/catalog.json';
import { applyCatalog } from '@/src/data/places/store';
import type { PlacesCatalog } from '@/src/data/places/types';

const catalog = rawCatalog as PlacesCatalog;

export async function importPlacesCatalog(db: SQLiteDatabase): Promise<void> {
  if (catalog.restaurants.length === 0) return;
  await db.withTransactionAsync(async () => {
    await applyCatalog(
      {
        exec: (sql) => db.execAsync(sql),
        get: async (sql, params) => (await db.getFirstAsync(sql, ...params)) ?? undefined,
        all: (sql, params) => db.getAllAsync(sql, ...params),
        run: async (sql, params) => {
          await db.runAsync(sql, ...params);
        },
      },
      catalog,
    );
  });
}
