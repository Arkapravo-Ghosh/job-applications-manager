import { before, after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";
import * as schema from "../../src/db/schema";
import { changeInterviewCount, updateApplication } from "../../src/lib/application-mutations";
import { getGhostingSettings, saveGhostingSettings, reconcileGhostedApplications, reconcileAllGhostedApplications } from "../../src/lib/ghosting-server";
import { DEFAULT_GHOSTING_SETTINGS, ghostingDeadline, GHOSTING_PRESETS } from "../../src/lib/ghosting";

const url = process.env.TEST_DATABASE_URL;
if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname)) {
  throw new Error("Set TEST_DATABASE_URL to an isolated local PostgreSQL database. Integration tests never use DATABASE_URL.");
}
const namespace = `ghosting_test_${Date.now()}`;
const root = postgres(url, { ssl: false, onnotice: () => {}, max: 1 });
const client = postgres(url, { ssl: false, onnotice: () => {}, max: 10, connection: { search_path: namespace } });
const database = drizzle(client, { schema });
let migration: string;
const baseSchema = `
CREATE TABLE users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), username varchar(50) UNIQUE NOT NULL,
  password_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE job_applications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id),
  role varchar(150) NOT NULL, company varchar(150) NOT NULL, status varchar(30) NOT NULL DEFAULT 'applied',
  application_date date NOT NULL DEFAULT CURRENT_DATE, link text, notes text, interview_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now());`;
let userId: string;
let otherId: string;
before(async () => {
  migration = await readFile("drizzle/0001_ghosting.sql", "utf8");
  await root.unsafe(`CREATE SCHEMA ${namespace}`);
  await client.unsafe(baseSchema);
  await client.unsafe(migration);
  await client.unsafe(await readFile("drizzle/0002_ghosting_functions.sql", "utf8"));
});
after(async () => {
  await client.end();
  await root.unsafe(`DROP SCHEMA ${namespace} CASCADE`);
  await root.end();
});
beforeEach(async () => {
  await client`TRUNCATE job_applications, users`;
  const users = await database.insert(schema.users).values([
    { username: "first", passwordHash: "unused" }, { username: "second", passwordHash: "unused" },
  ]).returning();
  userId = users[0].id; otherId = users[1].id;
});
async function job(status = "applied", owner = userId, age = "2020-01-01T00:00:00Z") {
  const [result] = await database.insert(schema.jobApplications).values({
    userId: owner, role: "QA Engineer", company: "Disposable QA", status, createdAt: new Date(age),
  }).returning();
  return result;
}
async function get(id: string) {
  const [result] = await database.select().from(schema.jobApplications).where(eq(schema.jobApplications.id, id));
  return result;
}
const oneWeek = { enabled: true, years: 0, months: 0, weeks: 1, days: 0 };

test("legacy missing column/null backfill preserves history, reruns safely, and initializes future inserts", async () => {
  const legacySchema = `${namespace}_legacy`;
  await root.unsafe(`CREATE SCHEMA ${legacySchema}`);
  const legacy = postgres(url!, { ssl: false, onnotice: () => {}, max: 1, connection: { search_path: legacySchema } });
  try {
    await legacy.unsafe(baseSchema);
    const [user] = await legacy`INSERT INTO users (username, password_hash) VALUES ('legacy', 'unused') RETURNING id`;
    await legacy`INSERT INTO job_applications (user_id, role, company, created_at) VALUES (${user.id}, 'Engineer', 'Old', '2020-01-02T03:04:05Z')`;
    await legacy.unsafe(migration);
    const [old] = await legacy`SELECT * FROM job_applications`;
    assert.equal(old.updated_at.toISOString(), old.created_at.toISOString());
    assert.equal(old.status_updated_at.toISOString(), old.created_at.toISOString());
    assert.equal(old.created_at.toISOString(), "2020-01-02T03:04:05.000Z");
    await legacy`ALTER TABLE job_applications ALTER COLUMN updated_at DROP NOT NULL, ALTER COLUMN status_updated_at DROP NOT NULL`;
    await legacy`UPDATE job_applications SET updated_at = '2022-01-01T00:00:00Z', status_updated_at = NULL`;
    await legacy.unsafe(migration);
    const [backfilled] = await legacy`SELECT * FROM job_applications`;
    assert.equal(backfilled.status_updated_at.toISOString(), "2022-01-01T00:00:00.000Z");
    await legacy.unsafe(migration);
    const [unchanged] = await legacy`SELECT * FROM job_applications`;
    assert.deepEqual(unchanged, backfilled);
    const [inserted] = await legacy`INSERT INTO job_applications (user_id, role, company, created_at) VALUES (${user.id}, 'Engineer', 'New', '2021-01-01T00:00:00Z') RETURNING *`;
    assert.equal(inserted.updated_at.toISOString(), inserted.created_at.toISOString());
    assert.equal(inserted.status_updated_at.toISOString(), inserted.created_at.toISOString());
    const [automatic] = await legacy`INSERT INTO job_applications (user_id, role, company) VALUES (${user.id}, 'Engineer', 'Defaults') RETURNING *`;
    assert.equal(automatic.updated_at.toISOString(), automatic.created_at.toISOString());
    assert.equal(automatic.status_updated_at.toISOString(), automatic.created_at.toISOString());
  } finally { await legacy.end(); await root.unsafe(`DROP SCHEMA ${legacySchema} CASCADE`); }
});

