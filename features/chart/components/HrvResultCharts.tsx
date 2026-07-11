"use client";

import { useState } from "react";
import ChartGroup, { type ChartLane } from "./charts/ChartGroup";
import type { ExamCircleDatum } from "./charts/ExamCircleRow";
import type { ChartDataPoint } from "./charts/types";
import HrvDetailSheet from "@/features/calendar/components/HrvDetailSheet";
import type { HrvRecord } from "@/features/calendar/queries/useHrv";
import type { WearableRecord } from "@/features/calendar/queries/useWearable";
import type { MoodRecord } from "@/features/calendar/queries/useMood";
import type { CoffeeRecord } from "@/features/calendar/queries/useCoffee";

export type ChartMetric =
  | "heartRate"
  | "heartRateVariability"
  | "sleepDuration"
  | "mood"
  | "coffee"
  | "lfNorm"
  | "hfNorm";

const METRIC_LABELS: Record<ChartMetric, string> = {
  heartRate: "평균 심박수",
  heartRateVariability: "심박변이",
  sleepDuration: "수면시간",
  mood: "기분",
  coffee: "커피",
  lfNorm: "LF Norm",
  hfNorm: "HF Norm",
};

const DEFAULT_COLORS: Record<ChartMetric, string> = {
  heartRate: "#ec4899",
  heartRateVariability: "#14b8a6",
  sleepDuration: "#6366f1",
  mood: "#f43f5e",
  coffee: "#92400e",
  lfNorm: "#ef4444",
  hfNorm: "#3b82f6",
};

interface Props {
  records: HrvRecord[];
  wearableRecords?: WearableRecord[];
  moodRecords?: MoodRecord[];
  coffeeRecords?: CoffeeRecord[];
  colors?: Partial<Record<ChartMetric, string>>;
  onReachStart?: () => void;
}

function toWearableChartData(
  records: WearableRecord[],
  field: "heartRate" | "heartRateVariability" | "sleepDuration"
): ChartDataPoint[] {
  return records
    .filter((r) => r[field] !== undefined && r[field] !== null)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({ date: r.date.slice(0, 10), value: r[field] as number }));
}

function toMoodChartData(records: MoodRecord[]): ChartDataPoint[] {
  return records
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({ date: r.date.slice(0, 10), value: r.score }));
}

function toCoffeeCountChartData(records: CoffeeRecord[]): ChartDataPoint[] {
  const counts = new Map<string, number>();
  records.forEach((r) => {
    const date = r.date.slice(0, 10);
    counts.set(date, (counts.get(date) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}

function toExamCircleData(records: HrvRecord[]): ExamCircleDatum[] {
  return records
    .filter((r) => r.lfNorm !== undefined && r.lfNorm !== null && r.hfNorm !== undefined && r.hfNorm !== null)
    .slice()
    .sort((a, b) => a.examinedAt.localeCompare(b.examinedAt))
    .map((r) => ({ date: r.examinedAt.slice(0, 10), lfNorm: r.lfNorm as number, hfNorm: r.hfNorm as number }));
}

export default function HrvResultCharts({
  records,
  wearableRecords = [],
  moodRecords = [],
  coffeeRecords = [],
  colors,
  onReachStart,
}: Props) {
  const resolvedColors = { ...DEFAULT_COLORS, ...colors };
  const [selectedRecord, setSelectedRecord] = useState<HrvRecord | null>(null);

  const examCircleData = toExamCircleData(records);

  function handleSelectExam(date: string) {
    const record = records.find((r) => r.examinedAt.slice(0, 10) === date) ?? null;
    setSelectedRecord(record);
  }

  const lanes: ChartLane[] = [
    {
      key: "heartRate",
      label: METRIC_LABELS.heartRate,
      color: resolvedColors.heartRate,
      data: toWearableChartData(wearableRecords, "heartRate"),
    },
    {
      key: "heartRateVariability",
      label: METRIC_LABELS.heartRateVariability,
      color: resolvedColors.heartRateVariability,
      data: toWearableChartData(wearableRecords, "heartRateVariability"),
    },
    {
      key: "sleepDuration",
      label: METRIC_LABELS.sleepDuration,
      color: resolvedColors.sleepDuration,
      data: toWearableChartData(wearableRecords, "sleepDuration"),
    },
    {
      key: "mood",
      label: METRIC_LABELS.mood,
      color: resolvedColors.mood,
      data: toMoodChartData(moodRecords),
    },
    {
      key: "coffee",
      label: METRIC_LABELS.coffee,
      color: resolvedColors.coffee,
      data: toCoffeeCountChartData(coffeeRecords),
    },
  ];

  return (
    <>
      <ChartGroup
        examCircleData={examCircleData}
        examColors={{ lfNorm: resolvedColors.lfNorm, hfNorm: resolvedColors.hfNorm }}
        lanes={lanes}
        onReachStart={onReachStart}
        onSelectExam={handleSelectExam}
      />
      {selectedRecord && (
        <HrvDetailSheet record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}
    </>
  );
}
