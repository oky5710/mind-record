import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE_URL = "http://localhost:3001";

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

async function fetchCoffees(date?: string): Promise<CoffeeRecord[]> {
  const url = date ? `${BASE_URL}/coffee?date=${date}` : `${BASE_URL}/coffee`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("커피 기록 조회 실패");
  return res.json();
}

export function useCoffeeList(date?: string) {
  return useQuery({
    queryKey: ["coffee", date],
    queryFn: () => fetchCoffees(date),
  });
}

async function createCoffee(payload: CoffeePayload) {
  const res = await fetch(`${BASE_URL}/coffee`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("커피 기록 저장 실패");
  return res.json();
}

export function useCreateCoffee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCoffee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coffee"] });
    },
  });
}
