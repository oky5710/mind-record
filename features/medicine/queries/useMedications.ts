import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthedFetch } from "@/features/shared/lib/authFetch";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

export type DoseTiming = "MORNING" | "LUNCH" | "DINNER" | "BEDTIME" | "AS_NEEDED";

export const DOSE_TIMING_LABELS: Record<DoseTiming, string> = {
  MORNING: "아침",
  LUNCH: "점심",
  DINNER: "저녁",
  BEDTIME: "취침전",
  AS_NEEDED: "필요시",
};

export interface Medication {
  id: string;
  name: string;
  itemSeq?: string;
  entpName?: string;
  itemImage?: string;
  drugShape?: string;
  colorClass?: string;
  chart?: string;
  timings: DoseTiming[];
}

export interface DrugItem {
  itemSeq: string;
  itemName: string;
  entpName: string;
  efcyQesitm?: string;
  itemImage?: string;
  drugShape?: string;
  colorClass?: string;
  chart?: string;
}

export interface DrugSearchResult {
  totalCount: number;
  items: DrugItem[];
}

export function useMedications() {
  const { authedFetch, token, isReady } = useAuthedFetch();
  return useQuery({
    queryKey: ["medications"],
    queryFn: async (): Promise<Medication[]> => {
      const res = await authedFetch(`${BASE_URL}/medications`);
      if (!res.ok) throw new Error("복약 목록 조회 실패");
      return res.json();
    },
    enabled: isReady && !!token,
  });
}

export function useAddMedication() {
  const { authedFetch } = useAuthedFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      name: string;
      itemSeq?: string;
      entpName?: string;
      itemImage?: string;
      drugShape?: string;
      colorClass?: string;
      chart?: string;
      timings?: string[];
    }) => {
      const res = await authedFetch(`${BASE_URL}/medications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("약 등록 실패");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
    },
  });
}

export function useRemoveMedication() {
  const { authedFetch } = useAuthedFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await authedFetch(`${BASE_URL}/medications/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("약 삭제 실패");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
    },
  });
}

export function useDrugSearch(name: string) {
  const { authedFetch } = useAuthedFetch();
  return useQuery({
    queryKey: ["drug-search", name],
    queryFn: async (): Promise<DrugSearchResult> => {
      const params = new URLSearchParams({ name });
      const res = await authedFetch(`${BASE_URL}/drugs/search?${params}`);
      if (!res.ok) throw new Error("약 검색 실패");
      const data = await res.json();
      // 공공 API는 결과 1건이면 객체, 0건이면 null로 반환하는 경우가 있음
      const raw = data.items;
      const items: DrugItem[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
      return { ...data, items };
    },
    enabled: name.length > 0,
  });
}
