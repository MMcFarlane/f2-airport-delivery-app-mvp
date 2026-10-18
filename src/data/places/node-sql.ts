import { DatabaseSync } from 'node:sqlite';

import type { Sql } from './store';

type SqlValue = string | number | null;

export function nodeSql(db: DatabaseSync): Sql {
  return {
    exec(sql) {
      db.exec(sql);
    },
    get<T>(sql: string, params: readonly SqlValue[]) {
      return db.prepare(sql).get(...params) as T | undefined;
    },
    all<T>(sql: string, params: readonly SqlValue[]) {
      return db.prepare(sql).all(...params) as T[];
    },
    run(sql: string, params: readonly SqlValue[]) {
      db.prepare(sql).run(...params);
    },
  };
}
