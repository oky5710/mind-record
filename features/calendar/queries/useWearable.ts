import { useQuery } from "@tanstack/react-query";
import { useAuthedFetch } from "@/features/shared/lib/authFetch";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

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

export function useWearableList() {
  const { authedFetch, token, isReady } = useAuthedFetch();
  return useQuery({
    queryKey: ["wearable"],
    queryFn: async (): Promise<WearableRecord[]> => {
      const res = await authedFetch(`${BASE_URL}/wearable`);
      if (!res.ok) throw new Error("웨어러블 데이터 조회 실패");
      return res.json();
    },
    enabled: isReady && !!token,
  });
}
