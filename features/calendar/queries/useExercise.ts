import { useMutation, useQueryClient } from "@tanstack/react-query";

const BASE_URL = "http://localhost:3001";

export interface ExercisePayload {
  date: string;
  type: string;
  durationMinutes: number;
  intensity: number;
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
