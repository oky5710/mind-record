"use client";

import { useMemo, useState } from "react";
import Navigation from "@/features/shared/components/Navigation";
import { Input } from "@/components/ui/input";
import { useWearableSampleList } from "@/features/calendar/queries/useWearableSample";
import { useWearableList } from "@/features/calendar/queries/useWearable";
import { useExerciseList } from "@/features/calendar/queries/useExercise";
import { useCoffeeList } from "@/features/calendar/queries/useCoffee";
import HrvAnalysisChart from "./HrvAnalysisChart";

type ViewMode = "day" | "hour";

export default function HrvAnalysisPage() {
  const { data, isLoading, error } = useWearableSampleList("heartRateVariability");
  const { data: wearableData } = useWearableList();
  const { data: exerciseData } = useExerciseList();
  const { data: coffeeData } = useCoffeeList();
  const [mode, setMode] = useState<ViewMode>("hour");
  const [jumpDate, setJumpDate] = useState<string | null>(null);

  const sleepRanges = useMemo(
    () =>
      (wearableData ?? [])
        .filter((w) => w.sleepStart && w.sleepEnd)
        .map((w) => ({ start: w.sleepStart!, end: w.sleepEnd! })),
    [wearableData]
  );

  const exerciseRanges = useMemo(
    () =>
      (exerciseData ?? [])
        .filter((e) => e.startedAt && e.endedAt)
        .map((e) => ({ start: e.startedAt!, end: e.endedAt! })),
    [exerciseData]
  );

  const coffeeTimes = useMemo(() => (coffeeData ?? []).map((c) => c.date), [coffeeData]);

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
          <Input
            type="date"
            value={jumpDate ?? ""}
            onChange={(e) => setJumpDate(e.target.value || null)}
            className="w-auto ml-auto"
            aria-label="날짜로 이동"
          />
        </div>

        {isLoading && (
          <p className="text-sm text-muted-foreground text-center py-10">불러오는 중...</p>
        )}
        {error && <p className="text-sm text-destructive text-center py-10">{error.message}</p>}
        {!isLoading && !error && mode === "day" && (
          <HrvAnalysisChart
            data={data ?? []}
            pxPerDay={60}
            tickMode="date"
            jumpToDate={jumpDate}
            sleepRanges={sleepRanges}
            exerciseRanges={exerciseRanges}
            coffeeTimes={coffeeTimes}
          />
        )}
        {!isLoading && !error && mode === "hour" && (
          <HrvAnalysisChart
            data={data ?? []}
            pxPerDay={400}
            windowDays={30}
            showPoints
            tickMode="time"
            jumpToDate={jumpDate}
            sleepRanges={sleepRanges}
            exerciseRanges={exerciseRanges}
            coffeeTimes={coffeeTimes}
          />
        )}
      </div>
    </div>
  );
}
