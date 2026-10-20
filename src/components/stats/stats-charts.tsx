"use client";

import { Bar, BarChart, CartesianGrid, Dot, Label, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { APPLICATION_STATUSES, STATUS_CONFIG } from "@/lib/application-status";
import { cadenceBuckets, defaultGranularity, percentage, summarizeApplications, type Granularity, type StatsApplication } from "@/lib/stats-metrics";
import { rangeDays, rangeLabel, type ApplicationScope, type DateRange } from "@/lib/stats-range";
import { setStatsOptions, useStatsOption, useStatsPage } from "./use-stats-options";

type Summary = ReturnType<typeof summarizeApplications>;
export type DrillDown = (scope: ApplicationScope) => void;
const cadenceConfig = { count: { label: "Applications", color: STATUS_CONFIG.applied.chartColor } } satisfies ChartConfig;
const workloadConfig = { count: { label: "Applications", color: STATUS_CONFIG.ghosted.chartColor } } satisfies ChartConfig;
const statusConfig = Object.fromEntries(APPLICATION_STATUSES.map((status) => [status, {
  label: STATUS_CONFIG[status].label, color: STATUS_CONFIG[status].chartColor,
}])) satisfies ChartConfig;

export function PipelineChart({ summary, onDrillDown }: { summary: Summary; onDrillDown: DrillDown }) {
  const chartType = useStatsOption("pipelineChart", ["ring", "bar"], "ring");
  const ringData = APPLICATION_STATUSES.map((status) => ({ status, count: summary.statusCounts[status], fill: `var(--color-${status})` }));
  return <Card className="min-w-0" data-testid="pipeline-panel">
    <CardHeader>
      <div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>Current pipeline</CardTitle>
        <Select value={chartType} items={[{ value: "ring", label: "Ring" }, { value: "bar", label: "Bar" }]} onValueChange={(value) => { if (value) setStatsOptions({ pipelineChart: value }); }}>
          <SelectTrigger aria-label="Current pipeline chart type"><SelectValue /></SelectTrigger><SelectContent alignItemWithTrigger={false}><SelectGroup><SelectItem value="ring">Ring</SelectItem><SelectItem value="bar">Bar</SelectItem></SelectGroup></SelectContent>
        </Select>
      </div>
      <CardDescription>Current status of applications submitted in this period.</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col gap-4">
      <ChartContainer config={statusConfig} className="h-52 w-full aspect-auto" aria-label="Current pipeline status distribution">
        {chartType === "ring" ? <PieChart accessibilityLayer>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="status" />} />
          <Pie data={ringData} dataKey="count" nameKey="status" innerRadius={60} outerRadius={86} paddingAngle={2} strokeWidth={0} isAnimationActive={false} cursor="pointer"
            onClick={(_, index) => { if (ringData[index]) onDrillDown({ status: ringData[index].status }); }}>
            <Label content={({ viewBox }) => viewBox && "cx" in viewBox && "cy" in viewBox ? <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
              <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-semibold">{summary.total}</tspan><tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 23} className="fill-muted-foreground text-xs">applications</tspan>
            </text> : null} />
          </Pie>
        </PieChart> : <BarChart accessibilityLayer layout="vertical" data={[{ label: "Applications", ...summary.statusCounts }]} margin={{ left: 0, right: 0 }}>
          <XAxis type="number" hide domain={[0, summary.total]} /><YAxis type="category" dataKey="label" hide />
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          {APPLICATION_STATUSES.map((status) => <Bar key={status} dataKey={status} stackId="status" fill={`var(--color-${status})`}
            barSize={32} isAnimationActive={false} cursor="pointer" onClick={() => onDrillDown({ status })} />)}
        </BarChart>}
      </ChartContainer>
      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2" aria-label="Pipeline counts and application links">
        {APPLICATION_STATUSES.map((status) => <li key={status}>
          <Button variant="ghost" className="w-full justify-between" onClick={() => onDrillDown({ status })} aria-label={`View ${STATUS_CONFIG[status].label} applications`}>
            <span className="flex items-center gap-2"><span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: STATUS_CONFIG[status].chartColor }} />{STATUS_CONFIG[status].label}</span>
            <span className="tabular-nums">{summary.statusCounts[status]} <span className="text-muted-foreground">({percentage(summary.statusCounts[status], summary.total)})</span></span>
          </Button>
        </li>)}
      </ul>
    </CardContent>
  </Card>;
}

