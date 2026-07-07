import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE_URL = "http://localhost:3001";

export interface MoodPayload {
  date: string;
  score: number;
}

export interface MoodRecord {
  id: string;
  date: string;
  score: number;
  createdAt: string;
}

async function fetchMoods(date?: string): Promise<MoodRecord[]> {
  const url = date ? `${BASE_URL}/moods?date=${date}` : `${BASE_URL}/moods`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("기분 기록 조회 실패");
  return res.json();
}

export function useMoodList(date?: string) {
  return useQuery({
    queryKey: ["moods", date],
    queryFn: () => fetchMoods(date),
  });
}

async function createMood(payload: MoodPayload) {
  const res = await fetch(`${BASE_URL}/moods`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 409) throw new Error("오늘 기분은 이미 입력됐어요");
  if (!res.ok) throw new Error("기분 기록 저장 실패");
  return res.json();
}

export function useCreateMood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMood,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moods"] });
    },
  });
}
