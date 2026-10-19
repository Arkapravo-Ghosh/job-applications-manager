import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { jobApplications, type NewJobApplication } from "@/db/schema";
import type { Database } from "./ghosting-server";

export async function changeInterviewCount(userId: string, id: string, delta: 1 | -1, database: Database = db) {
  const [application] = await database.update(jobApplications).set({
    interviewCount: sql`GREATEST(0, ${jobApplications.interviewCount} + ${delta})`,
    updatedAt: sql`CURRENT_TIMESTAMP`,
    statusUpdatedAt: delta === 1 ? sql`CURRENT_TIMESTAMP`
      : sql`COALESCE(${jobApplications.statusUpdatedAt}, ${jobApplications.updatedAt}, ${jobApplications.createdAt})`,
    ...(delta === 1 ? { status: "interviewing" } : {}),
  }).where(and(eq(jobApplications.id, id), eq(jobApplications.userId, userId)))
    .returning({ id: jobApplications.id });
  return Boolean(application);
}

type ApplicationChanges = Pick<NewJobApplication,
  "role" | "company" | "status" | "applicationDate" | "link" | "notes" | "interviewCount">;

export async function updateApplication(userId: string, id: string, changes: ApplicationChanges,
  interviewAdded: boolean, expectedUpdatedAt: string, database: Database = db) {
  const [application] = await database.update(jobApplications).set({
    ...changes,
    statusUpdatedAt: sql`CASE WHEN ${jobApplications.status} IS DISTINCT FROM ${changes.status}
      OR ${interviewAdded} THEN CURRENT_TIMESTAMP
      ELSE COALESCE(${jobApplications.statusUpdatedAt}, ${jobApplications.updatedAt}, ${jobApplications.createdAt}) END`,
    updatedAt: sql`CURRENT_TIMESTAMP`,
  }).where(and(eq(jobApplications.id, id), eq(jobApplications.userId, userId),
    // Millisecond comparison matches the precision serialized to the browser.
    sql`date_trunc('milliseconds', COALESCE(${jobApplications.updatedAt}, ${jobApplications.createdAt})) = ${expectedUpdatedAt}::timestamptz`))
    .returning({ id: jobApplications.id });
  return Boolean(application);
}
