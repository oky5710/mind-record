import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE_URL = "http://localhost:3001";

export interface ExercisePayload {
  date: string;
  type: string;
  durationMinutes: number;
  intensity: number;
  startedAt?: string;
  endedAt?: string;
}

export interface ExerciseRecord extends ExercisePayload {
  id: string;
  createdAt: string;
  updatedAt: string;
}

async function fetchExercises(): Promise<ExerciseRecord[]> {
  const res = await fetch(`${BASE_URL}/exercises`);
  if (!res.ok) throw new Error("운동 목록 조회 실패");
  return res.json();
}

export function useExerciseList() {
  return useQuery({
    queryKey: ["exercises"],
    queryFn: fetchExercises,
  });
}

async function createExercise(payload: ExercisePayload) {
  const res = await fetch(`${BASE_URL}/exercises`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("운동 기록 저장 실패");
  return res.json();
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
    },
  });
}
