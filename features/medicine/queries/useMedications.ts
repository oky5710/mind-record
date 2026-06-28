import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE_URL = "http://localhost:3001";

export interface Medication {
  id: string;
  name: string;
  itemSeq?: string;
  entpName?: string;
  createdAt: string;
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

async function fetchMedications(): Promise<Medication[]> {
  const res = await fetch(`${BASE_URL}/medications`);
  if (!res.ok) throw new Error("복약 목록 조회 실패");
  return res.json();
}

export function useMedications() {
  return useQuery({
    queryKey: ["medications"],
    queryFn: fetchMedications,
  });
}

async function addMedication(body: { name: string; itemSeq?: string; entpName?: string; itemImage?: string; drugShape?: string; colorClass?: string; chart?: string }) {
  const res = await fetch(`${BASE_URL}/medications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("약 등록 실패");
  return res.json();
}

export function useAddMedication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addMedication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
    },
  });
}

async function removeMedication(id: string) {
  const res = await fetch(`${BASE_URL}/medications/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("약 삭제 실패");
  return res.json();
}

export function useRemoveMedication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeMedication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
    },
  });
}

async function searchDrugs(name: string): Promise<DrugSearchResult> {
  const params = new URLSearchParams({ name });
  const res = await fetch(`${BASE_URL}/drugs/search?${params}`);
  if (!res.ok) throw new Error("약 검색 실패");
  const data = await res.json();
  // 공공 API는 결과 1건이면 객체, 0건이면 null로 반환하는 경우가 있음
  const raw = data.items;
  const items: DrugItem[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return { ...data, items };
}

export function useDrugSearch(name: string) {
  return useQuery({
    queryKey: ["drug-search", name],
    queryFn: () => searchDrugs(name),
    enabled: name.length > 0,
  });
}
