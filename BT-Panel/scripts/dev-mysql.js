// Dev-only helper: boots an ephemeral MySQL instance for local/preview runs
// when no external MySQL is available. Not used in production.
const { createDB } = require("mysql-memory-server");

const PORT = Number(process.env.DEV_MYSQL_PORT || 3306);
const DB = process.env.DEV_MYSQL_DATABASE || "btpanel";

async function main() {
  const db = await createDB({
    port: PORT,
    dbName: DB,
    username: "btpanel",
    logLevel: "WARN",
  });

  console.log(
    `[dev-mysql] ready mysql://${db.username}@${db.xSocket ? "socket" : "127.0.0.1"}:${db.port}/${db.dbName}`,
  );
  console.log(`[dev-mysql] DATABASE_URL=mysql://${db.username}@127.0.0.1:${db.port}/${db.dbName}`);

  const stop = async () => {
    await db.stop().catch(() => {});
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  setInterval(() => {}, 1 << 30);
}

main().catch((err) => {
  console.error("[dev-mysql] failed:", err);
  process.exit(1);
});
