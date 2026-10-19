import * as React from "react";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, type ApplicationStatus } from "@/lib/application-status";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  const config = STATUS_CONFIG[normalized as ApplicationStatus];
  const statusStyle = config?.badgeClass || "bg-muted text-muted-foreground border-border";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize select-none",
        statusStyle,
        className
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", config?.dotColor)}
      />
      {config?.label ?? status}
    </span>
  );
}
