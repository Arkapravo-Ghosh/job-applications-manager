"use client";

import * as React from "react";
import { format, parseISO, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  date?: string;
  onDateChange: (date: string) => void;
  className?: string;
  placeholder?: string;
}

export function DatePicker({
  date,
  onDateChange,
  className,
  placeholder = "Pick application date",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selectedDate = React.useMemo(() => {
    if (!date) return undefined;
    const parsed = parseISO(date);
    if (isValid(parsed)) return parsed;
    const d = new Date(date);
    return isValid(d) ? d : undefined;
  }, [date]);

  const displayString = React.useMemo(() => {
    if (!selectedDate) return "";
    return format(selectedDate, "PPP");
  }, [selectedDate]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal text-sm h-9 rounded-xl border-input bg-transparent dark:bg-input/30 hover:bg-muted/50 transition-colors",
              !selectedDate && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="mr-2 size-4 text-muted-foreground shrink-0" />
            <span className="truncate">
              {displayString || placeholder}
            </span>
          </Button>
        }
      />
      <PopoverContent
        className="w-auto overflow-hidden p-0 rounded-xl shadow-xl border border-border bg-popover"
        align="end"
        sideOffset={6}
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate}
          onSelect={(day) => {
            if (day) {
              onDateChange(format(day, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
          fixedWeeks
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

