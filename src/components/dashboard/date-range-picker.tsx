"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ranges = [
  { label: "Aujourd'hui", value: "today" },
  { label: "7 jours", value: "week" },
  { label: "30 jours", value: "month" },
  { label: "Trimestre", value: "quarter" },
] as const;

type RangeValue = (typeof ranges)[number]["value"];

interface DateRangePickerProps {
  value: RangeValue;
  onChange: (value: RangeValue) => void;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  return (
    <div className={cn("flex rounded-lg border bg-white overflow-hidden", className)}>
      {ranges.map((r) => (
        <Button
          key={r.value}
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-none border-0 text-xs px-3 h-8",
            value === r.value
              ? "text-white"
              : "text-gray-600 hover:bg-gray-50"
          )}
          style={
            value === r.value ? { backgroundColor: "#1B4332" } : {}
          }
          onClick={() => onChange(r.value)}
        >
          {r.label}
        </Button>
      ))}
    </div>
  );
}

export type { RangeValue };
