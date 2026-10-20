import { test } from "node:test";
import assert from "node:assert/strict";
import { activityBaseline, breakdownRows, cadenceBuckets, pendingApplications, percentage, summarizeApplications, type StatsApplication } from "../src/lib/stats-metrics";
import { applicationsHref, matchesScope, parseDateOnly, presetRange, readApplicationScope, readReportingRange, REPORTING_PERIODS, safeStatsReturn, validDateRange, writeReportingRange } from "../src/lib/stats-range";

const now = new Date("2026-10-20T12:00:00Z");
function application(id: string, changes: Partial<StatsApplication> = {}): StatsApplication {
  return { id, company: "Acme", role: "Engineer", status: "applied", applicationDate: "2026-10-20", interviewCount: 0,
    createdAt: new Date("2026-07-01T12:00:00Z"), updatedAt: new Date("2026-09-01T12:00:00Z"), statusUpdatedAt: new Date("2026-10-01T12:00:00Z"), ...changes };
}

test("all six exact reporting-period labels, default, and invalid query fallback", () => {
  assert.deepEqual(REPORTING_PERIODS.map((item) => item.label), ["Last week", "Last month", "Last 3 months", "Last 6 months", "Last year", "Custom Date Range"]);
  for (const params of [new URLSearchParams(), new URLSearchParams("period=bad"), new URLSearchParams("period=custom&from=2026-02-30&to=2026-10-20")]) {
    assert.deepEqual(readReportingRange(params, "2026-10-20"), { period: "3m", from: "2026-07-21", to: "2026-10-20" });
  }
});

for (const [period, from] of [["1w", "2026-10-14"], ["1m", "2026-09-21"], ["3m", "2026-07-21"], ["6m", "2026-04-21"], ["1y", "2025-10-21"]] as const) {
  test(`rolling preset ${period} includes today`, () => assert.deepEqual(presetRange(period, "2026-10-20"), { period, from, to: "2026-10-20" }));
}

test("month end and leap-year clamping", () => {
  assert.equal(presetRange("1m", "2024-03-31").from, "2024-03-01");
  assert.equal(presetRange("1m", "2025-03-31").from, "2025-03-01");
  assert.equal(presetRange("1y", "2024-02-29").from, "2023-03-01");
});

test("strict custom dates, reversed dates, same-day ranges, and URL round trip", () => {
  for (const invalid of ["2026-02-30", "2026-13-01", "2026-1-01", "garbage", "2026-10-20T00:00:00Z"]) assert.equal(parseDateOnly(invalid), undefined);
  assert.equal(validDateRange("2026-10-21", "2026-10-20"), false);
  assert.equal(validDateRange("2026-10-20", "2026-10-20"), true);
  const range = { period: "custom" as const, from: "2024-02-29", to: "2026-10-20" };
  const params = writeReportingRange(new URLSearchParams("keep=yes"), range);
  assert.deepEqual(readReportingRange(params, "2026-10-20"), range);
  writeReportingRange(params, presetRange("1w", "2026-10-20"));
  assert.equal(params.has("from"), false);
  assert.equal(params.has("to"), false);
  assert.equal(params.get("keep"), "yes");
});

test("date filters use inclusive application dates, independent of recording or status activity date", () => {
  const scope = { from: "2026-10-01", to: "2026-10-20" };
  assert.equal(matchesScope(application("1", { applicationDate: "2026-10-01" }), scope), true);
  assert.equal(matchesScope(application("2"), scope), true);
  assert.equal(matchesScope(application("3", { applicationDate: "2026-09-30" }), scope), false);
  assert.equal(matchesScope(application("4", { applicationDate: "2026-10-21" }), scope), false);
});

test("interview evidence survives rejection, withdrawal and ghosting; zero-count Interviewing and direct selection stay honest", () => {
  const rows = [application("1", { status: "rejected", interviewCount: 2 }), application("2", { status: "withdrawn", interviewCount: 1 }),
    application("3", { status: "ghosted", interviewCount: 5 }), application("4", { status: "interviewing" }), application("5", { status: "selected" })];
  const summary = summarizeApplications(rows);
  assert.equal(summary.totalInterviews, 8);
  assert.equal(summary.interviewed, 3);
  assert.equal(summary.medianInterviews, 2);
  assert.equal(summary.averageInterviews, 8 / 3);
  assert.equal(percentage(summary.interviewed, summary.total), "60%");
  assert.deepEqual(summary.rounds.map((item) => item.count), [1, 1, 0, 0, 1]);
  assert.equal(summary.rounds.some((item) => String(item.rounds) === "0"), false);
  assert.equal(summary.rounds.reduce((sum, item) => sum + item.count, 0), summary.interviewed);
  assert.equal(summary.statusCounts.selected, 1);
});

