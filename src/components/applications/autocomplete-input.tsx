"use client";

import * as React from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Building2, Briefcase, Check } from "lucide-react";

interface AutocompleteInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  type?: "company" | "role";
}

export function AutocompleteInput({
  id,
  name,
  value,
  onChange,
  suggestions,
  placeholder,
  required,
  className,
  type = "company",
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtered suggestions based on user input (only shown when typing)
  const filteredSuggestions = useMemo(() => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
      return [];
    }

    return suggestions
      .filter((item) => item.toLowerCase().includes(trimmed))
      .sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        // Priority to items that start with query
        const aStarts = aLower.startsWith(trimmed);
        const bStarts = bLower.startsWith(trimmed);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.localeCompare(b);
      })
      .slice(0, 8);
  }, [value, suggestions]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: string) => {
    onChange(item);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (containerRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }

    setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }, 150);

    // If user typed a case-insensitive exact match (e.g. "amex" when "Amex" or "Amex GBT" exists):
    // Auto-normalize casing to existing version to prevent duplicate "amex" vs "Amex" entries.
    const trimmed = value.trim();
    if (trimmed) {
      const exactMatch = suggestions.find(
        (s) => s.toLowerCase() === trimmed.toLowerCase()
      );
      if (exactMatch && exactMatch !== value) {
        onChange(exactMatch);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredSuggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case "Enter":
        if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
          e.preventDefault();
          e.stopPropagation();
          handleSelect(filteredSuggestions[highlightedIndex]);
        }
        break;
      case "Tab":
        if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
          handleSelect(filteredSuggestions[highlightedIndex]);
        } else {
          setIsOpen(false);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const renderHighlightedText = (text: string, query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return <span>{text}</span>;

    const idx = text.toLowerCase().indexOf(trimmed.toLowerCase());
    if (idx === -1) return <span>{text}</span>;

    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + trimmed.length);
    const after = text.slice(idx + trimmed.length);

    return (
      <span className="truncate">
        {before}
        <span className="font-semibold text-primary underline underline-offset-2 decoration-primary/40">
          {match}
        </span>
        {after}
      </span>
    );
  };

  const IconComponent = type === "company" ? Building2 : Briefcase;

  return (
    <div ref={containerRef} className="relative w-full">
      <Input
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          const newVal = e.target.value;
          onChange(newVal);
          if (newVal.trim().length > 0) {
            setIsOpen(true);
            setHighlightedIndex(0);
          } else {
            setIsOpen(false);
            setHighlightedIndex(-1);
          }
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        className={cn("h-9 rounded-xl", className)}
      />

      {isOpen && filteredSuggestions.length > 0 && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-52 overflow-y-auto rounded-xl border border-border bg-popover/95 backdrop-blur-md p-1 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-100"
        >
          <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Existing {type === "company" ? "Companies" : "Roles"}
          </div>
          {filteredSuggestions.map((item, index) => {
            const isHighlighted = index === highlightedIndex;
            const isExactMatch = item.toLowerCase() === value.trim().toLowerCase();

            return (
              <div
                key={item}
                role="option"
                aria-selected={isHighlighted}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => handleSelect(item)}
                className={cn(
                  "flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs rounded-lg cursor-pointer transition-colors select-none",
                  isHighlighted
                    ? "bg-muted text-foreground font-medium"
                    : "text-foreground/90 hover:bg-muted/70"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <IconComponent className="size-3.5 text-muted-foreground shrink-0" />
                  {renderHighlightedText(item, value)}
                </div>

                {isExactMatch && (
                  <span className="flex items-center gap-1 text-[10px] text-primary shrink-0 font-medium">
                    <Check className="size-3 text-primary" />
                    Match
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
