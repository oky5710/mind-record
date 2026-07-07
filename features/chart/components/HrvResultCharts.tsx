"use client";

import ChartGroup, { type ChartLane } from "./charts/ChartGroup";
import type { ChartSeries } from "./charts/CombinedChart";
import type { ChartDataPoint } from "./charts/types";
import type { HrvRecord } from "@/features/calendar/queries/useHrv";
import type { WearableRecord } from "@/features/calendar/queries/useWearable";
import type { MoodRecord } from "@/features/calendar/queries/useMood";
import type { CoffeeRecord } from "@/features/calendar/queries/useCoffee";

export type HrvChartMetric = "mhr" | "lf" | "hf" | "sdnn" | "tp" | "lfNorm" | "psi";
export type ChartMetric =
  | HrvChartMetric
  | "heartRate"
  | "heartRateVariability"
  | "sleepDuration"
  | "mood"
  | "coffee";

const METRIC_LABELS: Record<ChartMetric, string> = {
  mhr: "MHR",
  heartRate: "평균 심박수",
  lf: "LF",
  hf: "HF",
  sdnn: "SDNN",
  tp: "TP",
  lfNorm: "LF Norm",
  psi: "PSI",
  heartRateVariability: "심박변이",
  sleepDuration: "수면시간",
  mood: "기분",
  coffee: "커피",
};

const BAR_METRICS: HrvChartMetric[] = ["mhr"];
const LINE_METRICS: HrvChartMetric[] = ["lf", "hf", "sdnn", "tp", "lfNorm", "psi"];

const DEFAULT_COLORS: Record<ChartMetric, string> = {
  mhr: "#f97316",
  heartRate: "#ec4899",
  lf: "#3b82f6",
  hf: "#10b981",
  sdnn: "#a855f7",
  tp: "#ef4444",
  lfNorm: "#06b6d4",
  psi: "#eab308",
  heartRateVariability: "#14b8a6",
  sleepDuration: "#6366f1",
  mood: "#f43f5e",
  coffee: "#92400e",
};

interface Props {
  records: HrvRecord[];
  wearableRecords?: WearableRecord[];
  moodRecords?: MoodRecord[];
  coffeeRecords?: CoffeeRecord[];
  colors?: Partial<Record<ChartMetric, string>>;
  onReachStart?: () => void;
}

function toChartData(records: HrvRecord[], metric: HrvChartMetric): ChartDataPoint[] {
  return records
    .filter((r) => r[metric] !== undefined && r[metric] !== null)
    .slice()
    .sort((a, b) => a.examinedAt.localeCompare(b.examinedAt))
    .map((r) => ({ date: r.examinedAt.slice(0, 10), value: r[metric] as number }));
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

export default function HrvResultCharts({
  records,
  wearableRecords = [],
  moodRecords = [],
  coffeeRecords = [],
  colors,
  onReachStart,
}: Props) {
  const resolvedColors = { ...DEFAULT_COLORS, ...colors };

  const combinedSeries: ChartSeries[] = [
    ...BAR_METRICS.map((metric) => ({
      key: metric,
      label: METRIC_LABELS[metric],
      color: resolvedColors[metric],
      type: "bar" as const,
      data: toChartData(records, metric),
    })),
    ...LINE_METRICS.map((metric) => ({
      key: metric,
      label: METRIC_LABELS[metric],
      color: resolvedColors[metric],
      type: "line" as const,
      data: toChartData(records, metric),
    })),
  ];

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

  return <ChartGroup combinedSeries={combinedSeries} lanes={lanes} onReachStart={onReachStart} />;
}
