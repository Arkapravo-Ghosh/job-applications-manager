import { pgTable, uuid, varchar, text, date, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
export { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/application-status";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  autoGhostEnabled: boolean("auto_ghost_enabled").notNull().default(false),
  ghostYears: integer("ghost_years").notNull().default(0),
  ghostMonths: integer("ghost_months").notNull().default(3),
  ghostWeeks: integer("ghost_weeks").notNull().default(0),
  ghostDays: integer("ghost_days").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const jobApplications = pgTable("job_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 150 }).notNull(),
  company: varchar("company", { length: 150 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("applied"),
  applicationDate: date("application_date")
    .notNull()
    .default(sql`CURRENT_DATE`),
  link: text("link"),
  notes: text("notes"),
  interviewCount: integer("interview_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  // A BEFORE INSERT trigger fills omitted timestamps from createdAt.
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`NULL`).notNull(),
  statusUpdatedAt: timestamp("status_updated_at", { withTimezone: true }).default(sql`NULL`).notNull(),
}, (table) => [
  index("job_applications_ghosting_idx").on(table.userId, table.statusUpdatedAt)
    .where(sql`${table.status} IN ('applied', 'interviewing')`),
]);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type JobApplication = typeof jobApplications.$inferSelect;
export type NewJobApplication = typeof jobApplications.$inferInsert;
