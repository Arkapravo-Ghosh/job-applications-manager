"use client";

import { useTransition } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteJobAction } from "@/actions/jobs";
import type { JobApplication } from "@/db/schema";
import { Trash2 } from "lucide-react";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: JobApplication | null;
  onSuccess?: () => void;
}

export function DeleteDialog({
  open,
  onOpenChange,
  application,
  onSuccess,
}: DeleteDialogProps) {
  const [isPending, startTransition] = useTransition();

  if (!application) return null;

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteJobAction(application.id);
      if (res.success) {
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <Trash2 className="size-5" />
            <DialogTitle>Delete Application</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Are you sure you want to remove your application for{" "}
            <span className="font-semibold text-foreground">{application.role}</span> at{" "}
            <span className="font-semibold text-foreground">{application.company}</span>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
