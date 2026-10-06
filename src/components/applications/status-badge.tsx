import * as React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  const styles: Record<string, string> = {
    applied:
      "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
    interviewing:
      "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    selected:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    rejected:
      "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    withdrawn:
      "bg-neutral-500/15 text-neutral-700 dark:text-neutral-400 border-neutral-500/30",
  };

  const statusStyle = styles[normalized] || "bg-muted text-muted-foreground border-border";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize select-none",
        statusStyle,
        className
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", {
          "bg-blue-500": normalized === "applied",
          "bg-amber-500": normalized === "interviewing",
          "bg-emerald-500": normalized === "selected",
          "bg-rose-500": normalized === "rejected",
          "bg-neutral-500": normalized === "withdrawn",
        })}
      />
      {status}
    </span>
  );
}
