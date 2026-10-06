"use client";

import { useMemo, useState } from "react";
import type { JobApplication } from "@/db/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Briefcase,
  Users,
  Trophy,
  TrendingUp,
  XCircle,
  Video,
  Layers,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsViewProps {
  applications: JobApplication[];
}

const STATUS_COLORS: Record<string, string> = {
  applied: "#3b82f6", // blue
  interviewing: "#f59e0b", // amber
  selected: "#10b981", // emerald
  rejected: "#f43f5e", // rose
  withdrawn: "#71717a", // zinc
};

interface TooltipItem {
  value?: number;
  name?: string;
  color?: string;
  payload?: {
    status?: string;
    rawStatus?: string;
    company?: string;
    color?: string;
    month?: string;
    applications?: number;
    cumulative?: number;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string;
}

function StatusBarTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0];
    const color = item.payload?.color || "#3b82f6";
    const status = item.payload?.status || "Application";
    const count = item.value ?? 0;

    return (
      <div className="rounded-xl border border-border bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
          <span>{status}</span>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5 text-muted-foreground">
          <span className="text-base font-bold text-foreground">{count}</span>
          <span className="text-[11px]">application{count === 1 ? "" : "s"}</span>
        </div>
      </div>
    );
  }
  return null;
}

function CompanyTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0];
    const company = item.payload?.company || "Company";
    const count = item.value ?? 0;

    return (
      <div className="rounded-xl border border-border bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur-md">
        <div className="font-semibold text-foreground">{company}</div>
        <div className="mt-1 flex items-baseline gap-1.5 text-muted-foreground">
          <span className="text-base font-bold text-foreground">{count}</span>
          <span className="text-[11px]">application{count === 1 ? "" : "s"} submitted</span>
        </div>
      </div>
    );
  }
  return null;
}

function CompanyInterviewsTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0];
    const company = item.payload?.company || "Company";
    const count = item.value ?? 0;

    return (
      <div className="rounded-xl border border-border bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur-md">
        <div className="font-semibold text-foreground">{company}</div>
        <div className="mt-1 flex items-baseline gap-1.5 text-muted-foreground">
          <span className="text-base font-bold text-violet-600 dark:text-violet-400">{count}</span>
          <span className="text-[11px]">interview round{count === 1 ? "" : "s"} completed</span>
        </div>
      </div>
    );
  }
  return null;
}

function TimelineTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border bg-popover/95 px-3.5 py-2.5 text-xs shadow-xl backdrop-blur-md space-y-1.5">
        <div className="font-semibold text-foreground">{label}</div>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                <span className="size-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-semibold text-foreground">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export function StatsView({ applications }: StatsViewProps) {
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);

  // 1. KPI Calculations
  const total = applications.length;
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      applied: 0,
      interviewing: 0,
      selected: 0,
      rejected: 0,
      withdrawn: 0,
    };
    applications.forEach((job) => {
      if (counts[job.status] !== undefined) {
        counts[job.status]++;
      } else {
        counts[job.status] = 1;
      }
    });
    return counts;
  }, [applications]);

  const [companyChartMode, setCompanyChartMode] = useState<"applications" | "interviews">("applications");

  // Interview metrics
  const totalInterviewsGiven = useMemo(() => {
    return applications.reduce((acc, job) => acc + (job.interviewCount || 0), 0);
  }, [applications]);

  const jobsWithInterviews = useMemo(() => {
    return applications.filter((job) => (job.interviewCount || 0) > 0);
  }, [applications]);

  const avgRoundsPerInterviewedJob = useMemo(() => {
    if (jobsWithInterviews.length === 0) return 0;
    return Number((totalInterviewsGiven / jobsWithInterviews.length).toFixed(1));
  }, [totalInterviewsGiven, jobsWithInterviews]);

  const maxRoundsJob = useMemo(() => {
    if (applications.length === 0) return null;
    return applications.reduce((max, job) =>
      (job.interviewCount || 0) > (max?.interviewCount || 0) ? job : max,
      applications[0]
    );
  }, [applications]);

  const selectedJobs = useMemo(() => {
    return applications.filter((job) => job.status === "selected");
  }, [applications]);

  const avgRoundsForOffers = useMemo(() => {
    if (selectedJobs.length === 0) return 0;
    const rounds = selectedJobs.reduce((acc, job) => acc + (job.interviewCount || 0), 0);
    return Number((rounds / selectedJobs.length).toFixed(1));
  }, [selectedJobs]);

  const roundDistribution = useMemo(() => {
    const dist = [
      { label: "0 Rounds", description: "Direct applied / Initial screen", count: 0, color: "bg-blue-500" },
      { label: "1 Round", description: "Recruiter phone screen", count: 0, color: "bg-amber-500" },
      { label: "2 Rounds", description: "Technical / Take-home task", count: 0, color: "bg-indigo-500" },
      { label: "3+ Rounds", description: "Onsite / Final managerial", count: 0, color: "bg-emerald-500" },
    ];

    applications.forEach((job) => {
      const count = job.interviewCount || 0;
      if (count === 0) dist[0].count++;
      else if (count === 1) dist[1].count++;
      else if (count === 2) dist[2].count++;
      else dist[3].count++;
    });

    return dist;
  }, [applications]);

  const topInterviewCompaniesData = useMemo(() => {
    const compMap: Record<string, number> = {};
    applications.forEach((job) => {
      const count = job.interviewCount || 0;
      if (count > 0) {
        compMap[job.company] = (compMap[job.company] || 0) + count;
      }
    });

    return Object.entries(compMap)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [applications]);

  const activeInterviews = statusCounts.interviewing;
  const offersReceived = statusCounts.selected;
  const rejections = statusCounts.rejected;

  const interviewRate = total > 0 ? Math.round(((activeInterviews + offersReceived) / total) * 100) : 0;
  const offerRate = total > 0 ? Math.round((offersReceived / total) * 100) : 0;
  const rejectionRate = total > 0 ? Math.round((rejections / total) * 100) : 0;

  // 2. Bar Chart Data (Applications by Status)
  const statusChartData = useMemo(() => {
    const labels: Record<string, string> = {
      applied: "Applied",
      interviewing: "Interviewing",
      selected: "Selected",
      rejected: "Rejected",
      withdrawn: "Withdrawn",
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      status: labels[status] || status,
      rawStatus: status,
      count,
      color: STATUS_COLORS[status] || "#64748b",
    }));
  }, [statusCounts]);

  // 3. Donut / Pie Chart Data (Distribution)
  const pieChartData = useMemo(() => {
    return statusChartData.filter((item) => item.count > 0);
  }, [statusChartData]);

  const hoveredStatusData = useMemo(() => {
    if (!hoveredStatus) return null;
    return statusChartData.find((item) => item.rawStatus === hoveredStatus) || null;
  }, [hoveredStatus, statusChartData]);

  // 4. Line Chart Data (Applications Timeline by Month / Date)
  const timelineChartData = useMemo(() => {
    const monthCounts: Record<string, number> = {};

    applications.forEach((job) => {
      const month = job.applicationDate ? job.applicationDate.substring(0, 7) : "Unknown";
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });

    const sortedMonths = Object.keys(monthCounts).sort();
    const result: Array<{ month: string; applications: number; cumulative: number }> = [];

    let runningTotal = 0;
    for (const m of sortedMonths) {
      const count = monthCounts[m];
      runningTotal += count;
      let label = m;
      try {
        const [year, month] = m.split("-");
        const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
        label = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      } catch {
        label = m;
      }

      result.push({
        month: label,
        applications: count,
        cumulative: runningTotal,
      });
    }

    return result;
  }, [applications]);

  // 5. Top Companies Data
  const topCompaniesData = useMemo(() => {
    const compMap: Record<string, number> = {};
    applications.forEach((job) => {
      compMap[job.company] = (compMap[job.company] || 0) + 1;
    });

    return Object.entries(compMap)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [applications]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Analytics & Statistics
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          High-level metrics, funnel conversion rates, and visual timeline of your job search
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Total Applications
            </CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Briefcase className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">{total}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Recorded in pipeline
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Interviews Given
            </CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Video className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
              {totalInterviewsGiven}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {jobsWithInterviews.length > 0
                ? `Across ${jobsWithInterviews.length} companies`
                : "Total rounds completed"}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Interviewing
            </CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Users className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {activeInterviews}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Active conversations
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Selected / Offers
            </CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Trophy className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {offersReceived}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {offerRate}% offer rate
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Interview Rate
            </CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">{interviewRate}%</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Reached interview/offer
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Rejections
            </CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <XCircle className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {rejections}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {rejectionRate}% rejection rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 1 Charts: Bar Chart & Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Applications by Status */}
        <Card className="lg:col-span-2 rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Applications by Status</CardTitle>
            <CardDescription className="text-xs">
              Number of job submissions categorized by current status
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="status"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "currentColor", opacity: 0.7 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "currentColor", opacity: 0.7 }}
                  />
                  {/* Cursor set to false to completely eliminate the giant grey block */}
                  <Tooltip cursor={false} content={<StatusBarTooltip />} />
                  <Bar
                    dataKey="count"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={48}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        className="transition-opacity hover:opacity-85"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Donut Chart: Status Distribution with Central Interactive Metric (NO overlapping tooltip!) */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Status Distribution</CardTitle>
            <CardDescription className="text-xs">
              Proportion of total applications
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 flex flex-col items-center">
            <div className="relative h-[210px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="count"
                    onMouseEnter={(_, index) => {
                      setHoveredStatus(pieChartData[index]?.rawStatus || null);
                    }}
                    onMouseLeave={() => {
                      setHoveredStatus(null);
                    }}
                  >
                    {pieChartData.map((entry) => (
                      <Cell
                        key={entry.rawStatus}
                        fill={entry.color}
                        opacity={hoveredStatus ? (hoveredStatus === entry.rawStatus ? 1 : 0.45) : 1}
                        className="transition-all duration-200 cursor-pointer"
                        stroke={hoveredStatus === entry.rawStatus ? "var(--foreground)" : "transparent"}
                        strokeWidth={hoveredStatus === entry.rawStatus ? 2 : 0}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Dynamic Center Metric Display - smoothly updates on hover without overlapping tooltip */}
              <div className="pointer-events-none absolute flex flex-col items-center justify-center text-center transition-all duration-150">
                {hoveredStatusData ? (
                  <>
                    <span className="text-2xl font-extrabold tracking-tight text-foreground">
                      {hoveredStatusData.count}
                    </span>
                    <span
                      className="text-[11px] font-bold capitalize tracking-wide"
                      style={{ color: hoveredStatusData.color }}
                    >
                      {hoveredStatusData.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {Math.round((hoveredStatusData.count / (total || 1)) * 100)}% of total
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-extrabold tracking-tight text-foreground">{total}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Total
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Custom Legend */}
            <div className="w-full flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-3 pt-3 border-t border-border text-xs">
              {statusChartData.map((item) => (
                <button
                  type="button"
                  key={item.rawStatus}
                  onMouseEnter={() => setHoveredStatus(item.rawStatus)}
                  onMouseLeave={() => setHoveredStatus(null)}
                  className="flex items-center gap-1.5 cursor-pointer rounded-md px-1.5 py-0.5 hover:bg-muted/50 transition-colors"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground text-[11px]">{item.status}:</span>
                  <span className="font-semibold text-foreground text-[11px]">{item.count}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2 Charts: Timeline Line Chart & Top Companies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart: Activity Over Time */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Application Activity Over Time</CardTitle>
            <CardDescription className="text-xs">
              Monthly submission cadence and cumulative progress
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[260px] w-full">
              {timelineChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No timeline data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={timelineChartData}
                    margin={{ top: 10, right: 20, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis
                      dataKey="month"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "currentColor", opacity: 0.7 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "currentColor", opacity: 0.7 }}
                    />
                    <Tooltip
                      cursor={{ stroke: "var(--border)", strokeWidth: 1.5, strokeDasharray: "4 4" }}
                      content={<TimelineTooltip />}
                    />
                    <Line
                      type="monotone"
                      dataKey="applications"
                      name="New Submissions"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#3b82f6" }}
                      activeDot={{ r: 6, stroke: "var(--background)", strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      name="Cumulative Total"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 3, fill: "#10b981" }}
                      activeDot={{ r: 5, stroke: "var(--background)", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Companies Bar Chart with Mode Toggle */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-semibold">
                  {companyChartMode === "applications" ? "Top Companies Applied To" : "Top Companies by Interviews"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {companyChartMode === "applications"
                    ? "Organizations with the most submissions in your log"
                    : "Organizations where you completed the most interview rounds"}
                </CardDescription>
              </div>

              {/* Mode Toggle */}
              <div className="inline-flex items-center self-start sm:self-auto rounded-xl border border-border bg-muted/40 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setCompanyChartMode("applications")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer",
                    companyChartMode === "applications"
                      ? "bg-background text-foreground shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Applications
                </button>
                <button
                  type="button"
                  onClick={() => setCompanyChartMode("interviews")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer",
                    companyChartMode === "interviews"
                      ? "bg-background text-foreground shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Interviews
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[260px] w-full">
              {(companyChartMode === "applications" ? topCompaniesData : topInterviewCompaniesData).length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  {companyChartMode === "applications"
                    ? "No company data available"
                    : "No interview rounds recorded yet"}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={companyChartMode === "applications" ? topCompaniesData : topInterviewCompaniesData}
                    layout="vertical"
                    margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "currentColor", opacity: 0.7 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="company"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "currentColor", opacity: 0.8 }}
                      width={80}
                    />
                    <Tooltip
                      cursor={false}
                      content={companyChartMode === "applications" ? <CompanyTooltip /> : <CompanyInterviewsTooltip />}
                    />
                    <Bar
                      dataKey="count"
                      fill={companyChartMode === "applications" ? "#8b5cf6" : "#6366f1"}
                      radius={[0, 6, 6, 0]}
                      maxBarSize={22}
                      className="transition-opacity hover:opacity-85"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Interview Insights & Rounds Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Interview Rounds Distribution */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Interview Rounds Breakdown</CardTitle>
                <CardDescription className="text-xs">
                  How deep applications advanced through the interview funnel
                </CardDescription>
              </div>
              <div className="flex size-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <Layers className="size-3.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2 space-y-3.5">
            {roundDistribution.map((tier) => {
              const pct = total > 0 ? Math.round((tier.count / total) * 100) : 0;
              return (
                <div key={tier.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-full", tier.color)} />
                      <span className="font-semibold text-foreground">{tier.label}</span>
                      <span className="text-muted-foreground text-[11px] hidden sm:inline">
                        — {tier.description}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5 font-medium">
                      <span className="font-bold text-foreground">{tier.count}</span>
                      <span className="text-muted-foreground text-[11px]">({pct}%)</span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", tier.color)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Card 2: Interview Highlights & Velocity */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Interview Velocity & Milestones</CardTitle>
                <CardDescription className="text-xs">
                  Key benchmarks and round metrics across your applications
                </CardDescription>
              </div>
              <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Flame className="size-3.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-2 gap-3.5">
              <div className="rounded-xl border border-border/80 bg-secondary/30 p-3 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  Total Rounds Completed
                </span>
                <span className="text-2xl font-bold text-foreground block">
                  {totalInterviewsGiven}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Cumulative interview sessions
                </span>
              </div>

              <div className="rounded-xl border border-border/80 bg-secondary/30 p-3 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  Avg Rounds / Active Process
                </span>
                <span className="text-2xl font-bold text-foreground block">
                  {avgRoundsPerInterviewedJob}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Across {jobsWithInterviews.length} companies
                </span>
              </div>

              <div className="rounded-xl border border-border/80 bg-secondary/30 p-3 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  Avg Rounds to Offer
                </span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 block">
                  {avgRoundsForOffers > 0 ? `${avgRoundsForOffers}` : "—"}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {selectedJobs.length} accepted / offers
                </span>
              </div>

              <div className="rounded-xl border border-border/80 bg-secondary/30 p-3 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  Most Rounds Completed
                </span>
                <span className="text-lg font-bold text-foreground truncate block" title={maxRoundsJob?.company}>
                  {maxRoundsJob && (maxRoundsJob.interviewCount ?? 0) > 0
                    ? `${maxRoundsJob.company} (${maxRoundsJob.interviewCount})`
                    : "None yet"}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Deepest process reached
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
