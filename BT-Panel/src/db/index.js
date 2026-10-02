import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";
import * as schema from "./schema";
function createDatabase(connectionPool) {
  return drizzle(connectionPool, {
    schema,
    mode: "default",
  });
}
const globalForDb = globalThis;
function getPool() {
  if (globalForDb.__btPanelMysqlPool) return globalForDb.__btPanelMysqlPool;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required at runtime");

  // Preserve provider-supplied connection options and make JS Date values UTC.
  const url = new URL(databaseUrl);
  if (!url.searchParams.has("timezone")) url.searchParams.set("timezone", "Z");
  const pool = createPool(url.toString());
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
