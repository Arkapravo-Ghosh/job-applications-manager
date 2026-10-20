import { Skeleton } from "@/components/ui/skeleton";

export default function StatsLoading() {
  return <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6" role="status" aria-label="Loading your job search stats">
    <Skeleton className="h-10 w-60" />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((key) => <Skeleton className="h-28 w-full" key={key} />)}</div>
    <Skeleton className="h-64 w-full" /><div className="grid grid-cols-1 gap-5 lg:grid-cols-2"><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /></div>
    <span className="sr-only">Loading stats</span>
  </div>;
}
