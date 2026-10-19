import { catalogSource } from '@/src/config/catalog';
import type { DataSource } from '@/src/data/repositories';

import { SqliteCartRepository } from './sqlite/cart-repository';
import { SqliteCatalogRepository } from './sqlite/catalog-repository';
import { openDatabase } from './sqlite/database';
import { SqliteFlightRepository } from './sqlite/flight-repository';
import { SqliteOrderRepository } from './sqlite/order-repository';
import { SqliteProfileRepository } from './sqlite/profile-repository';
import { SqliteTripRepository } from './sqlite/trip-repository';

const dataSourceSlot = '__f2AirportDataSource';

type DataSourceSlot = {
  promise: Promise<DataSource> | null;
};

function slot(): DataSourceSlot {
  const root = globalThis as typeof globalThis & { [dataSourceSlot]?: DataSourceSlot };
  root[dataSourceSlot] ??= { promise: null };
  return root[dataSourceSlot];
}

export function createDataSource(): Promise<DataSource> {
  const current = slot();
  if (!current.promise) {
    current.promise = compose().catch((error: unknown) => {
      if (slot().promise === current.promise) current.promise = null;
      throw error;
    });
  }
  return current.promise;
}

async function compose(): Promise<DataSource> {
  const db = await openDatabase();
  const source = catalogSource();
  return {
    catalog: new SqliteCatalogRepository(db, source),
    trip: new SqliteTripRepository(db),
    cart: new SqliteCartRepository(db, source),
    orders: new SqliteOrderRepository(db),
    profile: new SqliteProfileRepository(db),
    flights: new SqliteFlightRepository(db),
  };
}

export type { DataSource } from '@/src/data/repositories';
