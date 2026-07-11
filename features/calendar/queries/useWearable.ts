import { useQuery } from "@tanstack/react-query";

const BASE_URL = "http://localhost:3001";

export interface WearableRecord {
  id: string;
  date: string;
  sleepDuration?: number;
  sleepStart?: string;
  sleepEnd?: string;
  sleepQuality?: number;
  heartRate?: number;
  heartRateVariability?: number;
  createdAt: string;
}

async function fetchWearableList(): Promise<WearableRecord[]> {
  const res = await fetch(`${BASE_URL}/wearable`);
  if (!res.ok) throw new Error("웨어러블 데이터 조회 실패");
  return res.json();
}

export function useWearableList() {
  return useQuery({
    queryKey: ["wearable"],
    queryFn: fetchWearableList,
  });
}
