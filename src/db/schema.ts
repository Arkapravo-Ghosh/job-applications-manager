import { pgTable, uuid, varchar, text, date, timestamp, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const jobApplications = pgTable("job_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 150 }).notNull(),
  company: varchar("company", { length: 150 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("applied"), // 'applied' | 'interviewing' | 'rejected' | 'withdrawn' | 'selected'
  applicationDate: date("application_date")
    .notNull()
    .default(sql`CURRENT_DATE`),
  link: text("link"),
  notes: text("notes"),
  interviewCount: integer("interview_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type JobApplication = typeof jobApplications.$inferSelect;
export type NewJobApplication = typeof jobApplications.$inferInsert;

export const APPLICATION_STATUSES = [
  "applied",
  "interviewing",
  "rejected",
  "withdrawn",
  "selected",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