export function CadenceChart({ applications, range, onDrillDown }: { applications: StatsApplication[]; range: DateRange; onDrillDown: DrillDown }) {
  const chartType = useStatsOption("cadenceChart", ["bar", "line"], "bar");
  const chosenGranularity = useStatsOption<Granularity>("cadence", ["day", "week", "month"], defaultGranularity(range));
  // Very long custom ranges cannot create tens of thousands of daily bars.
  const days = rangeDays(range);
  const granularity = chosenGranularity === "day" && days > 366 || chosenGranularity === "week" && days > 3653
    ? defaultGranularity(range) : chosenGranularity ?? defaultGranularity(range);
  const buckets = cadenceBuckets(applications, range, granularity);
  const page = useStatsPage("countsPage");
  const countsOpen = useStatsOption("counts", ["yes", "no"], "no") === "yes";
  const totalPages = Math.max(1, Math.ceil(buckets.length / 12));
  const safePage = Math.min(page, totalPages);
  return <Card className="min-w-0" data-testid="cadence-panel">
    <CardHeader>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle>Application cadence</CardTitle>
        <div className="flex flex-wrap gap-2">
        <Select value={chartType} items={[{ value: "bar", label: "Bar" }, { value: "line", label: "Line" }]} onValueChange={(value) => { if (value) setStatsOptions({ cadenceChart: value }); }}>
          <SelectTrigger aria-label="Application cadence chart type"><SelectValue /></SelectTrigger><SelectContent alignItemWithTrigger={false}><SelectGroup><SelectItem value="bar">Bar</SelectItem><SelectItem value="line">Line</SelectItem></SelectGroup></SelectContent>
        </Select>
        <Select value={granularity} onValueChange={(value) => { if (value) setStatsOptions({ cadence: value, countsPage: "1" }); }} items={[
          { value: "day", label: "Daily" }, { value: "week", label: "Weekly" }, { value: "month", label: "Monthly" },
        ]}>
          <SelectTrigger aria-label="Application cadence granularity"><SelectValue /></SelectTrigger>
          <SelectContent alignItemWithTrigger={false}><SelectGroup>
            <SelectItem value="day" disabled={days > 366}>Daily</SelectItem>
            <SelectItem value="week" disabled={days > 3653}>Weekly</SelectItem>
            <SelectItem value="month">Monthly</SelectItem>
          </SelectGroup></SelectContent>
        </Select>
        </div>
      </div>
      <CardDescription>Applications by submission date. Empty periods count as zero.</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col gap-3">
      <ChartContainer config={cadenceConfig} className="h-56 w-full aspect-auto" aria-label="Applications submitted over time">
        {chartType === "bar" ? <BarChart accessibilityLayer data={buckets} margin={{ left: -20, right: 8 }}>
          <CartesianGrid vertical={false} /><XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
          <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, payload) => {
            const bucket = payload[0]?.payload;
            return bucket ? rangeLabel(bucket) : "Applications";
          }} />} />
          <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} cursor="pointer"
            onClick={(item) => { if (item.payload) onDrillDown({ from: item.payload.from, to: item.payload.to }); }} />
        </BarChart> : <LineChart accessibilityLayer data={buckets} margin={{ left: -20, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} /><XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
          <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, payload) => payload[0]?.payload ? rangeLabel(payload[0].payload) : "Applications"} />} />
          <Line type="linear" dataKey="count" stroke="var(--color-count)" strokeWidth={2} activeDot={false} isAnimationActive={false}
            dot={(point) => <Dot key={point.index} className="recharts-line-dot" cx={point.cx} cy={point.cy} r={4} fill="var(--color-count)" stroke="var(--color-count)" cursor="pointer" onClick={(_, event) => {
              event.stopPropagation();
              const bucket = buckets[point.index];
              if (bucket) onDrillDown({ from: bucket.from, to: bucket.to });
            }} />} />
        </LineChart>}
      </ChartContainer>
      <Collapsible open={countsOpen} onOpenChange={(open) => setStatsOptions({ counts: open ? "yes" : "no" })}>
        <CollapsibleTrigger render={<Button variant="ghost" size="sm" />}><ChevronDown data-icon="inline-start" />View period counts</CollapsibleTrigger>
        <CollapsibleContent>
          <Table aria-label="Application cadence data"><TableHeader><TableRow><TableHead>Period</TableHead><TableHead className="text-right">Applications</TableHead></TableRow></TableHeader>
            <TableBody>{buckets.slice((safePage - 1) * 12, safePage * 12).map((bucket) => <TableRow key={bucket.key}>
              <TableCell><Button variant="link" onClick={() => onDrillDown({ from: bucket.from, to: bucket.to })}>{rangeLabel(bucket)}</Button></TableCell>
              <TableCell className="text-right tabular-nums">{bucket.count}</TableCell>
            </TableRow>)}</TableBody>
          </Table>
          {totalPages > 1 ? <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setStatsOptions({ countsPage: String(safePage - 1) })}>Previous periods</Button>
            <span className="text-xs text-muted-foreground">{safePage} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setStatsOptions({ countsPage: String(safePage + 1) })}>Next periods</Button>
          </div> : null}
        </CollapsibleContent>
      </Collapsible>
    </CardContent>
  </Card>;
}

