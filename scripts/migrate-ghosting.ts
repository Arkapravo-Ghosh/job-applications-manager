import "dotenv/config";
import { readFile } from "node:fs/promises";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");
const client = postgres(connectionString, {
  prepare: false,
  onnotice: () => {},
  ssl: ["localhost", "127.0.0.1", "[::1]"].includes(new URL(connectionString).hostname) ? false : "require",
});
async function main() {
  try {
    const migrations = await Promise.all([
      "drizzle/0001_ghosting.sql", "drizzle/0002_ghosting_functions.sql",
    ].map((file) => readFile(file, "utf8")));
    await client.begin(async (transaction) => {
      await transaction`SET LOCAL search_path = public, pg_temp`;
      for (const migration of migrations) await transaction.unsafe(migration);
    });
    console.log("Ghosting migration complete; historical timestamps preserved.");
  } finally {
    await client.end();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
