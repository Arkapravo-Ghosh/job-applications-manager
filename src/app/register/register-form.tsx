"use client";

import { useActionState } from "react";
import { registerAction, type AuthActionResult } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { AlertCircle, Lock, User, Briefcase, ArrowRight } from "lucide-react";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState<AuthActionResult | null, FormData>(
    registerAction,
    null
  );

  return (
    <div className="w-full max-w-[420px] mx-auto px-4">
      <Card className="border border-border/80 bg-card/95 shadow-xl sm:shadow-2xl rounded-2xl backdrop-blur-sm overflow-hidden">
        <CardHeader className="text-center pb-4 pt-8">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <Briefcase className="size-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Create your account</CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground">
            Start organizing and tracking your job search today
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 px-6 pb-8">
          {state?.error && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/15 border border-destructive/20 p-3 text-xs text-destructive font-medium">
              <AlertCircle className="size-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="e.g. yourname"
                  required
                  minLength={3}
                  maxLength={50}
                  className="pl-10 h-10.5 rounded-xl bg-muted/20 focus:bg-background"
                />
              </div>
              <p className="text-[11px] text-muted-foreground pl-1">
                Letters, numbers, underscores, and hyphens only
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="pl-10 h-10.5 rounded-xl bg-muted/20 focus:bg-background"
                />
              </div>
              <p className="text-[11px] text-muted-foreground pl-1">
                Must be at least 6 characters
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl text-sm font-semibold shadow-md transition-all mt-2"
              disabled={isPending}
            >
              {isPending ? (
                "Creating account..."
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Create Account <ArrowRight className="size-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
