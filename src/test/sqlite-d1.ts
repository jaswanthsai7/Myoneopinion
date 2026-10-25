/**
 * A minimal Cloudflare D1 stand-in over node:sqlite, so tests run the real SQL.
 */
import type { DatabaseSync as DatabaseSyncType } from "node:sqlite";

// Loaded at runtime so the test bundler doesn't try to bundle the Node built-in.
const { DatabaseSync } = process.getBuiltinModule("node:sqlite") as typeof import("node:sqlite");
type DatabaseSync = DatabaseSyncType;

type Param = string | number | null;

class Statement {
  constructor(
    private db: DatabaseSync,
    readonly sql: string,
    private params: Param[] = [],
  ) {}

  bind(...params: Param[]) {
    return new Statement(this.db, this.sql, params);
  }

  async first() {
    return (this.db.prepare(this.sql).get(...this.params) as Record<string, unknown>) ?? null;
  }

  async all() {
    return { results: this.db.prepare(this.sql).all(...this.params) };
  }

  async run() {
    return this.runSync();
  }

  runSync() {
    const info = this.db.prepare(this.sql).run(...this.params);
    return { success: true, meta: { changes: Number(info.changes) } };
  }
}

export function createSqliteD1() {
  const db = new DatabaseSync(":memory:");
  return {
    prepare: (sql: string) => new Statement(db, sql),
    // D1 runs a batch as a single transaction.
    async batch(statements: Statement[]) {
      db.exec("BEGIN");
      try {
        const results = statements.map((s) => s.runSync());
        db.exec("COMMIT");
        return results;
      } catch (err) {
        db.exec("ROLLBACK");
        throw err;
      }
    },
  };
}
