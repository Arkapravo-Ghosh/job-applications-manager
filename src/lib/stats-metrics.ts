import { addDays, addMonths, format, startOfMonth, startOfWeek } from "date-fns";
import type { JobApplication } from "@/db/schema";
import { APPLICATION_STATUSES } from "./application-status";
import { matchesScope, normalizedGroup, parseDateOnly, rangeDays, type DateRange } from "./stats-range";

// Deliberately excludes user IDs, notes, and links from the analytics payload.
export type StatsApplication = Pick<JobApplication, "id" | "company" | "role" | "status" | "applicationDate"
  | "interviewCount" | "statusUpdatedAt" | "updatedAt" | "createdAt">;
export type Granularity = "day" | "week" | "month";
export type CadenceBucket = { key: string; label: string; from: string; to: string; count: number };

export function percentage(numerator: number, denominator: number) {
  return denominator ? `${Math.round(numerator / denominator * 100)}%` : "—";
}

export function summarizeApplications(applications: StatsApplication[]) {
  const statusCounts = Object.fromEntries(APPLICATION_STATUSES.map((status) => [status, 0])) as Record<typeof APPLICATION_STATUSES[number], number>;
  const counts: number[] = [];
  let totalInterviews = 0;
  for (const job of applications) {
    if (job.status in statusCounts) statusCounts[job.status as keyof typeof statusCounts]++;
    totalInterviews += job.interviewCount;
    if (job.interviewCount > 0) counts.push(job.interviewCount);
  }
  counts.sort((a, b) => a - b);
  const middle = Math.floor(counts.length / 2);
  return {
    total: applications.length,
    companies: new Set(applications.map((job) => normalizedGroup(job.company))).size,
    totalInterviews, interviewed: counts.length, statusCounts,
    averageInterviews: counts.length ? totalInterviews / counts.length : null,
    medianInterviews: counts.length ? (counts.length % 2 ? counts[middle] : (counts[middle - 1] + counts[middle]) / 2) : null,
    rounds: ["1", "2", "3", "4", "5+"].map((rounds) => ({
      rounds, count: applications.filter((job) => matchesScope(job, { rounds })).length,
    })),
  };
}

export function activityBaseline(job: StatsApplication): Date | null {
  for (const value of [job.statusUpdatedAt, job.updatedAt, job.createdAt]) {
    if (!value) continue;
    const date = new Date(value);
    if (Number.isFinite(date.getTime())) return date;
  }
  return null;
}

export function pendingApplications(applications: StatsApplication[], now: Date) {
  return applications.filter((job) => job.status === "applied" || job.status === "interviewing")
    .map((job) => {
      const baseline = activityBaseline(job);
      return { ...job, baseline, inactiveDays: baseline ? Math.max(0, Math.floor((now.getTime() - baseline.getTime()) / 86_400_000)) : null };
    })
    .sort((a, b) => (a.baseline?.getTime() ?? Infinity) - (b.baseline?.getTime() ?? Infinity) || a.id.localeCompare(b.id));
}

export function defaultGranularity(range: DateRange): Granularity {
  const days = rangeDays(range);
  return days <= 31 ? "day" : days <= 180 ? "week" : "month";
}

export function cadenceBuckets(applications: StatsApplication[], range: DateRange, granularity: Granularity): CadenceBucket[] {
  const start = parseDateOnly(range.from)!, end = parseDateOnly(range.to)!;
  const bucketStart = (date: Date) => granularity === "month" ? startOfMonth(date)
    : granularity === "week" ? startOfWeek(date, { weekStartsOn: 1 }) : date;
  const buckets = new Map<string, CadenceBucket>();
  let cursor = bucketStart(start);
  while (cursor <= end) {
    const next = granularity === "month" ? addMonths(cursor, 1) : addDays(cursor, granularity === "week" ? 7 : 1);
    const key = format(cursor, "yyyy-MM-dd");
    buckets.set(key, { key,
      label: format(cursor, granularity === "month" ? "MMM yyyy" : "d MMM"),
      from: key < range.from ? range.from : key,
      to: format(addDays(next, -1), "yyyy-MM-dd") > range.to ? range.to : format(addDays(next, -1), "yyyy-MM-dd"), count: 0,
    });
    cursor = next;
  }
  for (const job of applications) {
    if (!matchesScope(job, range)) continue;
    const date = parseDateOnly(job.applicationDate);
    if (!date) continue;
    const bucket = buckets.get(format(bucketStart(date), "yyyy-MM-dd"));
    if (bucket) bucket.count++;
  }
  return [...buckets.values()];
}

export type BreakdownRow = {
  key: string; label: string; applications: number; companies: number; open: number;
  interviewed: number; interviews: number; selected: number; rejected: number; withdrawn: number; ghosted: number;
};
export type BreakdownMetric = Exclude<keyof BreakdownRow, "key" | "label">;

export function breakdownRows(applications: StatsApplication[], dimension: "company" | "role"): BreakdownRow[] {
  const groups = new Map<string, { row: BreakdownRow; companies: Set<string> }>();
  for (const job of applications) {
    const key = normalizedGroup(job[dimension]);
    if (!groups.has(key)) groups.set(key, { companies: new Set(), row: {
      key, label: job[dimension].trim(), applications: 0, companies: 0, open: 0, interviewed: 0, interviews: 0,
      selected: 0, rejected: 0, withdrawn: 0, ghosted: 0,
    } });
    const { row, companies } = groups.get(key)!;
    row.applications++;
    companies.add(normalizedGroup(job.company));
    row.companies = companies.size;
    row.open += Number(job.status === "applied" || job.status === "interviewing");
    row.interviewed += Number(job.interviewCount > 0);
    row.interviews += job.interviewCount;
    for (const status of ["selected", "rejected", "withdrawn", "ghosted"] as const) row[status] += Number(job.status === status);
  }
  return [...groups.values()].map(({ row }) => row);
}
