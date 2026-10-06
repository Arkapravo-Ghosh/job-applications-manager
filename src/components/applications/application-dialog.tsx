"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "./date-picker";
import { AutocompleteInput } from "./autocomplete-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createJobAction, updateJobAction } from "@/actions/jobs";
import { APPLICATION_STATUSES, type JobApplication, type ApplicationStatus } from "@/db/schema";
import { AlertCircle, Briefcase, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application?: JobApplication | null;
  existingCompanies?: string[];
  existingRoles?: string[];
  onSuccess?: () => void;
}

interface ApplicationFormProps {
  application?: JobApplication | null;
  existingCompanies?: string[];
  existingRoles?: string[];
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; dotColor: string }> = {
  applied: { label: "Applied", dotColor: "bg-blue-500" },
  interviewing: { label: "Interviewing", dotColor: "bg-amber-500" },
  selected: { label: "Selected / Offer", dotColor: "bg-emerald-500" },
  rejected: { label: "Rejected", dotColor: "bg-rose-500" },
  withdrawn: { label: "Withdrawn", dotColor: "bg-zinc-500" },
};

function ApplicationForm({
  application,
  existingCompanies = [],
  existingRoles = [],
  onOpenChange,
  onSuccess,
}: ApplicationFormProps) {
  const isEditing = Boolean(application);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const [role, setRole] = useState(application?.role ?? "");
  const [company, setCompany] = useState(application?.company ?? "");
  const [status, setStatus] = useState<ApplicationStatus>(
    (application?.status as ApplicationStatus) ?? "applied"
  );
  const [applicationDate, setApplicationDate] = useState(
    application?.applicationDate ?? today
  );
  const [link, setLink] = useState(application?.link ?? "");
  const [interviewCount, setInterviewCount] = useState(application?.interviewCount ?? 0);
  const [notes, setNotes] = useState(application?.notes ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("role", role);
    formData.append("company", company);
    formData.append("status", status);
    formData.append("applicationDate", applicationDate || today);
    formData.append("link", link);
    formData.append("interviewCount", interviewCount.toString());
    formData.append("notes", notes);

    startTransition(async () => {
      const res = isEditing && application
        ? await updateJobAction(application.id, formData)
        : await createJobAction(formData);

      if (res.error) {
        setError(res.error);
      } else {
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-1">
      <DialogHeader className="text-left space-y-1">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <Briefcase className="size-4.5" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold tracking-tight">
              {isEditing ? "Edit Job Application" : "New Job Application"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isEditing
                ? "Update status, notes, or role details"
                : "Add a new opportunity to your tracking pipeline"}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/15 border border-destructive/20 p-3 text-xs text-destructive font-medium">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Company & Role grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Company <span className="text-destructive">*</span>
          </label>
          <AutocompleteInput
            required
            placeholder="e.g. Stripe, OpenAI"
            value={company}
            onChange={setCompany}
            suggestions={existingCompanies}
            type="company"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Role Title <span className="text-destructive">*</span>
          </label>
          <AutocompleteInput
            required
            placeholder="e.g. Senior Frontend Dev"
            value={role}
            onChange={setRole}
            suggestions={existingRoles}
            type="role"
          />
        </div>
      </div>

      {/* Status & Date row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Current Status</label>
          <Select value={status} onValueChange={(val) => { if (val) setStatus(val as ApplicationStatus); }}>
            <SelectTrigger className="w-full h-9 data-[size=default]:h-9 rounded-xl border-input bg-transparent dark:bg-input/30">
              <SelectValue placeholder="Select status">
                {(val) => {
                  if (!val) return "Select status";
                  const cfg = STATUS_CONFIG[val as ApplicationStatus];
                  if (!cfg) return val;
                  return (
                    <span className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-full", cfg.dotColor)} />
                      <span className="font-medium text-foreground">{cfg.label}</span>
                    </span>
                  );
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-xl border border-border bg-popover">
              {APPLICATION_STATUSES.map((st) => {
                const cfg = STATUS_CONFIG[st];
                return (
                  <SelectItem key={st} value={st} className="rounded-lg cursor-pointer py-1.5 px-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-full", cfg.dotColor)} />
                      <span className="font-medium">{cfg.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Application Date</label>
          <DatePicker
            date={applicationDate}
            onDateChange={setApplicationDate}
          />
        </div>
      </div>

      {/* URL & Interviews Given grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Application URL <span className="text-[11px] font-normal text-muted-foreground">(Optional)</span>
          </label>
          <Input
            type="url"
            placeholder="https://jobs.lever.co/company/role"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="h-9 rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Interviews Given
          </label>
          <div className="flex items-center justify-between h-9 rounded-xl border border-input bg-transparent dark:bg-input/30 px-1.5 shadow-2xs">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg text-muted-foreground hover:text-foreground active:scale-95 transition-all"
              onClick={() => setInterviewCount((c) => Math.max(0, c - 1))}
              disabled={interviewCount <= 0}
              title="Decrease interview count"
            >
              <Minus className="size-3.5" />
            </Button>
            <span className="font-semibold text-sm tabular-nums text-foreground px-2">
              {interviewCount}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg text-muted-foreground hover:text-foreground active:scale-95 transition-all"
              onClick={() => setInterviewCount((c) => c + 1)}
              title="Increase interview count"
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          Notes / Referral Info <span className="text-[11px] font-normal text-muted-foreground">(Optional)</span>
        </label>
        <textarea
          rows={3}
          className="flex w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground shadow-xs placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="e.g. Interview scheduled for Tuesday, referral from Jane Doe..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <DialogFooter className="pt-2 sm:justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-xl px-4"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" className="h-9 rounded-xl px-4" disabled={isPending}>
          {isPending
            ? isEditing
              ? "Saving..."
              : "Adding..."
            : isEditing
            ? "Save Changes"
            : "Add Application"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ApplicationDialog({
  open,
  onOpenChange,
  application,
  existingCompanies = [],
  existingRoles = [],
  onSuccess,
}: ApplicationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6">
        {open && (
          <ApplicationForm
            key={application?.id ?? "new"}
            application={application}
            existingCompanies={existingCompanies}
            existingRoles={existingRoles}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
