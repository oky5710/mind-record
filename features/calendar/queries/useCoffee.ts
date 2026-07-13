import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthedFetch } from "@/features/shared/lib/authFetch";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

export interface CoffeePayload {
  date: string;
  type?: string;
  memo?: string;
}

export interface CoffeeRecord {
  id: string;
  date: string;
  type?: string;
  memo?: string;
  createdAt: string;
}

export function useCoffeeList(date?: string) {
  const { authedFetch, token, isReady } = useAuthedFetch();
  return useQuery({
    queryKey: ["coffee", date],
    queryFn: async (): Promise<CoffeeRecord[]> => {
      const url = date ? `${BASE_URL}/coffee?date=${date}` : `${BASE_URL}/coffee`;
      const res = await authedFetch(url);
      if (!res.ok) throw new Error("커피 기록 조회 실패");
      return res.json();
    },
    enabled: isReady && !!token,
  });
}

export function useCreateCoffee() {
  const { authedFetch } = useAuthedFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CoffeePayload) => {
      const res = await authedFetch(`${BASE_URL}/coffee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("커피 기록 저장 실패");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coffee"] });
    },
  });
}

export function useUpdateCoffee() {
  const { authedFetch } = useAuthedFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<CoffeePayload> }) => {
      const res = await authedFetch(`${BASE_URL}/coffee/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("커피 기록 수정 실패");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coffee"] });
    },
  });
}

export function useRemoveCoffee() {
  const { authedFetch } = useAuthedFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await authedFetch(`${BASE_URL}/coffee/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("커피 기록 삭제 실패");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coffee"] });
    },
  });
}