export function InterviewWorkload({ summary, onDrillDown }: { summary: Summary; onDrillDown: DrillDown }) {
  return <Card className="min-w-0" data-testid="workload-panel">
    <CardHeader><CardTitle>Interview workload</CardTitle><CardDescription>Only applications with recorded interviews. Counts do not imply interview types.</CardDescription></CardHeader>
    <CardContent className="flex flex-col gap-4">
      {summary.interviewed > 0 ? <><ChartContainer config={workloadConfig} className="h-52 w-full aspect-auto" aria-label="Applications by number of recorded interviews">
        <BarChart accessibilityLayer data={summary.rounds} margin={{ left: -20, right: 8 }}>
          <CartesianGrid vertical={false} /><XAxis dataKey="rounds" tickLine={false} axisLine={false} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
          <ChartTooltip content={<ChartTooltipContent labelFormatter={(label) => `${label} recorded interviews`} />} />
          <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} maxBarSize={52} isAnimationActive={false} cursor="pointer"
            onClick={(item) => { if (item.payload) onDrillDown({ rounds: item.payload.rounds }); }} />
        </BarChart>
      </ChartContainer>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5" aria-label="Interview count data and application links">
        {summary.rounds.map((bucket) => <li key={bucket.rounds}><Button variant="outline" className="w-full" onClick={() => onDrillDown({ rounds: bucket.rounds })}
          aria-label={`View applications with ${bucket.rounds} recorded interviews`}>
          {bucket.rounds}: {bucket.count}
        </Button></li>)}
      </ul>
      <p className="text-xs text-muted-foreground">Among {summary.interviewed} applications with recorded interviews: mean {summary.averageInterviews?.toFixed(1) ?? "—"}, median {summary.medianInterviews ?? "—"}. These interviews may have occurred outside the submission period.</p>
      </> : <Empty><EmptyHeader><EmptyTitle>No interviews recorded yet</EmptyTitle><EmptyDescription>Applications with zero recorded interviews are excluded from this chart.</EmptyDescription></EmptyHeader></Empty>}
    </CardContent>
  </Card>;
}
