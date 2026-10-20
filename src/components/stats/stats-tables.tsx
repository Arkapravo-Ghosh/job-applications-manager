"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/applications/status-badge";
import { ghostingDeadline, type GhostingSettings } from "@/lib/ghosting";
import { breakdownRows, pendingApplications, percentage, type BreakdownMetric, type StatsApplication } from "@/lib/stats-metrics";
import { dateLabel, type DateRange } from "@/lib/stats-range";
import type { DrillDown } from "./stats-charts";
import { setStatsOptions, useStatsOption, useStatsPage } from "./use-stats-options";
import { BreakdownCards } from "./breakdown-cards";

export function AttentionTable({ applications, now, timeZone, ghosting, onDrillDown }: {
  applications: StatsApplication[]; now: Date; timeZone: string; ghosting: GhostingSettings; onDrillDown: DrillDown;
}) {
  const expanded = useStatsOption("attention", ["expanded", "compact"], "compact") === "expanded";
  const sort = useStatsOption("attentionSort", ["oldest", "newest", "company"], "oldest");
  const pending = pendingApplications(applications, now);
  const rows = sort === "company" ? [...pending].sort((a, b) => a.company.localeCompare(b.company))
    : sort === "newest" ? [...pending].reverse() : pending;
  const date = (value: Date) => value.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone });
  return <Card className="min-w-0" data-testid="attention-panel">
    <CardHeader>
      <div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>Needs attention <span className="text-muted-foreground">({pending.length} open)</span></CardTitle>
        {pending.length > 1 ? <Select value={sort} onValueChange={(value) => { if (value) setStatsOptions({ attentionSort: value }); }} items={[
          { value: "oldest", label: "Longest inactive" }, { value: "newest", label: "Most recent activity" }, { value: "company", label: "Company A–Z" },
        ]}>
          <SelectTrigger aria-label="Sort open applications"><SelectValue /></SelectTrigger>
          <SelectContent alignItemWithTrigger={false}><SelectGroup>
            <SelectItem value="oldest">Longest inactive</SelectItem><SelectItem value="newest">Most recent activity</SelectItem><SelectItem value="company">Company A–Z</SelectItem>
          </SelectGroup></SelectContent>
        </Select> : null}
      </div>
      <CardDescription>Applied and Interviewing applications submitted in this period. Inactivity is time since the last recorded status change or interview addition.</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col gap-3">
      {rows.length ? <>
        <Table aria-label="Open applications needing review">
          <TableHeader><TableRow><TableHead>Application</TableHead><TableHead className="hidden md:table-cell">Status</TableHead><TableHead>Inactivity</TableHead><TableHead><span className="sr-only">Action</span></TableHead></TableRow></TableHeader>
          <TableBody>{rows.slice(0, expanded ? rows.length : 5).map((job) => {
            const deadline = ghosting.enabled && job.baseline ? ghostingDeadline(job.baseline, ghosting) : null;
            return <TableRow key={job.id}>
              <TableCell className="max-w-32 whitespace-normal sm:max-w-72">
                <div className="flex flex-col items-start gap-1 break-words"><span className="font-medium">{job.company}</span><span className="text-xs text-muted-foreground">{job.role}</span>
                  <span className="md:hidden"><StatusBadge status={job.status} /></span>
                  <span className="text-xs text-muted-foreground">{job.interviewCount} recorded interview{job.interviewCount === 1 ? "" : "s"}</span>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell"><StatusBadge status={job.status} /></TableCell>
              <TableCell className="max-w-32 whitespace-normal">
                <div className="flex flex-col gap-1"><span className="tabular-nums">{job.inactiveDays === null ? "Unknown" : `${job.inactiveDays}d`}</span>
                  <span className="text-xs text-muted-foreground">Last activity: {job.baseline ? date(job.baseline) : "Unknown"}</span>
                  {deadline ? <span className="text-xs text-muted-foreground">{deadline <= now ? "Past ghosting deadline; awaiting check" : `Auto-ghosting: ${date(deadline)}`}</span> : null}
                </div>
              </TableCell>
              <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => onDrillDown({ id: job.id })} aria-label={`Open application at ${job.company} for ${job.role}`}>Open</Button></TableCell>
            </TableRow>;
          })}</TableBody>
        </Table>
        {rows.length > 5 ? <Button variant="ghost" onClick={() => setStatsOptions({ attention: expanded ? "compact" : "expanded" })} aria-expanded={expanded}>{expanded ? "Show fewer" : `Show all ${rows.length} open applications`}</Button> : null}
        <p className="text-xs text-muted-foreground">Legacy activity dates may reflect an earlier edit or when the application was recorded.{ghosting.enabled ? " Automatic ghosting is checked daily and when the app is opened." : " Auto-ghosting is off."}</p>
      </> : <Empty><EmptyHeader><EmptyTitle>No open applications in this period</EmptyTitle><EmptyDescription>Selected / Offer, Rejected, Withdrawn, and Ghosted applications are excluded from this list.</EmptyDescription></EmptyHeader></Empty>}
    </CardContent>
  </Card>;
}

const SORT_METRICS: { value: BreakdownMetric | "label"; label: string }[] = [
  { value: "applications", label: "Applications" }, { value: "label", label: "Name A–Z" },
  { value: "interviewed", label: "Applications with interviews" }, { value: "interviews", label: "Recorded interviews" },
  { value: "open", label: "Open applications" }, { value: "selected", label: "Selected / Offer" },
];

