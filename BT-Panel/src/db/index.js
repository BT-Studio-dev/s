import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";
import * as schema from "./schema";
import { createSqlitePool, isSqliteUrl } from "./sqlite-fallback";

function createDatabase(connectionPool) {
  return drizzle(connectionPool, { schema, mode: "default" });
}

const globalForDb = globalThis;

const DEFAULT_SQLITE_URL = "sqlite:.bt-panel/dev.sqlite";

/**
 * `DB_FALLBACK=sqlite` lets a developer boot the panel with no MySQL service
 * at all: the first connection failure transparently switches the process to
 * the embedded SQLite engine instead of returning 500s on every page.
 */
function fallbackEnabled() {
  return (process.env.DB_FALLBACK || "").toLowerCase() === "sqlite";
}

function isConnectionError(error) {
  const code = error?.code || error?.cause?.code;
  return (
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT" ||
    code === "EHOSTUNREACH" ||
    code === "ER_ACCESS_DENIED_ERROR" ||
    code === "ER_BAD_DB_ERROR"
  );
}

function createMysqlPool(databaseUrl) {
  // Preserve provider-supplied connection options and make JS Date values UTC.
  const url = new URL(databaseUrl);
  if (!url.searchParams.has("timezone")) url.searchParams.set("timezone", "Z");
  return createPool(url.toString());
}

/**
 * Wraps the MySQL pool so an unreachable server swaps in the SQLite fallback
 * on the first failed statement. The swap happens below drizzle, so query
 * builders, transactions and prepared statements are unaffected.
 */
function createResilientPool(databaseUrl) {
  let delegate = createMysqlPool(databaseUrl);
  let degraded = false;

  const swap = (error) => {
    if (degraded) return;
    degraded = true;
    console.error("[bt-panel] MySQL connection failed:", error?.code || error?.message || error);
    delegate.end?.().catch?.(() => {});
    delegate = createSqlitePool(process.env.DATABASE_URL_FALLBACK || DEFAULT_SQLITE_URL);
  };

  const call = async (method, ...args) => {
    try {
      return await delegate[method](...args);
    } catch (error) {
      if (degraded || !isConnectionError(error)) throw error;
      swap(error);
      return delegate[method](...args);
    }
  };

  return {
    query: (...args) => call("query", ...args),
    execute: (...args) => call("execute", ...args),
    getConnection: (...args) => call("getConnection", ...args),
    end: (...args) => call("end", ...args),
  };
}

function getPool() {
  if (globalForDb.__btPanelMysqlPool) return globalForDb.__btPanelMysqlPool;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl && !fallbackEnabled()) {
    throw new Error("DATABASE_URL is required at runtime");
  }

  let pool;
  if (!databaseUrl || isSqliteUrl(databaseUrl)) {
    pool = createSqlitePool(databaseUrl || DEFAULT_SQLITE_URL);
  } else if (fallbackEnabled()) {
    pool = createResilientPool(databaseUrl);
  } else {
    pool = createMysqlPool(databaseUrl);
  }

  globalForDb.__btPanelMysqlPool = pool;
  return pool;
}

function getDatabase() {
  if (!globalForDb.__btPanelMysqlDatabase) {
    globalForDb.__btPanelMysqlDatabase = createDatabase(getPool());
  }
  return globalForDb.__btPanelMysqlDatabase;
}

/**
 * Defer reading DATABASE_URL and opening mysql2 until a database operation is
 * actually attempted. Next's production build can then compile route modules
 * without a private runtime DSN being present in the image-build environment.
 */
export const db = new Proxy(
  {},
  {
    get(_target, property) {
      const database = getDatabase();
      const value = Reflect.get(database, property, database);
      return typeof value === "function" ? value.bind(database) : value;
    },
  },
);
