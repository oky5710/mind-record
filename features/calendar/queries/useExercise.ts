import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthedFetch } from "@/features/shared/lib/authFetch";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

export interface ExercisePayload {
  date: string;
  type: string;
  durationMinutes: number;
  intensity: number;
  startedAt?: string;
  endedAt?: string;
}

export interface ExerciseRecord extends Omit<ExercisePayload, "intensity"> {
  id: string;
  // 단축어 자동화로 들어온 기록은 강도가 없을 수 있음
  intensity: number | null;
  createdAt: string;
  updatedAt: string;
}

export function useExerciseList() {
  const { authedFetch, token, isReady } = useAuthedFetch();
  return useQuery({
    queryKey: ["exercises"],
    queryFn: async (): Promise<ExerciseRecord[]> => {
      const res = await authedFetch(`${BASE_URL}/exercises`);
      if (!res.ok) throw new Error("운동 목록 조회 실패");
      return res.json();
    },
    enabled: isReady && !!token,
  });
}

export function useCreateExercise() {
  const { authedFetch } = useAuthedFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ExercisePayload) => {
      const res = await authedFetch(`${BASE_URL}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("운동 기록 저장 실패");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
    },
  });
}