test("empty denominators differ from zero successes, and even median is correct", () => {
  assert.equal(percentage(0, 0), "—"); assert.equal(percentage(0, 2), "0%");
  const empty = summarizeApplications([]);
  assert.equal(empty.averageInterviews, null); assert.equal(empty.medianInterviews, null);
  assert.equal(summarizeApplications([application("1", { interviewCount: 2 }), application("2", { interviewCount: 5 })]).medianInterviews, 3.5);
});

test("company and role comparisons normalize exact names, count distinct companies, and preserve closed outcomes", () => {
  const rows = [application("1", { company: " Acme ", interviewCount: 1 }), application("2", { company: "ACME", status: "rejected", interviewCount: 2 }),
    application("3", { company: "Acme Labs", role: " engineer ", status: "selected" }), application("4", { company: "Other", status: "ghosted", interviewCount: 3 })];
  assert.equal(summarizeApplications(rows).companies, 3);
  const acme = breakdownRows(rows, "company").find((row) => row.key === "acme")!;
  assert.deepEqual([acme.applications, acme.interviewed, acme.interviews, acme.open, acme.rejected], [2, 2, 3, 1, 1]);
  const role = breakdownRows(rows, "role")[0];
  assert.deepEqual([role.applications, role.companies, role.selected, role.ghosted], [4, 3, 1, 1]);
});

test("attention excludes every closed status, sorts oldest first, and uses legacy fallback", () => {
  const rows = [application("selected", { status: "selected" }), application("rejected", { status: "rejected" }),
    application("withdrawn", { status: "withdrawn" }), application("ghosted", { status: "ghosted" }),
    application("interviewing", { status: "interviewing" }), application("legacy", { statusUpdatedAt: null as unknown as Date }),
    application("future", { statusUpdatedAt: new Date("2026-10-21T12:00:00Z") })];
  const pending = pendingApplications(rows, now);
  assert.deepEqual(pending.map((row) => row.id), ["legacy", "interviewing", "future"]);
  assert.deepEqual(pending.map((row) => row.inactiveDays), [49, 19, 0]);
  assert.equal(activityBaseline(application("created", { statusUpdatedAt: null as unknown as Date, updatedAt: null as unknown as Date }))?.toISOString(), "2026-07-01T12:00:00.000Z");
});

test("cadence fills missing months, clips partial weeks, and never includes out-of-range submissions", () => {
  const rows = [application("1", { applicationDate: "2026-08-01" }), application("2", { applicationDate: "2026-10-20" }), application("3", { applicationDate: "2026-10-21" })];
  assert.deepEqual(cadenceBuckets(rows, { from: "2026-08-01", to: "2026-10-20" }, "month").map((bucket) => [bucket.from, bucket.to, bucket.count]), [
    ["2026-08-01", "2026-08-31", 1], ["2026-09-01", "2026-09-30", 0], ["2026-10-01", "2026-10-20", 1],
  ]);
  assert.deepEqual(cadenceBuckets(rows, { from: "2026-10-14", to: "2026-10-20" }, "week").map((bucket) => [bucket.from, bucket.to, bucket.count]), [
    ["2026-10-14", "2026-10-18", 0], ["2026-10-19", "2026-10-20", 1],
  ]);
});

test("daily cadence spans leap day and DST boundaries without skipping dates", () => {
  assert.equal(cadenceBuckets([], { from: "2024-02-28", to: "2024-03-01" }, "day").length, 3);
  assert.deepEqual(cadenceBuckets([], { from: "2026-03-07", to: "2026-03-10" }, "day").map((bucket) => bucket.from), ["2026-03-07", "2026-03-08", "2026-03-09", "2026-03-10"]);
});

test("drill-down URLs preserve scope, normalize groups, and safely return to stats", () => {
  const href = applicationsHref({ from: "2026-10-01", to: "2026-10-20" }, { company: "Acme & Co", rounds: "5+", interviewed: true }, "/stats?period=1m");
  const params = new URL(href, "http://localhost").searchParams;
  const scope = readApplicationScope(params)!;
  assert.equal(matchesScope(application("1", { company: " ACME & CO ", interviewCount: 7 }), scope), true);
  assert.equal(matchesScope(application("2", { company: "Acme & Co", interviewCount: 4 }), scope), false);
  assert.equal(params.get("returnTo"), "/stats?period=1m");
  assert.equal(safeStatsReturn("https://evil.example"), "/stats");
  assert.equal(safeStatsReturn("//evil.example"), "/stats");
  assert.equal(safeStatsReturn("/stats-other"), "/stats");
  assert.equal(readApplicationScope(new URLSearchParams("statsFrom=invalid&statsTo=2026-10-20")), null);
});
