"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Filter, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

interface MultiFilterPopoverProps {
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onSelectedChange: (values: string[]) => void;
  searchPlaceholder?: string;
  className?: string;
}

export function MultiFilterPopover({
  title,
  options,
  selectedValues,
  onSelectedChange,
  searchPlaceholder = "Search filter...",
  className,
}: MultiFilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, searchQuery]);

  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelectedChange(selectedValues.filter((v) => v !== value));
    } else {
      onSelectedChange([...selectedValues, value]);
    }
  };

  const handleSelectAll = () => {
    // Select all options matching current filter
    const currentMatchingValues = filteredOptions.map((o) => o.value);
    const combined = Array.from(new Set([...selectedValues, ...currentMatchingValues]));
    onSelectedChange(combined);
  };

  const handleClear = () => {
    // Clear only options matching search query or all if empty
    if (searchQuery.trim()) {
      const matchSet = new Set(filteredOptions.map((o) => o.value));
      onSelectedChange(selectedValues.filter((v) => !matchSet.has(v)));
    } else {
      onSelectedChange([]);
    }
  };

  const isAllFilteredSelected =
    filteredOptions.length > 0 &&
    filteredOptions.every((opt) => selectedValues.includes(opt.value));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "h-9 gap-1.5 font-normal text-xs sm:text-sm rounded-xl border-border bg-background hover:bg-muted/50 cursor-pointer",
              selectedValues.length > 0 && "bg-secondary text-foreground font-medium",
              className
            )}
          >
            <Filter className="size-3.5 text-muted-foreground" />
            <span>{title}</span>
            {selectedValues.length > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[11px] font-semibold">
                {selectedValues.length}
              </Badge>
            )}
            <ChevronDown className="size-3.5 opacity-50 ml-0.5" />
          </Button>
        }
      />

      <PopoverContent className="w-64 p-2 shadow-lg" align="start">
        {/* Search input inside the filter popover */}
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 pr-7 text-xs bg-muted/40"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
              type="button"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Action row (Select All / Clear) */}
        <div className="flex items-center justify-between px-1 py-1 text-xs border-b border-border/80 mb-1 text-muted-foreground">
          <button
            type="button"
            onClick={handleSelectAll}
            className="hover:text-foreground font-medium text-[11px] cursor-pointer"
            disabled={isAllFilteredSelected}
          >
            Select All
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="hover:text-destructive font-medium text-[11px] cursor-pointer"
            disabled={selectedValues.length === 0}
          >
            Clear
          </button>
        </div>

        {/* Scrollable Checkbox list */}
        <div className="max-h-56 overflow-y-auto space-y-0.5 py-1">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No matching {title.toLowerCase()}
            </div>
          ) : (
            filteredOptions.map((option) => {
              const isChecked = selectedValues.includes(option.value);
              return (
                <label
                  key={option.value}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/60 cursor-pointer select-none transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => handleToggle(option.value)}
                    />
                    <span className="truncate capitalize text-foreground font-normal">
                      {option.label}
                    </span>
                  </div>

                  {typeof option.count === "number" && (
                    <span className="text-[11px] text-muted-foreground font-mono shrink-0 pl-1">
                      {option.count}
                    </span>
                  )}
                </label>
              );
            })
          )}
        </div>

        {/* Active counter footer */}
        {selectedValues.length > 0 && (
          <div className="mt-1 border-t border-border/80 pt-1.5 px-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{selectedValues.length} selected</span>
            <button
              type="button"
              onClick={() => onSelectedChange([])}
              className="text-muted-foreground hover:text-foreground text-[11px] underline underline-offset-2"
            >
              Reset
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
