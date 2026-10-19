export const APPLICATION_STATUSES = [
  "applied", "interviewing", "selected", "rejected", "withdrawn", "ghosted",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_CONFIG: Record<ApplicationStatus, {
  label: string; dotColor: string; badgeClass: string; chartColor: string;
}> = {
  applied: { label: "Applied", dotColor: "bg-blue-500", badgeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30", chartColor: "#3b82f6" },
  interviewing: { label: "Interviewing", dotColor: "bg-amber-500", badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30", chartColor: "#f59e0b" },
  selected: { label: "Selected / Offer", dotColor: "bg-emerald-500", badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30", chartColor: "#10b981" },
  rejected: { label: "Rejected", dotColor: "bg-rose-500", badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30", chartColor: "#f43f5e" },
  withdrawn: { label: "Withdrawn", dotColor: "bg-neutral-500", badgeClass: "bg-neutral-500/15 text-neutral-700 dark:text-neutral-400 border-neutral-500/30", chartColor: "#71717a" },
  ghosted: { label: "Ghosted", dotColor: "bg-violet-500", badgeClass: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30", chartColor: "#8b5cf6" },
};
