"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, BarChart3, ListFilter, LogOut, User as UserIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { logoutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";

function GithubIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className={className}
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

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
      <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href={user ? "/applications" : "/"}
            className="flex items-center gap-2 font-semibold tracking-tight transition-opacity hover:opacity-80"
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs shrink-0">
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
        <div className="flex items-center gap-1 sm:gap-1.5">
          <a
            href="https://github.com/Arkapravo-Ghosh/job-applications-manager"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "size-8 sm:size-9 rounded-md text-muted-foreground hover:text-foreground transition-colors"
            )}
            title="GitHub Repository"
            aria-label="GitHub Repository"
          >
            <GithubIcon className="size-4" />
          </a>

          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-1 sm:gap-2 pl-0.5 sm:pl-2">
              <div className="hidden md:flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-xs font-medium text-foreground">
                <UserIcon className="size-3.5 text-muted-foreground" />
                <span>{user.username}</span>
              </div>
              <form action={logoutAction}>
                <Button
                  variant="ghost"
                  size="sm"
                  type="submit"
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive px-2 sm:px-3"
                  title="Log out"
                >
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline text-xs">Log out</span>
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="px-2 sm:px-3 text-xs sm:text-sm">
                  Log In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="px-2.5 sm:px-3 text-xs sm:text-sm">
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
