import { catalogSource } from '@/src/config/catalog';
import type { DataSource } from '@/src/data/repositories';

import { SqliteCartRepository } from './sqlite/cart-repository';
import { SqliteCatalogRepository } from './sqlite/catalog-repository';
import { openDatabase } from './sqlite/database';
import { SqliteFlightRepository } from './sqlite/flight-repository';
import { SqliteOrderRepository } from './sqlite/order-repository';
import { SqliteProfileRepository } from './sqlite/profile-repository';
import { SqliteTripRepository } from './sqlite/trip-repository';

let dataSource: Promise<DataSource> | null = null;

export function createDataSource(): Promise<DataSource> {
  if (!dataSource) {
    dataSource = compose().catch((error: unknown) => {
      dataSource = null;
      throw error;
    });
  }
  return dataSource;
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
    flights: new SqliteFlightRepository(),
  };
}

export type { DataSource } from '@/src/data/repositories';