test("new defaults and disabled automation leave overdue applications unchanged", async () => {
  assert.deepEqual(await getGhostingSettings(userId, database), DEFAULT_GHOSTING_SETTINGS);
  const application = await job();
  assert.equal(application.statusUpdatedAt.toISOString(), application.createdAt.toISOString());
  assert.equal(await reconcileGhostedApplications(userId, database), 0);
  assert.equal((await get(application.id)).status, "applied");
});

test("only overdue Applied/Interviewing rows for the enabled user are marked, idempotently", async () => {
  const applications = await Promise.all(["applied", "interviewing", "selected", "rejected", "withdrawn", "ghosted"].map((status) => job(status)));
  const foreign = await job("applied", otherId);
  const fresh = await job("applied", userId, new Date().toISOString());
  assert.equal(await saveGhostingSettings(userId, oneWeek, database), 2);
  for (const application of applications) {
    assert.equal((await get(application.id)).status, ["applied", "interviewing"].includes(application.status) ? "ghosted" : application.status);
  }
  assert.equal((await get(foreign.id)).status, "applied");
  assert.equal((await get(fresh.id)).status, "applied");
  assert.equal(await reconcileGhostedApplications(userId, database), 0);
});

test("+ from every status forces Interviewing and refreshes status time; - preserves it and clamps at zero", async () => {
  for (const status of ["applied", "interviewing", "selected", "rejected", "withdrawn", "ghosted"]) {
    const application = await job(status);
    assert.equal(await changeInterviewCount(userId, application.id, 1, database), true);
    const incremented = await get(application.id);
    assert.equal(incremented.status, "interviewing");
    assert.equal(incremented.interviewCount, 1);
    assert.ok(incremented.statusUpdatedAt > application.statusUpdatedAt);
    await changeInterviewCount(userId, application.id, -1, database);
    await changeInterviewCount(userId, application.id, -1, database);
    const decremented = await get(application.id);
    assert.equal(decremented.interviewCount, 0);
    assert.equal(decremented.status, "interviewing");
    assert.equal(decremented.statusUpdatedAt.toISOString(), incremented.statusUpdatedAt.toISOString());
  }
});

test("ordinary edits preserve the clock, status changes and form + reset it, stale forms are rejected", async () => {
  const application = await job();
  const changes = { role: application.role, company: application.company, status: application.status, interviewCount: 0, notes: "Edited notes" };
  assert.equal(await updateApplication(userId, application.id, changes, false, application.updatedAt.toISOString(), database), true);
  const edited = await get(application.id);
  assert.equal(edited.statusUpdatedAt.toISOString(), application.statusUpdatedAt.toISOString());
  assert.equal(await updateApplication(userId, application.id, changes, false, application.updatedAt.toISOString(), database), false);
  assert.equal(await updateApplication(userId, application.id, { ...changes, status: "interviewing" }, true, edited.updatedAt.toISOString(), database), true);
  assert.ok((await get(application.id)).statusUpdatedAt > application.statusUpdatedAt);
});

test("foreign-account mutation attempts fail", async () => {
  const application = await job("rejected", otherId);
  assert.equal(await changeInterviewCount(userId, application.id, 1, database), false);
  assert.equal(await updateApplication(userId, application.id, { role: "Other", company: "Other", status: "interviewing" }, true, application.updatedAt.toISOString(), database), false);
  assert.equal((await get(application.id)).status, "rejected");
});

test("parallel increments are not lost", async () => {
  const application = await job("ghosted");
  await Promise.all(Array.from({ length: 20 }, () => changeInterviewCount(userId, application.id, 1, database)));
  assert.equal((await get(application.id)).interviewCount, 20);
  assert.equal((await get(application.id)).status, "interviewing");
});

test("a locked fresh interview cannot be overwritten by reconciliation", async () => {
  await saveGhostingSettings(userId, oneWeek, database);
  const application = await job();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  let ready!: () => void;
  const locked = new Promise<void>((resolve) => { ready = resolve; });
  const editing = client.begin(async (tx) => {
    await tx`UPDATE job_applications SET status = 'interviewing', interview_count = 1, status_updated_at = now() WHERE id = ${application.id}`;
    ready(); await gate;
  });
  await locked;
  try { assert.equal(await reconcileGhostedApplications(userId, database), 0); }
  finally { release(); await editing; }
  assert.equal((await get(application.id)).status, "interviewing");
});

test("a concurrent preference disable is respected after waiting for the user lock", async () => {
  await saveGhostingSettings(userId, oneWeek, database);
  const application = await job();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  let ready!: () => void;
  const locked = new Promise<void>((resolve) => { ready = resolve; });
  const disabling = client.begin(async (tx) => {
    await tx`UPDATE users SET auto_ghost_enabled = false WHERE id = ${userId}`;
    ready(); await gate;
  });
  await locked;
  const sweep = reconcileGhostedApplications(userId, database);
  release(); await disabling;
  assert.equal(await sweep, 0);
  assert.equal((await get(application.id)).status, "applied");
});

