"use client";

import * as React from "react";
import { useState, useMemo, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { JobApplication } from "@/db/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MultiFilterPopover, type FilterOption } from "./multi-filter-popover";
import { StatusBadge } from "./status-badge";
import { ApplicationDialog } from "./application-dialog";
import { DeleteDialog } from "./delete-dialog";
import { updateInterviewCountAction } from "@/actions/jobs";
import {
  Search,
  Plus,
  Minus,
  ExternalLink,
  Edit2,
  Trash2,
  Calendar,
  Building2,
  Briefcase,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";

interface ApplicationsViewProps {
  initialApplications: JobApplication[];
}

export function ApplicationsView({ initialApplications }: ApplicationsViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Optimistic applications state for immediate zero-latency feedback
  const [applications, setOptimisticApplications] = useOptimistic(
    initialApplications,
    (state, update: { id: string; count: number }) =>
      state.map((job) =>
        job.id === update.id ? { ...job, interviewCount: update.count } : job
      )
  );
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, boolean>>({});

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [deletingApplication, setDeletingApplication] = useState<JobApplication | null>(null);

  // Status Filter Options with live counts
  const statusOptions: FilterOption[] = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach((job) => {
      counts[job.status] = (counts[job.status] || 0) + 1;
    });

    const definedStatuses = ["applied", "interviewing", "selected", "rejected", "withdrawn"];
    return definedStatuses.map((st) => ({
      value: st,
      label: st,
      count: counts[st] || 0,
    }));
  }, [applications]);

  // Company Filter Options with live counts
  const companyOptions: FilterOption[] = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach((job) => {
      counts[job.company] = (counts[job.company] || 0) + 1;
    });

    return Object.keys(counts)
      .sort((a, b) => a.localeCompare(b))
      .map((comp) => ({
        value: comp,
        label: comp,
        count: counts[comp],
      }));
  }, [applications]);

  // Existing companies and roles for autocompletion
  const existingCompanies = useMemo(() => {
    const set = new Set<string>();
    applications.forEach((job) => {
      if (job.company?.trim()) set.add(job.company.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [applications]);

  const existingRoles = useMemo(() => {
    const set = new Set<string>();
    applications.forEach((job) => {
      if (job.role?.trim()) set.add(job.role.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [applications]);

  // Filtering
  const filteredApplications = useMemo(() => {
    return applications.filter((job) => {
      // Text search in role, company, or notes
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesRole = job.role.toLowerCase().includes(query);
        const matchesCompany = job.company.toLowerCase().includes(query);
        const matchesNotes = job.notes?.toLowerCase().includes(query) ?? false;
        if (!matchesRole && !matchesCompany && !matchesNotes) return false;
      }

      // Status filter
      if (selectedStatuses.length > 0) {
        if (!selectedStatuses.includes(job.status)) return false;
      }

      // Company filter
      if (selectedCompanies.length > 0) {
        if (!selectedCompanies.includes(job.company)) return false;
      }

      return true;
    });
  }, [applications, searchQuery, selectedStatuses, selectedCompanies]);

  const handleUpdateInterviewCount = (id: string, newCount: number) => {
    if (newCount < 0) return;
    const target = applications.find((j) => j.id === id);
    if (!target) return;
    const prevCount = target.interviewCount ?? 0;
    if (newCount === prevCount) return;

    setPendingUpdates((prev) => ({ ...prev, [id]: true }));

    startTransition(async () => {
      setOptimisticApplications({ id, count: newCount });
      try {
        await updateInterviewCountAction(id, newCount);
      } finally {
        setPendingUpdates((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    });
  };

  // Pagination calculation
  const totalItems = filteredApplications.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedApplications = filteredApplications.slice(startIndex, startIndex + pageSize);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedStatuses.length > 0 ||
    selectedCompanies.length > 0;

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleStatusesChange = (statuses: string[]) => {
    setSelectedStatuses(statuses);
    setCurrentPage(1);
  };

  const handleCompaniesChange = (companies: string[]) => {
    setSelectedCompanies(companies);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedStatuses([]);
    setSelectedCompanies([]);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-5">
      {/* Top Header / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Job Applications
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage, filter, and track status for all your applied roles
          </p>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          className="gap-2 w-full sm:w-auto justify-center rounded-xl shadow-xs h-10 px-4"
        >
          <Plus className="size-4" />
          <span>New Application</span>
        </Button>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Main search bar */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by role, company, or notes..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-10 pl-9.5 pr-4 text-sm rounded-xl bg-background w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter 1: Status Filter with checkboxes and search within filter */}
            <MultiFilterPopover
              title="Status"
              options={statusOptions}
              selectedValues={selectedStatuses}
              onSelectedChange={handleStatusesChange}
              searchPlaceholder="Search statuses..."
            />

            {/* Filter 2: Company Filter with checkboxes and search within filter */}
            <MultiFilterPopover
              title="Company"
              options={companyOptions}
              selectedValues={selectedCompanies}
              onSelectedChange={handleCompaniesChange}
              searchPlaceholder="Search companies..."
            />

            {/* Clear Filters button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-xl"
              >
                <RotateCcw className="size-3.5" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/60 text-xs">
            <span className="text-muted-foreground font-semibold text-[11px] mr-1">Active:</span>

            {searchQuery && (
              <Badge variant="secondary" className="gap-1.5 font-normal py-1 px-2.5 rounded-lg">
                Search: &quot;{searchQuery}&quot;
                <button
                  onClick={() => handleSearchChange("")}
                  className="hover:text-destructive cursor-pointer ml-0.5 text-xs font-bold"
                >
                  ×
                </button>
              </Badge>
            )}

            {selectedStatuses.map((st) => (
              <Badge key={st} variant="secondary" className="gap-1.5 font-normal capitalize py-1 px-2.5 rounded-lg">
                Status: {st}
                <button
                  onClick={() =>
                    handleStatusesChange(selectedStatuses.filter((s) => s !== st))
                  }
                  className="hover:text-destructive cursor-pointer ml-0.5 text-xs font-bold"
                >
                  ×
                </button>
              </Badge>
            ))}

            {selectedCompanies.map((comp) => (
              <Badge key={comp} variant="secondary" className="gap-1.5 font-normal py-1 px-2.5 rounded-lg">
                Company: {comp}
                <button
                  onClick={() =>
                    handleCompaniesChange(selectedCompanies.filter((c) => c !== comp))
                  }
                  className="hover:text-destructive cursor-pointer ml-0.5 text-xs font-bold"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Mobile & Tablet Card Grid (< lg) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 lg:hidden">
        {paginatedApplications.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-border bg-card p-8 text-center shadow-xs">
            <div className="flex size-12 mx-auto items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-3">
              <Briefcase className="size-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">No applications found</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              {hasActiveFilters
                ? "Try clearing or adjusting your search filters to see matching job entries."
                : "You haven't added any job applications yet. Tap 'New Application' to get started."}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="mt-3 text-xs rounded-xl"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          paginatedApplications.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3 transition-colors"
            >
              {/* Card Header: Company + Role on left, Status Badge on right */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-secondary/80 text-foreground text-xs font-semibold shrink-0">
                    <Building2 className="size-4.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate block">
                      {job.company}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground truncate block">
                      {job.role}
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={job.status} />
                </div>
              </div>

              {/* Notes if present */}
              {job.notes && (
                <div className="flex items-start gap-1.5 rounded-xl bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <FileText className="size-3.5 shrink-0 mt-0.5 text-muted-foreground/70" />
                  <span className="line-clamp-2 leading-relaxed">{job.notes}</span>
                </div>
              )}

              {/* Meta row: Date applied + Application Link */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                  <span>{job.applicationDate}</span>
                </div>

                {job.link ? (
                  <a
                    href={job.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                  >
                    <span>View Link</span>
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                ) : (
                  <span className="text-[11px] text-muted-foreground/40">No link</span>
                )}
              </div>

              {/* Card Bottom Row: Interviews Stepper on left, Edit/Delete on right */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Interviews:</span>
                  <div className="inline-flex items-center gap-1 rounded-xl border border-input bg-background/50 dark:bg-input/30 p-0.5 shadow-2xs">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7.5 rounded-lg text-muted-foreground hover:text-foreground active:scale-90 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      onClick={() => handleUpdateInterviewCount(job.id, (job.interviewCount ?? 0) - 1)}
                      disabled={(job.interviewCount ?? 0) <= 0 || pendingUpdates[job.id]}
                      title="Decrease interview count"
                      aria-label="Decrease interview count"
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <span className="min-w-[22px] text-center font-bold text-xs tabular-nums text-foreground px-1">
                      {job.interviewCount ?? 0}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7.5 rounded-lg text-muted-foreground hover:text-foreground active:scale-90 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      onClick={() => handleUpdateInterviewCount(job.id, (job.interviewCount ?? 0) + 1)}
                      disabled={pendingUpdates[job.id]}
                      title="Increase interview count"
                      aria-label="Increase interview count"
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 px-2.5 text-xs rounded-xl"
                    onClick={() => setEditingApplication(job)}
                    title="Edit application"
                  >
                    <Edit2 className="size-3" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeletingApplication(job)}
                    title="Delete application"
                    aria-label="Delete application"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table (>= lg) */}
      <div className="hidden lg:block rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="border-b border-border/80 hover:bg-transparent">
                <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider py-3.5 px-3">Company</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider py-3.5 px-3">Role</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider py-3.5 px-2">Status</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider py-3.5 px-2 text-center">Interviews</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider py-3.5 px-2">Date Applied</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground uppercase tracking-wider py-3.5 px-2">Link</TableHead>
                <TableHead className="text-right font-semibold text-xs text-muted-foreground uppercase tracking-wider py-3.5 px-3">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2.5">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
                        <Briefcase className="size-6" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        No applications found
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {hasActiveFilters
                          ? "Try clearing or adjusting your search filters to see matching job entries."
                          : "You haven't added any job applications yet. Click 'New Application' to get started."}
                      </p>
                      {hasActiveFilters && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetFilters}
                          className="mt-2 text-xs rounded-xl"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedApplications.map((job) => (
                  <TableRow key={job.id} className="hover:bg-muted/30 transition-colors border-b border-border/50">
                    {/* Company */}
                    <TableCell className="font-medium py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex size-7.5 items-center justify-center rounded-lg bg-secondary/80 text-foreground text-xs font-semibold shrink-0">
                          <Building2 className="size-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 max-w-[140px] lg:max-w-[200px]">
                          <span className="text-xs font-semibold text-foreground truncate block">
                            {job.company}
                          </span>
                          {job.notes && (
                            <span
                              className="text-[10px] text-muted-foreground truncate block flex items-center gap-1 mt-0.5"
                              title={job.notes}
                            >
                              <FileText className="size-2.5 shrink-0" />
                              {job.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Role */}
                    <TableCell className="py-3.5 px-3">
                      <span className="text-xs font-medium text-foreground truncate block max-w-[130px] lg:max-w-[180px]" title={job.role}>
                        {job.role}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-3.5 px-2 whitespace-nowrap">
                      <StatusBadge status={job.status} />
                    </TableCell>

                    {/* Interviews Stepper */}
                    <TableCell className="py-3.5 px-2 text-center">
                      <div className="inline-flex items-center gap-0.5 rounded-lg border border-input bg-transparent dark:bg-input/30 p-0.5 shadow-2xs">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-6 rounded-md text-muted-foreground hover:text-foreground active:scale-90 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          onClick={() => handleUpdateInterviewCount(job.id, (job.interviewCount ?? 0) - 1)}
                          disabled={(job.interviewCount ?? 0) <= 0 || pendingUpdates[job.id]}
                          title="Decrease interview count"
                          aria-label="Decrease interview count"
                        >
                          <Minus className="size-3" />
                        </Button>
                        <span className="min-w-[18px] text-center font-semibold text-xs tabular-nums text-foreground px-0.5">
                          {job.interviewCount ?? 0}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-6 rounded-md text-muted-foreground hover:text-foreground active:scale-90 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          onClick={() => handleUpdateInterviewCount(job.id, (job.interviewCount ?? 0) + 1)}
                          disabled={pendingUpdates[job.id]}
                          title="Increase interview count"
                          aria-label="Increase interview count"
                        >
                          <Plus className="size-3" />
                        </Button>
                      </div>
                    </TableCell>

                    {/* Date Applied */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap py-3.5 px-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3 text-muted-foreground shrink-0" />
                        <span className="text-[11px]">{job.applicationDate}</span>
                      </div>
                    </TableCell>

                    {/* Application Link Button */}
                    <TableCell className="py-3.5 px-2 whitespace-nowrap">
                      {job.link ? (
                        <a
                          href={job.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-secondary/40 px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-secondary hover:text-primary transition-colors group"
                          title={job.link}
                        >
                          <span>View</span>
                          <ExternalLink className="size-2.5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/40 pl-2">—</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                          onClick={() => setEditingApplication(job)}
                          title="Edit application"
                          aria-label="Edit application"
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeletingApplication(job)}
                          title="Delete application"
                          aria-label="Delete application"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Responsive Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-xs text-xs text-muted-foreground">
        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          <span>
            Showing {totalItems === 0 ? 0 : startIndex + 1}–
            {Math.min(startIndex + pageSize, totalItems)} of {totalItems}
          </span>

          <div className="flex items-center gap-1.5 ml-2 sm:ml-4">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="h-7.5 rounded-lg border border-border bg-background px-2 text-xs text-foreground cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Page navigation */}
        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8.5 px-3 text-xs rounded-xl"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safeCurrentPage <= 1}
          >
            <ChevronLeft className="size-3.5 mr-0.5" />
            Previous
          </Button>

          <span className="px-2 text-xs font-semibold text-foreground">
            Page {safeCurrentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            className="h-8.5 px-3 text-xs rounded-xl"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage >= totalPages}
          >
            Next
            <ChevronRight className="size-3.5 ml-0.5" />
          </Button>
        </div>
      </div>

      {/* Add Dialog */}
      <ApplicationDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        existingCompanies={existingCompanies}
        existingRoles={existingRoles}
        onSuccess={handleRefresh}
      />

      {/* Edit Dialog */}
      <ApplicationDialog
        open={Boolean(editingApplication)}
        onOpenChange={(open) => {
          if (!open) setEditingApplication(null);
        }}
        application={editingApplication}
        existingCompanies={existingCompanies}
        existingRoles={existingRoles}
        onSuccess={handleRefresh}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        open={Boolean(deletingApplication)}
        onOpenChange={(open) => {
          if (!open) setDeletingApplication(null);
        }}
        application={deletingApplication}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
