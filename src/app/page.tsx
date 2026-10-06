import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Filter, BarChart3, Briefcase } from "lucide-react";

export default async function LandingPage() {
  const session = await getSession();

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium text-foreground mb-6">
          <Briefcase className="size-3.5 text-muted-foreground" />
          <span>Simple Job Application Tracker</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground max-w-2xl leading-tight">
          Track your job hunt without the clutter.
        </h1>

        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl">
          Keep tabs on applied roles, interview rounds, offers, and rejections. Fast table search, multi-filter controls, and visual analytics.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto">
          {session ? (
            <>
              <Link href="/applications" className="w-full sm:w-auto">
                <Button size="lg" className="gap-2 w-full sm:w-auto justify-center">
                  Go to Applications <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/stats" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto justify-center">
                  <BarChart3 className="size-4" /> View Stats
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" className="gap-2 w-full sm:w-auto justify-center">
                  Sign In <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto justify-center">
                  Create Account
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Simple Features Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 w-full text-left">
          <Card className="bg-card/50">
            <CardContent className="p-5">
              <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center text-primary mb-3">
                <CheckCircle2 className="size-4" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Status Tracking</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Applied, interviewing, selected, withdrawn, or rejected states with application links.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="p-5">
              <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center text-primary mb-3">
                <Filter className="size-4" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Multi-Filter & Search</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Filter by multiple statuses and companies with in-filter searching and pagination.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="p-5">
              <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center text-primary mb-3">
                <BarChart3 className="size-4" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Visual Analytics</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Bar, line, and pie charts showing application trends, funnel progression, and top companies.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
