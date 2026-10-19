import "dotenv/config";
import { readFile } from "node:fs/promises";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const client = postgres(url, {
    prepare: false, onnotice: () => {},
    ssl: ["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname) ? false : "require",
  });
  try {
    const [configuration] = await client`SELECT current_database() AS database,
      current_setting('cron.database_name', true) AS cron_database`;
    if (configuration.database !== configuration.cron_database) {
      throw new Error(`Set cron.database_name to ${configuration.database} on the compute endpoint and apply the setting before enabling this job. Current value: ${configuration.cron_database ?? "not configured"}.`);
    }
    const migration = await readFile("drizzle/0003_ghosting_cron.sql", "utf8");
    await client.begin(async (tx) => { await tx.unsafe(migration); });
    const [job] = await client`SELECT jobid, jobname, schedule, active FROM cron.job
      WHERE jobname = 'jobtrack-auto-ghosting' AND username = current_user`;
    console.log(job);
  } finally { await client.end(); }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
