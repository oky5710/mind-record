"use client";

import { useMemo, useState } from "react";
import Navigation from "@/features/shared/components/Navigation";
import { useWearableSampleList } from "@/features/calendar/queries/useWearableSample";
import HrvAnalysisChart from "./HrvAnalysisChart";
import HrvDayChart from "./HrvDayChart";

type ViewMode = "day" | "hour";

export default function HrvAnalysisPage() {
  const { data, isLoading, error } = useWearableSampleList("heartRateVariability");
  const [mode, setMode] = useState<ViewMode>("day");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const availableDates = useMemo(() => {
    const set = new Set<string>();
    (data ?? []).forEach((d) => set.add(d.timestamp.slice(0, 10)));
    return Array.from(set).sort();
  }, [data]);

  const effectiveDate = selectedDate ?? availableDates[availableDates.length - 1] ?? null;

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <Navigation />
      <div className="flex-1 max-w-md mx-auto w-full px-4 py-4">
        <p className="text-sm text-muted-foreground mb-3">
          애플워치로 측정된 심박변이(HRV SDNN)를 약 2시간 간격으로 표시합니다.
        </p>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMode("day")}
            className={[
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              mode === "day"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70",
            ].join(" ")}
          >
            일 단위
          </button>
          <button
            type="button"
            onClick={() => setMode("hour")}
            className={[
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              mode === "hour"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70",
            ].join(" ")}
          >
            시간 단위
          </button>
        </div>

        {isLoading && (
          <p className="text-sm text-muted-foreground text-center py-10">불러오는 중...</p>
        )}
        {error && <p className="text-sm text-destructive text-center py-10">{error.message}</p>}
        {!isLoading && !error && mode === "day" && <HrvAnalysisChart data={data ?? []} />}
        {!isLoading && !error && mode === "hour" && (
          <HrvDayChart
            data={data ?? []}
            availableDates={availableDates}
            selectedDate={effectiveDate}
            onSelectDate={setSelectedDate}
          />
        )}
      </div>
    </div>
  );
}
