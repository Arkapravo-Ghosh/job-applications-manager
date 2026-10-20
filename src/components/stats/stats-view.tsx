"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Briefcase, Building2, Video, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import type { GhostingSettings } from "@/lib/ghosting";
import { percentage, summarizeApplications, type StatsApplication } from "@/lib/stats-metrics";
import { applicationsHref, matchesScope, readReportingRange, writeReportingRange, type ApplicationScope, type ReportingRange } from "@/lib/stats-range";
import { ReportingPeriod } from "./reporting-period";
import { CadenceChart, InterviewWorkload, PipelineChart } from "./stats-charts";
import { AttentionTable, BreakdownTable } from "./stats-tables";
import { STATUS_CONFIG } from "@/lib/application-status";

function subscribeDate(callback: () => void) {
  const timer = window.setInterval(callback, 60_000);
  window.addEventListener("focus", callback);
  return () => { window.clearInterval(timer); window.removeEventListener("focus", callback); };
}
function browserDateSnapshot() {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const parts = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone }).formatToParts(new Date());
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}|${timeZone}`;
}

export function StatsView({ applications, ghostingSettings, snapshotAt }: {
  applications: StatsApplication[]; ghostingSettings: GhostingSettings; snapshotAt: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  // Stable UTC server snapshot prevents hydration mismatches; then use the viewer's calendar date.
  const clock = useSyncExternalStore(subscribeDate, browserDateSnapshot, () => `${snapshotAt.slice(0, 10)}|UTC`);
  const [today, timeZone] = clock.split("|");
  const range = readReportingRange(params, today);
  const restoreY = params.get("returnY");
  useEffect(() => {
    const top = Number(restoreY);
    if (!restoreY || !Number.isFinite(top) || top < 0) return;
    const frame = window.requestAnimationFrame(() => window.scrollTo({ top, behavior: "instant" }));
    return () => window.cancelAnimationFrame(frame);
  }, [restoreY]);
  const filtered = useMemo(() => applications.filter((job) => matchesScope(job, { from: range.from, to: range.to })), [applications, range.from, range.to]);
  const summary = useMemo(() => summarizeApplications(filtered), [filtered]);
  const returnParams = new URLSearchParams(params.toString());
  writeReportingRange(returnParams, range);
  function drillDown(scope: ApplicationScope) {
    returnParams.set("returnY", String(Math.round(window.scrollY)));
    router.push(applicationsHref(range, scope, `/stats?${returnParams}`));
  }
  function changeRange(next: ReportingRange) {
    const query = writeReportingRange(new URLSearchParams(params.toString()), next);
    query.delete("groupsPage"); query.delete("countsPage"); query.delete("returnY");
    window.history.pushState(null, "", `/stats?${query}`);
  }

  const summaries = [
    { label: "Applications", value: summary.total, detail: "Submitted in this period", scope: {}, icon: Briefcase, color: STATUS_CONFIG.applied.chartColor },
    { label: "Companies", value: summary.companies, detail: "Distinct company names", scope: {}, icon: Building2, color: STATUS_CONFIG.selected.chartColor },
    { label: "Recorded interviews", value: summary.totalInterviews, detail: "Across these applications", scope: { interviewed: true }, icon: Video, color: STATUS_CONFIG.ghosted.chartColor },
    { label: "Applications with interviews", value: `${summary.interviewed} / ${summary.total}`, detail: `${percentage(summary.interviewed, summary.total)} have recorded interviews`, scope: { interviewed: true }, icon: Users, color: STATUS_CONFIG.interviewing.chartColor },
  ];
  return <div className="flex min-w-0 flex-col gap-5">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div className="flex min-w-0 flex-col items-start gap-2"><h1 className="text-2xl font-bold tracking-tight">Your job search</h1><p className="text-sm text-muted-foreground">See where your effort goes and what needs attention.</p><StatsDefinitions /></div>
      <ReportingPeriod range={range} today={today} onChange={changeRange} />
    </div>
    <p className="text-xs text-muted-foreground">All views use application submission date. Outcomes are current, not historical. Activity dates use {timeZone}.</p>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Search summary" aria-live="polite" aria-atomic="true" data-testid="stats-summary">
      {summaries.map((item) => <Card key={item.label} size="sm" className="min-w-0 gap-1"><CardHeader><CardTitle><span className="flex items-start gap-2"><item.icon className="mt-0.5 size-4 shrink-0" style={{ color: item.color }} />{item.label}</span></CardTitle></CardHeader><CardContent className="flex h-full flex-col items-start gap-1">
        <Button variant="link" className="h-auto min-h-9 p-0" onClick={() => drillDown(item.scope)} aria-label={`View ${item.label.toLowerCase()}`}><span className="text-2xl font-semibold tabular-nums">{item.value}</span></Button><CardDescription>{item.detail}</CardDescription>
      </CardContent></Card>)}
    </div>
    <p className="sr-only" role="status">{summary.total} applications in the selected period; {summary.interviewed} applications with recorded interviews.</p>
    {summary.total ? <>
      <AttentionTable applications={filtered} now={new Date(snapshotAt)} timeZone={timeZone} ghosting={ghostingSettings} onDrillDown={drillDown} />
      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2"><PipelineChart summary={summary} onDrillDown={drillDown} /><CadenceChart applications={filtered} range={range} onDrillDown={drillDown} /></div>
      <InterviewWorkload summary={summary} onDrillDown={drillDown} />
      <BreakdownTable applications={filtered} range={range} onDrillDown={drillDown} />
    </> : <Empty className="border"><EmptyHeader><EmptyTitle>{applications.length ? "No applications in this period" : "Your search starts here"}</EmptyTitle><EmptyDescription>{applications.length ? "Choose another reporting period or a custom date range to see older applications." : "Add your first application to start tracking your search. No activity or outcomes will be guessed."}</EmptyDescription></EmptyHeader><EmptyContent><Button render={<Link href="/applications" />}>Go to applications</Button></EmptyContent></Empty>}
    <p className="text-xs text-muted-foreground">Current outcomes as of {new Date(snapshotAt).toLocaleString("en-GB", { timeZone, dateStyle: "medium", timeStyle: "short" })}. Data refreshes when you return to the app.</p>
  </div>;
}

function StatsDefinitions() {
  return <Dialog><DialogTrigger render={<Button variant="ghost" size="sm" />}><BookOpen data-icon="inline-start" />How these stats work</DialogTrigger>
    <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>How these stats work</DialogTitle><DialogDescription>Counts reflect your records, not assumptions about an employer.</DialogDescription></DialogHeader>
      <dl className="flex flex-col gap-4 text-sm">
        <div><dt className="font-medium">Reporting period</dt><dd className="text-muted-foreground">Filters every view by application submission date, including both boundary dates. Presets are rolling periods ending today. Current status and interview totals are attached to those applications; they did not necessarily occur in that period.</dd></div>
        <div><dt className="font-medium">Recorded interviews</dt><dd className="text-muted-foreground">Applications with an interview count above zero, including those later rejected, withdrawn, or ghosted. Interviewing with zero recorded interviews stays separate. Round numbers do not identify HR, technical, or final stages.</dd></div>
        <div><dt className="font-medium">Inactivity and ghosting</dt><dd className="text-muted-foreground">Time since a recorded status change or interview addition, not the last recruiter reply. Older records may use earlier edit/creation dates. Only Applied and Interviewing can be automatically ghosted.</dd></div>
        <div><dt className="font-medium">Current outcomes</dt><dd className="text-muted-foreground">Selected / Offer does not mean accepted or hired. Ghosted does not prove no reply. Historical conversion and time-to-response cannot be reconstructed from current statuses.</dd></div>
        <div><dt className="font-medium">Rates and comparisons</dt><dd className="text-muted-foreground">With interviews and Selected / Offer rates divide the matching application count by all applications in the group. Denominators are shown; no denominator is displayed as —. Company/role grouping ignores case and surrounding spaces. Small samples are not ranked by rate.</dd></div>
      </dl>
    </DialogContent>
  </Dialog>;
}
