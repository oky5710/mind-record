import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthedFetch } from "@/features/shared/lib/authFetch";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

export interface HrvPayload {
  examinedAt: string;
  hospital?: string;
  memo?: string;
  mhr?: number;
  sdnn?: number;
  rmssd?: number;
  psi?: number;
  tp?: number;
  vlf?: number;
  lf?: number;
  hf?: number;
  lfNorm?: number;
  hfNorm?: number;
  lfHfRatio?: number;
  ectopicBeat?: number;
  srd?: number;
  result?: string;
}

export interface HrvRecord extends HrvPayload {
  id: number;
  createdAt: string;
}

export function useHrvList() {
  const { authedFetch, token, isReady } = useAuthedFetch();
  return useQuery({
    queryKey: ["hrv"],
    queryFn: async (): Promise<HrvRecord[]> => {
      const res = await authedFetch(`${BASE_URL}/hrv`);
      if (!res.ok) throw new Error("HRV 목록 조회 실패");
      return res.json();
    },
    enabled: isReady && !!token,
  });
}

export function useCreateHrv() {
  const { authedFetch } = useAuthedFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: HrvPayload) => {
      const res = await authedFetch(`${BASE_URL}/hrv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "HRV 저장에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrv"] });
    },
  });
}

export function useUpdateHrv() {
  const { authedFetch } = useAuthedFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<HrvPayload> }) => {
      const res = await authedFetch(`${BASE_URL}/hrv/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "HRV 수정에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrv"] });
    },
  });
}

export function useRemoveHrv() {
  const { authedFetch } = useAuthedFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await authedFetch(`${BASE_URL}/hrv/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("HRV 삭제에 실패했습니다");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrv"] });
    },
  });
}
