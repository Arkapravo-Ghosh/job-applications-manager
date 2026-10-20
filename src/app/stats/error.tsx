"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function StatsError({ retry }: { retry: () => void }) {
  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><Alert variant="destructive"><AlertTitle>Could not load your stats</AlertTitle><AlertDescription><p>Your applications are safe. Try loading the page again.</p><Button variant="outline" onClick={retry}>Try again</Button></AlertDescription></Alert></div>;
}
