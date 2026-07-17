import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthedFetch } from "@/features/shared/lib/authFetch";
import { createResourceQueries } from "@/features/shared/lib/createResourceQueries";
import { toLocalDateKey } from "@/features/shared/lib/date";

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

export interface MedicationPayload {
  name: string;
  itemSeq?: string;
  entpName?: string;
  itemImage?: string;
  drugShape?: string;
  colorClass?: string;
  chart?: string;
  timings?: string[];
}

export interface MedicationLogRecord {
  id: string;
  medicationId: string;
  date: string;
  timing: DoseTiming | null;
  takenAt: string | null;
  dosage: number | null;
  taken: boolean;
  medication: Medication;
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

// 카탈로그에 PATCH 엔드포인트가 없어(수정 UI 자체가 없음) update는 만들지 않음
const medicationQueries = createResourceQueries<MedicationPayload, Medication>({
  path: "medications",
  queryKey: "medications",
  messages: {
    list: "복약 목록 조회 실패",
    create: "약 등록 실패",
    update: "약 수정 실패",
    remove: "약 삭제 실패",
  },
});

export const useMedications = medicationQueries.useList;
export const useAddMedication = medicationQueries.useCreate;
export const useRemoveMedication = medicationQueries.useRemove;

export function useMedicationLogList(date?: string) {
  const { authedFetch, token, isReady } = useAuthedFetch();
  return useQuery({
    queryKey: ["medication-logs", date],
    queryFn: async (): Promise<MedicationLogRecord[]> => {
      const url = date ? `${BASE_URL}/medications/logs?date=${date}` : `${BASE_URL}/medications/logs`;
      const res = await authedFetch(url);
      if (!res.ok) throw new Error("복용 기록 조회 실패");
      return res.json();
    },
    enabled: isReady && !!token,
  });
}

// 메인 화면 아침/취침 퀵버튼, 캘린더 약복용 입력 — 해당 시간대에 복용하는 약 전부를 한 번에 복용 처리
export function useLogMedicationTiming() {
  const { authedFetch } = useAuthedFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ timing, date }: { timing: DoseTiming; date?: string }) => {
      const res = await authedFetch(`${BASE_URL}/medications/logs/quick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timing, date: date ?? toLocalDateKey(new Date().toISOString()) }),
      });
      if (!res.ok) throw new Error("복용 기록 저장 실패");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medication-logs"] });
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
