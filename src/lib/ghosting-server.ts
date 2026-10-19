import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { DEFAULT_GHOSTING_SETTINGS, type GhostingSettings } from "./ghosting";

export type Database = typeof db;
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
export function settingsForUser(user?: User): GhostingSettings {
  return user ? {
    enabled: user.autoGhostEnabled, years: user.ghostYears, months: user.ghostMonths,
    weeks: user.ghostWeeks, days: user.ghostDays,
  } : { ...DEFAULT_GHOSTING_SETTINGS };
}
export async function getGhostingSettings(userId: string, database: Database = db) {
  const [user] = await database.select().from(users).where(eq(users.id, userId));
  return settingsForUser(user);
}

async function reconcileUser(tx: Transaction, userId: string) {
  const [result] = await tx.execute<{ changed: number }>(
    sql`SELECT jobtrack_reconcile_user(${userId}::uuid) AS changed`
  );
  return result.changed;
}

export async function reconcileGhostedApplications(userId: string, database: Database = db) {
  return database.transaction((tx) => reconcileUser(tx, userId));
}

export async function saveGhostingSettings(userId: string, settings: GhostingSettings, database: Database = db) {
  return database.transaction(async (tx) => {
    const rows = await tx.update(users).set({
      autoGhostEnabled: settings.enabled, ghostYears: settings.years,
      ghostMonths: settings.months, ghostWeeks: settings.weeks, ghostDays: settings.days,
    }).where(eq(users.id, userId)).returning({ id: users.id });
    if (!rows.length) throw new Error("User not found");
    return reconcileUser(tx, userId);
  });
}

export async function reconcileAllGhostedApplications(database: Database = db) {
  const [result] = await database.execute<{
    changed: number; users_checked: number; may_have_more: boolean;
  }>(sql`SELECT * FROM jobtrack_reconcile_all()`);
  return { changed: result.changed, usersChecked: result.users_checked, mayHaveMore: result.may_have_more };
}
