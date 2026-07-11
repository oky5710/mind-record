import { useQuery } from "@tanstack/react-query";

const BASE_URL = "http://localhost:3001";

export type WearableSampleType = "heartRate" | "heartRateVariability";

export interface WearableSampleRecord {
  id: string;
  type: WearableSampleType;
  timestamp: string;
  value: number;
  createdAt: string;
}

async function fetchWearableSamples(
  type: WearableSampleType,
  from?: string,
  to?: string
): Promise<WearableSampleRecord[]> {
  const params = new URLSearchParams({ type });
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const res = await fetch(`${BASE_URL}/wearable-samples?${params.toString()}`);
  if (!res.ok) throw new Error("웨어러블 샘플 조회 실패");
  return res.json();
}

export function useWearableSampleList(type: WearableSampleType, from?: string, to?: string) {
  return useQuery({
    queryKey: ["wearable-samples", type, from, to],
    queryFn: () => fetchWearableSamples(type, from, to),
  });
}
