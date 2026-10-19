import { z } from "zod";

export type GhostingDuration = { years: number; months: number; weeks: number; days: number };
export type GhostingSettings = GhostingDuration & { enabled: boolean };
export const DEFAULT_GHOSTING_SETTINGS: GhostingSettings = {
  enabled: false, years: 0, months: 3, weeks: 0, days: 0,
};
export const GHOSTING_PRESETS = [
  { value: "1w", label: "1 week", years: 0, months: 0, weeks: 1, days: 0 },
  { value: "2w", label: "2 weeks", years: 0, months: 0, weeks: 2, days: 0 },
  { value: "1m", label: "1 month", years: 0, months: 1, weeks: 0, days: 0 },
  { value: "3m", label: "3 months", years: 0, months: 3, weeks: 0, days: 0 },
  { value: "6m", label: "6 months", years: 0, months: 6, weeks: 0, days: 0 },
  { value: "1y", label: "1 year", years: 1, months: 0, weeks: 0, days: 0 },
] as const;

// Calendar months first (clamped to month end), then weeks/days, always in UTC.
export function ghostingDeadline(baseline: Date, duration: GhostingDuration): Date {
  const result = new Date(baseline);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + duration.years * 12 + duration.months);
  const monthEnd = new Date(result);
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1, 0);
  result.setUTCDate(Math.min(day, monthEnd.getUTCDate()));
  result.setUTCDate(result.getUTCDate() + duration.weeks * 7 + duration.days);
  return result;
}

const component = z.number().int().min(0).max(9999);
export const ghostingSettingsSchema = z.object({
  enabled: z.boolean(), years: component, months: component, weeks: component, days: component,
}).refine((value) => value.years + value.months + value.weeks + value.days > 0, {
  message: "Choose a duration greater than zero.",
}).refine((value) => {
  const deadline = ghostingDeadline(new Date(), value);
  return Number.isFinite(deadline.getTime()) && deadline.getUTCFullYear() <= 9999;
}, { message: "Choose a shorter duration (deadline must be before year 10000)." });

export function presetForDuration(duration: GhostingDuration): string {
  return GHOSTING_PRESETS.find((preset) =>
    preset.years === duration.years && preset.months === duration.months &&
    preset.weeks === duration.weeks && preset.days === duration.days
  )?.value ?? "custom";
}
