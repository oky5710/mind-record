import { useQuery } from "@tanstack/react-query";
import { useAuthedFetch } from "@/features/shared/lib/authFetch";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

export type WearableSampleType = "heartRate" | "heartRateVariability";

export interface WearableSampleRecord {
  id: string;
  type: WearableSampleType;
  timestamp: string;
  value: number;
  createdAt: string;
}

export function useWearableSampleList(type: WearableSampleType, from?: string, to?: string) {
  const { authedFetch, token, isReady } = useAuthedFetch();
  return useQuery({
    queryKey: ["wearable-samples", type, from, to],
    queryFn: async (): Promise<WearableSampleRecord[]> => {
      const params = new URLSearchParams({ type });
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await authedFetch(`${BASE_URL}/wearable-samples?${params.toString()}`);
      if (!res.ok) throw new Error("웨어러블 샘플 조회 실패");
      return res.json();
    },
    enabled: isReady && !!token,
  });
}