test("SQL and client duration arithmetic agree across presets, mixed units, DST and leap dates", async () => {
  for (const timestamp of ["2024-02-29T10:20:30Z", "2026-01-31T10:20:30Z", "2026-03-07T10:20:30Z"]) {
    for (const duration of [...GHOSTING_PRESETS, { years: 1, months: 1, weeks: 2, days: 3 }]) {
      const [row] = await client`SELECT jobtrack_ghosting_deadline(${timestamp}::timestamptz, NULL, NULL, ${duration.years}, ${duration.months}, ${duration.weeks}, ${duration.days}) AS deadline`;
      assert.equal(new Date(row.deadline).toISOString(), ghostingDeadline(new Date(timestamp), duration).toISOString());
    }
  }
});

test("deadline is inclusive and missing status/update timestamps fall back to createdAt", async () => {
  await saveGhostingSettings(userId, { ...oneWeek, weeks: 0, days: 1 }, database);
  const due = await job();
  // Exercise the same nullable legacy data that a defensive runtime read can see.
  await client`ALTER TABLE job_applications ALTER COLUMN status_updated_at DROP NOT NULL, ALTER COLUMN updated_at DROP NOT NULL`;
  try {
    await client`UPDATE job_applications SET status_updated_at = NULL, updated_at = NULL WHERE id = ${due.id}`;
    assert.equal(await reconcileGhostedApplications(userId, database), 1);
    const exact = await job();
    const future = await job();
    await database.transaction(async (tx) => {
      await tx.execute(sql`UPDATE job_applications SET status_updated_at = CURRENT_TIMESTAMP - interval '1 day' WHERE id = ${exact.id}`);
      await tx.execute(sql`UPDATE job_applications SET status_updated_at = CURRENT_TIMESTAMP - interval '1 day' + interval '1 millisecond' WHERE id = ${future.id}`);
      // Nested transaction/savepoint shares the frozen CURRENT_TIMESTAMP, testing
      // the actual helper exactly at the deadline and one millisecond before it.
      assert.equal(await reconcileGhostedApplications(userId, tx as unknown as typeof database), 1);
    });
    assert.equal((await get(exact.id)).status, "ghosted");
    assert.equal((await get(future.id)).status, "applied");
  } finally {
    await client`UPDATE job_applications SET updated_at = created_at WHERE updated_at IS NULL`;
    await client`UPDATE job_applications SET status_updated_at = COALESCE(updated_at, created_at) WHERE status_updated_at IS NULL`;
    await client`ALTER TABLE job_applications ALTER COLUMN status_updated_at SET NOT NULL, ALTER COLUMN updated_at SET NOT NULL`;
  }
});

test("scheduled sweep works without UI, preserves interview history and does not restore Ghosted on disable", async () => {
  await saveGhostingSettings(userId, oneWeek, database);
  const due = await job("interviewing");
  await database.update(schema.jobApplications).set({ interviewCount: 4 }).where(eq(schema.jobApplications.id, due.id));
  assert.equal((await reconcileAllGhostedApplications(database)).changed, 1);
  assert.equal((await get(due.id)).interviewCount, 4);
  await saveGhostingSettings(userId, { ...oneWeek, enabled: false, months: 6 }, database);
  assert.equal((await get(due.id)).status, "ghosted");
  assert.equal((await reconcileAllGhostedApplications(database)).changed, 0);
});

test("bounded batches make progress across subsequent sweeps", async () => {
  await saveGhostingSettings(userId, oneWeek, database);
  await client`INSERT INTO job_applications (user_id,role,company,created_at)
    SELECT ${userId}, 'Batch fixture', 'Batch QA', '2020-01-01T00:00:00Z'::timestamptz FROM generate_series(1,2001)`;
  assert.equal(await reconcileGhostedApplications(userId, database), 2000);
  assert.equal(await reconcileGhostedApplications(userId, database), 1);
  assert.equal(await reconcileGhostedApplications(userId, database), 0);
});

test("a decrement preserves the legacy baseline even when update timestamps are null", async () => {
  const application = await job();
  await client`ALTER TABLE job_applications ALTER COLUMN status_updated_at DROP NOT NULL, ALTER COLUMN updated_at DROP NOT NULL`;
  try {
    await client`UPDATE job_applications SET status_updated_at = NULL, updated_at = NULL WHERE id = ${application.id}`;
    await changeInterviewCount(userId, application.id, -1, database);
    const decremented = await get(application.id);
    assert.equal(decremented.statusUpdatedAt.toISOString(), application.createdAt.toISOString());
    assert.equal(decremented.status, "applied");
    assert.equal(decremented.interviewCount, 0);
  } finally {
    await client`ALTER TABLE job_applications ALTER COLUMN status_updated_at SET NOT NULL, ALTER COLUMN updated_at SET NOT NULL`;
  }
});
