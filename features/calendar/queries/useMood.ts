import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthedFetch } from "@/features/shared/lib/authFetch";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

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

export function useMoodList(date?: string) {
  const { authedFetch, token, isReady } = useAuthedFetch();
  return useQuery({
    queryKey: ["moods", date],
    queryFn: async (): Promise<MoodRecord[]> => {
      const url = date ? `${BASE_URL}/moods?date=${date}` : `${BASE_URL}/moods`;
      const res = await authedFetch(url);
      if (!res.ok) throw new Error("기분 기록 조회 실패");
      return res.json();
    },
    enabled: isReady && !!token,
  });
}

export function useCreateMood() {
  const { authedFetch } = useAuthedFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MoodPayload) => {
      const res = await authedFetch(`${BASE_URL}/moods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 409) throw new Error("오늘 기분은 이미 입력됐어요");
      if (!res.ok) throw new Error("기분 기록 저장 실패");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moods"] });
    },
  });
}
