"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { reconcileGhostedApplicationsAction } from "@/actions/ghosting";

// Shared by applications and stats; server rendering remains read-only.
export function GhostingSync() {
  const busy = useRef(false);
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();
  const retry = useRef<() => void>(() => {});
  useEffect(() => {
    let mounted = true;
    const sync = () => {
      if (busy.current || document.visibilityState === "hidden") return;
      busy.current = true;
      startTransition(async () => {
        try {
          const result = await reconcileGhostedApplicationsAction();
          if (mounted) setError(result.error);
        } catch {
          if (mounted) setError("Could not check for ghosted applications.");
        } finally {
          busy.current = false;
        }
      });
    };
    retry.current = sync;
    sync();
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      mounted = false;
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  if (!error) return null;
  return <div role="alert" className="mb-4 rounded-xl border border-destructive/30 p-3 text-xs text-destructive">
    {error} <button type="button" className="ml-2 underline" onClick={() => retry.current()}>Retry</button>
  </div>;
}
