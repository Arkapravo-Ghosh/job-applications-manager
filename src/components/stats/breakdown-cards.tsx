"use client";

import { Briefcase, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_CONFIG } from "@/lib/application-status";
import { percentage, type BreakdownRow } from "@/lib/stats-metrics";
import type { DrillDown } from "./stats-charts";

export function BreakdownCards({ rows, dimension, details, onDrillDown }: {
  rows: BreakdownRow[]; dimension: "company" | "role"; details: boolean; onDrillDown: DrillDown;
}) {
  const Icon = dimension === "company" ? Building2 : Briefcase;
  return <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:hidden" aria-label="Company and role comparison cards">
    {rows.map((row) => {
      const metrics = [
        { label: "Applications", value: String(row.applications), color: STATUS_CONFIG.applied.chartColor },
        { label: "Recorded interviews", value: String(row.interviews), color: STATUS_CONFIG.ghosted.chartColor },
        { label: "With interviews", value: `${row.interviewed}/${row.applications} (${percentage(row.interviewed, row.applications)})`, color: STATUS_CONFIG.interviewing.chartColor },
        { label: "Selected / Offer", value: `${row.selected}/${row.applications} (${percentage(row.selected, row.applications)})`, color: STATUS_CONFIG.selected.chartColor },
        ...(details ? [
          { label: "Open", value: String(row.open), color: STATUS_CONFIG.interviewing.chartColor },
          { label: "Rejected", value: String(row.rejected), color: STATUS_CONFIG.rejected.chartColor },
          { label: "Withdrawn", value: String(row.withdrawn), color: STATUS_CONFIG.withdrawn.chartColor },
          { label: "Ghosted", value: String(row.ghosted), color: STATUS_CONFIG.ghosted.chartColor },
          ...(dimension === "role" ? [{ label: "Companies", value: String(row.companies), color: STATUS_CONFIG.applied.chartColor }] : []),
        ] : []),
      ];
      return <Card key={row.key} size="sm" className="min-w-0">
        <CardHeader><CardTitle><div className="flex min-w-0 items-start gap-2"><Icon className="mt-1 size-4 shrink-0 text-muted-foreground" />
          <Button variant="link" className="h-auto min-h-8 min-w-0 justify-start whitespace-normal break-words p-0 text-left" onClick={() => onDrillDown({ [dimension]: row.key })}>{row.label}</Button>
        </div></CardTitle></CardHeader>
        <CardContent><dl className="grid grid-cols-2 gap-x-3 gap-y-4">
          {metrics.map((metric) => <div className="min-w-0" key={metric.label}><dt className="text-xs text-muted-foreground">{metric.label}</dt><dd className="mt-1 break-words font-semibold tabular-nums" style={{ color: metric.color }}>{metric.value}</dd></div>)}
        </dl></CardContent>
      </Card>;
    })}
  </div>;
}
