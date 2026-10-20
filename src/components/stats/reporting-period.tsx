"use client";

import { useRef, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REPORTING_PERIODS, parseDateOnly, presetRange, rangeLabel, validDateRange, type ReportingRange } from "@/lib/stats-range";

export function ReportingPeriod({ range, today, onChange }: {
  range: ReportingRange; today: string; onChange: (range: ReportingRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [draftFrom, setDraftFrom] = useState(range.from);
  const [draftTo, setDraftTo] = useState(range.to);
  const [month, setMonth] = useState(parseDateOnly(range.from));
  const valid = validDateRange(draftFrom, draftTo);

  function setPickerOpen(next: boolean) {
    if (next) { setDraftFrom(range.from); setDraftTo(range.to); setMonth(parseDateOnly(range.from)); }
    setOpen(next);
  }

  return <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-60">
    <Field>
      <FieldLabel htmlFor="reporting-period">Reporting period</FieldLabel>
      <Select value={range.period} items={REPORTING_PERIODS} onValueChange={(value) => {
        if (!value) return;
        if (value === "custom") setPickerOpen(true);
        else onChange(presetRange(value, today));
      }}>
        <SelectTrigger id="reporting-period" className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>{REPORTING_PERIODS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup>
        </SelectContent>
      </Select>
    </Field>
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs text-muted-foreground" data-testid="reporting-dates">{rangeLabel(range)}</p>
      <Popover open={open} onOpenChange={setPickerOpen}>
        <PopoverTrigger ref={triggerRef} render={<Button variant="outline" size="icon-sm" aria-label="Choose custom date range" />}><CalendarIcon /></PopoverTrigger>
        <PopoverContent finalFocus={triggerRef} align="end" className="max-h-[80dvh] w-auto max-w-[calc(100vw-2rem)] overflow-y-auto" aria-label="Custom date range">
          <p className="font-medium">Custom Date Range</p>
          <FieldGroup>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Field data-invalid={!valid && Boolean(draftFrom && draftTo)}>
                <FieldLabel htmlFor="stats-from">Start date</FieldLabel>
                <Input id="stats-from" type="date" value={draftFrom} className="min-w-0" aria-invalid={!valid && Boolean(draftFrom && draftTo)}
                  onChange={(event) => { setDraftFrom(event.target.value); const date = parseDateOnly(event.target.value); if (date) setMonth(date); }} />
              </Field>
              <Field data-invalid={!valid && Boolean(draftFrom && draftTo)}>
                <FieldLabel htmlFor="stats-to">End date</FieldLabel>
                <Input id="stats-to" type="date" value={draftTo} className="min-w-0" aria-invalid={!valid && Boolean(draftFrom && draftTo)}
                  onChange={(event) => setDraftTo(event.target.value)} />
              </Field>
            </div>
            {!valid && draftFrom && draftTo ? <FieldError>Choose valid dates with the end on or after the start.</FieldError> : null}
          </FieldGroup>
          <Calendar mode="range" numberOfMonths={1} month={month} onMonthChange={setMonth}
            selected={{ from: parseDateOnly(draftFrom), to: parseDateOnly(draftTo) }}
            onSelect={(selection) => {
              setDraftFrom(selection?.from ? format(selection.from, "yyyy-MM-dd") : "");
              setDraftTo(selection?.to ? format(selection.to, "yyyy-MM-dd") : "");
            }} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPickerOpen(false)}>Cancel</Button>
            <Button disabled={!valid} onClick={() => {
              if (!valid) return;
              onChange({ period: "custom", from: draftFrom, to: draftTo });
              setPickerOpen(false);
            }}>Apply</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  </div>;
}
