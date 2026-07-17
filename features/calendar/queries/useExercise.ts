import { createResourceQueries } from "@/features/shared/lib/createResourceQueries";

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

const exerciseQueries = createResourceQueries<ExercisePayload, ExerciseRecord>({
  path: "exercises",
  queryKey: "exercises",
  messages: {
    list: "운동 목록 조회 실패",
    create: "운동 기록 저장 실패",
    update: "운동 기록 수정 실패",
    remove: "운동 기록 삭제 실패",
  },
});

export const useExerciseList = exerciseQueries.useList;
export const useCreateExercise = exerciseQueries.useCreate;
export const useUpdateExercise = exerciseQueries.useUpdate;
export const useRemoveExercise = exerciseQueries.useRemove;
