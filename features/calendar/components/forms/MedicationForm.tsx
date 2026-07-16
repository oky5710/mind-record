"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const TIMING_OPTIONS: { value: "MORNING" | "BEDTIME" | "AS_NEEDED"; label: string }[] = [
  { value: "MORNING", label: "아침" },
  { value: "BEDTIME", label: "취침" },
  { value: "AS_NEEDED", label: "필요시" },
];

export type MedicationTiming = (typeof TIMING_OPTIONS)[number]["value"];

export interface MedicationFormData {
  timings: MedicationTiming[];
}

interface Props {
  onSubmit: (data: MedicationFormData) => void;
  onCancel: () => void;
  isPending?: boolean;
  error?: string | null;
}

export default function MedicationForm({ onSubmit, onCancel, isPending, error }: Props) {
  const [timings, setTimings] = useState<MedicationTiming[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const timingsError = submitted && timings.length === 0;

  function toggleTiming(value: MedicationTiming) {
    setTimings((prev) => (prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (timings.length === 0) return;
    onSubmit({ timings });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">복용 시간</span>
        <div className="flex flex-col gap-1">
          {TIMING_OPTIONS.map(({ value, label }) => {
            const checked = timings.includes(value);
            return (
              <label
                key={value}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <span
                  className={[
                    "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                    checked ? "bg-primary border-primary" : "border-border bg-card",
                  ].join(" ")}
                >
                  {checked && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="text-sm">{label}</span>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => toggleTiming(value)}
                />
              </label>
            );
          })}
        </div>
        {timingsError && <p className="text-xs text-destructive">하나 이상 선택해주세요.</p>}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? "저장 중..." : "저장"}
        </Button>
      </div>
    </form>
  );
}
