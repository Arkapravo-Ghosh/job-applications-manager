"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, BarChart3, ListFilter, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { logoutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";

interface NavbarProps {
  user?: {
    userId: string;
    username: string;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-xs">
      <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link
            href={user ? "/applications" : "/"}
            className="flex items-center gap-2 font-semibold tracking-tight transition-opacity hover:opacity-80"
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <Briefcase className="size-4" />
            </div>
            <span className="text-base font-bold tracking-tight">JobTrack</span>
          </Link>

          {/* Logged in Navigation Tabs */}
          {user && (
            <nav className="hidden sm:flex items-center gap-1">
              <Link
                href="/applications"
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  pathname === "/applications"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                <ListFilter className="size-4" />
                Applications
              </Link>
              <Link
                href="/stats"
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  pathname === "/stats"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                <BarChart3 className="size-4" />
                Stats
              </Link>
            </nav>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-2 pl-2">
              <div className="hidden md:flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-xs font-medium text-foreground">
                <UserIcon className="size-3.5 text-muted-foreground" />
                <span>{user.username}</span>
              </div>
              <form action={logoutAction}>
                <Button
                  variant="ghost"
                  size="sm"
                  type="submit"
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive"
                  title="Log out"
                >
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline text-xs">Log out</span>
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav row when logged in */}
      {user && (
        <div className="flex sm:hidden border-t border-border px-4 py-2 gap-2 bg-background/50">
          <Link
            href="/applications"
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1 text-xs font-medium",
              pathname === "/applications"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ListFilter className="size-3.5" />
            Applications
          </Link>
          <Link
            href="/stats"
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1 text-xs font-medium",
              pathname === "/stats"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BarChart3 className="size-3.5" />
            Stats
          </Link>
        </div>
      )}
    </header>
  );
}
