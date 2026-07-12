"use client";

import { useMemo, useState } from "react";
import Navigation from "@/features/shared/components/Navigation";
import LoadingIndicator from "@/features/shared/components/LoadingIndicator";
import { useHrvList } from "@/features/calendar/queries/useHrv";
import { useWearableList } from "@/features/calendar/queries/useWearable";
import { useMoodList } from "@/features/calendar/queries/useMood";
import { useCoffeeList } from "@/features/calendar/queries/useCoffee";
import HrvResultCharts from "./HrvResultCharts";

const INITIAL_MONTHS = 6;
const LOAD_MORE_MONTHS = 6;

function monthsAgo(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d;
}

export default function ChartPage() {
  const { data: hrvData, isLoading: hrvLoading, error: hrvError } = useHrvList();
  const { data: wearableData, isLoading: wearableLoading, error: wearableError } = useWearableList();
  const { data: moodData, isLoading: moodLoading, error: moodError } = useMoodList();
  const { data: coffeeData, isLoading: coffeeLoading, error: coffeeError } = useCoffeeList();
  const [monthsBack, setMonthsBack] = useState(INITIAL_MONTHS);

  const isLoading = hrvLoading || wearableLoading || moodLoading || coffeeLoading;
  const error = hrvError ?? wearableError ?? moodError ?? coffeeError;

  const cutoff = useMemo(() => monthsAgo(monthsBack), [monthsBack]);

  const recentRecords = (hrvData ?? []).filter((r) => new Date(r.examinedAt) >= cutoff);
  const recentWearableRecords = (wearableData ?? []).filter((r) => new Date(r.date) >= cutoff);
  const recentMoodRecords = (moodData ?? []).filter((r) => new Date(r.date) >= cutoff);
  const recentCoffeeRecords = (coffeeData ?? []).filter((r) => new Date(r.date) >= cutoff);

  const oldestAvailableDate = useMemo(() => {
    const allDates = [
      ...(hrvData ?? []).map((r) => r.examinedAt),
      ...(wearableData ?? []).map((r) => r.date),
      ...(moodData ?? []).map((r) => r.date),
      ...(coffeeData ?? []).map((r) => r.date),
    ];
    return allDates.length === 0 ? null : allDates.reduce((min, d) => (d < min ? d : min));
  }, [hrvData, wearableData, moodData, coffeeData]);

  function handleReachStart() {
    if (oldestAvailableDate && new Date(oldestAvailableDate) >= cutoff) return;
    setMonthsBack((m) => m + LOAD_MORE_MONTHS);
  }

  const hasData =
    recentRecords.length > 0 ||
    recentWearableRecords.length > 0 ||
    recentMoodRecords.length > 0 ||
    recentCoffeeRecords.length > 0;

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <Navigation />
      <div className="flex-1 max-w-md lg:max-w-4xl mx-auto w-full px-4 py-4">
        {isLoading && <LoadingIndicator />}
        {error && (
          <p className="text-sm text-destructive text-center py-10">{error.message}</p>
        )}
        {!isLoading && !error && !hasData && (
          <p className="text-sm text-muted-foreground text-center py-10">
            최근 {monthsBack}개월간 데이터가 없습니다
          </p>
        )}
        {!isLoading && !error && hasData && (
          <HrvResultCharts
            records={recentRecords}
            wearableRecords={recentWearableRecords}
            moodRecords={recentMoodRecords}
            coffeeRecords={recentCoffeeRecords}
            onReachStart={handleReachStart}
          />
        )}
      </div>
    </div>
  );
}