export function BreakdownTable({ applications, range, onDrillDown }: { applications: StatsApplication[]; range: DateRange; onDrillDown: DrillDown }) {
  const dimension = useStatsOption("group", ["company", "role"], "company");
  const sort = useStatsOption("sort", SORT_METRICS.map((item) => item.value), "applications");
  const details = useStatsOption("details", ["yes", "no"], "no") === "yes";
  const page = useStatsPage("groupsPage");
  const rows = breakdownRows(applications, dimension).sort((a, b) => (sort === "label" ? 0 : b[sort] - a[sort]) || a.label.localeCompare(b.label));
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const safePage = Math.min(page, pages);
  const visibleRows = rows.slice((safePage - 1) * 10, safePage * 10);
  return <Card className="min-w-0" data-testid="breakdown-panel">
    <CardHeader>
      <CardTitle>Where your effort goes</CardTitle><CardDescription>Compare counts and current outcomes by company or role. Small samples are not a performance ranking.</CardDescription>
      <div className="grid grid-cols-1 items-end gap-3 pt-2 sm:grid-cols-[auto_minmax(0,1fr)_auto] xl:flex xl:flex-wrap">
        <Field className="min-w-0 xl:w-auto"><FieldLabel htmlFor="breakdown-dimension">Group by</FieldLabel><Select value={dimension} onValueChange={(value) => { if (value) setStatsOptions({ group: value, groupsPage: "1" }); }} items={[
          { value: "company", label: "Company" }, { value: "role", label: "Role" },
        ]}>
          <SelectTrigger id="breakdown-dimension" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="company">Company</SelectItem><SelectItem value="role">Role</SelectItem></SelectGroup></SelectContent>
        </Select></Field>
        <Field className="min-w-0 xl:w-auto"><FieldLabel htmlFor="breakdown-sort">Sort by</FieldLabel><Select value={sort} items={SORT_METRICS} onValueChange={(value) => { if (value) setStatsOptions({ sort: value, groupsPage: "1" }); }}>
          <SelectTrigger id="breakdown-sort" className="w-full"><SelectValue /></SelectTrigger><SelectContent alignItemWithTrigger={false} align="start" className="w-max min-w-[var(--anchor-width)] max-w-[calc(100vw-2rem)]"><SelectGroup>{SORT_METRICS.map((item) => <SelectItem value={item.value} key={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent>
        </Select></Field>
        <Button variant="outline" aria-pressed={details} onClick={() => setStatsOptions({ details: details ? "no" : "yes" })}>{details ? "Fewer details" : "More details"}</Button>
      </div>
    </CardHeader>
    <CardContent className="flex flex-col gap-3">
      <BreakdownCards rows={visibleRows} dimension={dimension} details={details} onDrillDown={onDrillDown} />
      <div role="region" aria-label="Company and role comparison" className="hidden min-w-0 xl:block">
        <Table aria-label="Company and role comparison" tabIndex={0}>
          <TableHeader><TableRow><TableHead>{dimension === "company" ? "Company" : "Role"}</TableHead><TableHead>Applications</TableHead><TableHead>Interviews</TableHead><TableHead>With interviews</TableHead><TableHead>Selected / Offer</TableHead>
            {details ? <><TableHead>Open</TableHead><TableHead>Rejected</TableHead><TableHead>Withdrawn</TableHead><TableHead>Ghosted</TableHead>{dimension === "role" ? <TableHead>Companies</TableHead> : null}</> : null}
          </TableRow></TableHeader>
          <TableBody>{visibleRows.map((row) => <TableRow key={row.key}>
            <TableCell className="max-w-52 whitespace-normal"><Button variant="link" className="h-auto min-h-8 max-w-52 justify-start whitespace-normal break-words text-left" onClick={() => onDrillDown({ [dimension]: row.key })}>{row.label}</Button></TableCell>
            <TableCell className="tabular-nums">{row.applications}</TableCell>
            <TableCell className="tabular-nums">{row.interviews}</TableCell>
            <TableCell className="tabular-nums">{row.interviewed}/{row.applications} <span className="text-muted-foreground">({percentage(row.interviewed, row.applications)})</span></TableCell>
            <TableCell className="tabular-nums">{row.selected}/{row.applications} <span className="text-muted-foreground">({percentage(row.selected, row.applications)})</span></TableCell>
            {details ? <><TableCell>{row.open}</TableCell><TableCell>{row.rejected}</TableCell><TableCell>{row.withdrawn}</TableCell><TableCell>{row.ghosted}</TableCell>{dimension === "role" ? <TableCell>{row.companies}</TableCell> : null}</> : null}
          </TableRow>)}</TableBody>
        </Table>
      </div>
      {pages > 1 ? <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setStatsOptions({ groupsPage: String(safePage - 1) })}>Previous groups</Button><span className="text-xs text-muted-foreground">{safePage} / {pages}</span><Button variant="outline" size="sm" disabled={safePage >= pages} onClick={() => setStatsOptions({ groupsPage: String(safePage + 1) })}>Next groups</Button>
      </div> : null}
      <p className="text-xs text-muted-foreground">Submitted {dateLabel(range.from)} – {dateLabel(range.to)}. “With interviews” means a recorded count above zero, including applications that are now closed. Selected / Offer does not imply acceptance.</p>
    </CardContent>
  </Card>;
}
