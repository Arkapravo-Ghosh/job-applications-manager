import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { jobApplications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ApplicationsView } from "@/components/applications/applications-view";

export const metadata = {
  title: "Applications — JobTrack",
  description: "View and manage your job applications",
};

export default async function ApplicationsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // SSR fetch directly from PostgreSQL using Drizzle ORM
  const userApplications = await db
    .select()
    .from(jobApplications)
    .where(eq(jobApplications.userId, session.userId))
    .orderBy(desc(jobApplications.applicationDate), desc(jobApplications.createdAt));

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      <ApplicationsView initialApplications={userApplications} />
    </div>
  );
}
