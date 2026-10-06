import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { jobApplications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { StatsView } from "@/components/stats/stats-view";

export const metadata = {
  title: "Stats & Analytics — JobTrack",
  description: "Visualize and analyze your job search progress with interactive charts",
};

export default async function StatsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // SSR fetch directly from PostgreSQL using Drizzle ORM
  const userApplications = await db
    .select()
    .from(jobApplications)
    .where(eq(jobApplications.userId, session.userId))
    .orderBy(desc(jobApplications.applicationDate));

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      <StatsView applications={userApplications} />
    </div>
  );
}
