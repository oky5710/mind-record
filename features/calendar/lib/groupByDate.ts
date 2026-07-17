import { toLocalDateKey } from "@/features/shared/lib/date";

/** 레코드 목록을 로컬 날짜(YYYY-MM-DD) 기준으로 그룹핑 */
export function groupByLocalDate<T>(records: T[] | undefined, dateOf: (record: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  records?.forEach((r) => {
    const key = toLocalDateKey(dateOf(r));
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  });
  return map;
}

export function dayKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getRecordsForDay<T>(map: Map<string, T[]>, year: number, month: number, day: number): T[] {
  return map.get(dayKey(year, month, day)) ?? [];
}
