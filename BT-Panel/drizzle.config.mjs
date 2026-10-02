import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// The fallback is only for offline schema generation; runtime migrations use
// the managed DATABASE_URL supplied to the development or published server.
const url =
  process.env.DRIZZLE_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "mysql://btpanel:localdev@127.0.0.1:3306/btpanel";

export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/schema.js",
  out: "./drizzle",
  dbCredentials: { url },
});
