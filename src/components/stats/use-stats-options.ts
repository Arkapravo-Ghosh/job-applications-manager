"use client";

import { useSearchParams } from "next/navigation";

// Keep view preferences in the return URL, rather than losing them on drill-down.
export function setStatsOptions(options: Record<string, string>) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(options)) url.searchParams.set(key, value);
  window.history.replaceState(null, "", `${url.pathname}?${url.searchParams}`);
}

export function useStatsOption<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  const value = useSearchParams().get(key);
  return allowed.includes(value as T) ? value as T : fallback;
}

export function useStatsPage(key: string) {
  const value = Number(useSearchParams().get(key));
  return Number.isSafeInteger(value) && value > 0 ? value : 1;
}
