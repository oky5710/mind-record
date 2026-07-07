import type { ChartDataPoint } from "./types";

function toDateOnlyUTC(dateStr: string) {
  const d = new Date(dateStr);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function buildContinuousDates(dateStrings: string[]): string[] {
  if (dateStrings.length === 0) return [];
  const sorted = dateStrings.slice().sort();
  const start = toDateOnlyUTC(sorted[0]);
  const end = toDateOnlyUTC(sorted[sorted.length - 1]);
  const result: string[] = [];
  for (let d = start; d <= end; d = new Date(d.getTime() + 86_400_000)) {
    result.push(toISODate(d));
  }
  return result;
}

export function collectDates(dataSets: ChartDataPoint[][]): string[] {
  const all: string[] = [];
  dataSets.forEach((data) => data.forEach((d) => all.push(d.date)));
  return buildContinuousDates(all);
}
