import { addDays, addMonths, differenceInCalendarDays, format, isValid, parseISO } from "date-fns";

export const REPORTING_PERIODS = [
  { value: "1w", label: "Last week" },
  { value: "1m", label: "Last month" },
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "1y", label: "Last year" },
  { value: "custom", label: "Custom Date Range" },
] as const;
export type ReportingPeriod = typeof REPORTING_PERIODS[number]["value"];
export type DateRange = { from: string; to: string };
export type ReportingRange = DateRange & { period: ReportingPeriod };
export type QueryReader = Pick<URLSearchParams, "get">;

// Date-only values must never be parsed as UTC instants and shifted a day.
export function parseDateOnly(value: string | null | undefined): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
  const date = parseISO(value);
  return isValid(date) && format(date, "yyyy-MM-dd") === value ? date : undefined;
}

export function validDateRange(from: string | null, to: string | null): from is string {
  return Boolean(parseDateOnly(from) && parseDateOnly(to) && from! <= to!);
}

export function presetRange(period: Exclude<ReportingPeriod, "custom">, today: string): ReportingRange {
  const end = parseDateOnly(today)!;
  const months = { "1w": 0, "1m": 1, "3m": 3, "6m": 6, "1y": 12 }[period];
  const start = period === "1w" ? addDays(end, -6) : addDays(addMonths(end, -months), 1);
  return { period, from: format(start, "yyyy-MM-dd"), to: today };
}

export function readReportingRange(params: QueryReader, today: string): ReportingRange {
  const period = params.get("period");
  const from = params.get("from"), to = params.get("to");
  if (period === "custom" && validDateRange(from, to)) return { period, from, to: to! };
  if (REPORTING_PERIODS.some((item) => item.value === period) && period !== "custom") {
    return presetRange(period as Exclude<ReportingPeriod, "custom">, today);
  }
  return presetRange("3m", today);
}

export function writeReportingRange(params: URLSearchParams, range: ReportingRange) {
  params.set("period", range.period);
  if (range.period === "custom") {
    params.set("from", range.from);
    params.set("to", range.to);
  } else {
    params.delete("from");
    params.delete("to");
  }
  return params;
}

export function dateLabel(value: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  const date = parseDateOnly(value);
  return date ? date.toLocaleDateString("en-GB", options) : "Unknown date";
}

export function rangeLabel(range: DateRange) {
  return `${dateLabel(range.from)} – ${dateLabel(range.to)}`;
}

export function rangeDays(range: DateRange) {
  return differenceInCalendarDays(parseDateOnly(range.to)!, parseDateOnly(range.from)!) + 1;
}

export type ApplicationScope = Partial<DateRange> & {
  status?: string; company?: string; role?: string; rounds?: string; id?: string; interviewed?: boolean;
};

export function normalizedGroup(value: string) { return value.trim().toLocaleLowerCase("en-US"); }

export function matchesScope(job: { id: string; applicationDate: string; status: string; company: string; role: string; interviewCount: number }, scope: ApplicationScope) {
  return (!scope.from || job.applicationDate >= scope.from)
    && (!scope.to || job.applicationDate <= scope.to)
    && (!scope.status || job.status === scope.status)
    && (!scope.company || normalizedGroup(job.company) === normalizedGroup(scope.company))
    && (!scope.role || normalizedGroup(job.role) === normalizedGroup(scope.role))
    && (!scope.id || job.id === scope.id)
    && (!scope.interviewed || job.interviewCount > 0)
    && (!scope.rounds || (scope.rounds === "5+" ? job.interviewCount >= 5 : job.interviewCount === Number(scope.rounds)));
}

export function readApplicationScope(params: QueryReader): ApplicationScope | null {
  const from = params.get("statsFrom"), to = params.get("statsTo");
  if (!validDateRange(from, to)) return null;
  return {
    from, to: to!, status: params.get("statsStatus") || undefined,
    company: params.get("statsCompany") || undefined, role: params.get("statsRole") || undefined,
    rounds: params.get("statsRounds") || undefined, id: params.get("application") || undefined,
    interviewed: params.get("statsInterviewed") === "true",
  };
}

export function applicationsHref(range: DateRange, scope: ApplicationScope = {}, returnTo = "/stats") {
  const params = new URLSearchParams({ statsFrom: scope.from ?? range.from, statsTo: scope.to ?? range.to, returnTo });
  for (const [key, value] of Object.entries({ statsStatus: scope.status, statsCompany: scope.company,
    statsRole: scope.role, statsRounds: scope.rounds, application: scope.id,
    statsInterviewed: scope.interviewed ? "true" : undefined })) {
    if (value) params.set(key, value);
  }
  return `/applications?${params}`;
}

// Only allow a local stats URL; query values are untrusted navigation input.
export function safeStatsReturn(value: string | null) {
  return value === "/stats" || value?.startsWith("/stats?") ? value : "/stats";
}
