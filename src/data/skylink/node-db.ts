import { DatabaseSync } from 'node:sqlite';

import type { DepartureSql } from '@/src/data/skylink/store';

type SqlValue = string | number | null;

export function openDepartureDatabase(path: string): DatabaseSync {
  return new DatabaseSync(path);
}

export function departureSql(db: DatabaseSync): DepartureSql {
  return {
    exec(sql) {
      db.exec(sql);
    },
    get<T>(sql: string, params: readonly SqlValue[] = []) {
      return db.prepare(sql).get(...params) as T | undefined;
    },
    all<T>(sql: string, params: readonly SqlValue[] = []) {
      return db.prepare(sql).all(...params) as T[];
    },
    run(sql: string, params: readonly SqlValue[] = []) {
      db.prepare(sql).run(...params);
    },
  };
}
