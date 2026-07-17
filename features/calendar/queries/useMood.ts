import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthedFetch } from "@/features/shared/lib/authFetch";
import { createResourceQueries } from "@/features/shared/lib/createResourceQueries";

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

const moodQueries = createResourceQueries<MoodPayload, MoodRecord>({
  path: "moods",
  queryKey: "moods",
  supportsDateFilter: true,
  messages: {
    list: "기분 기록 조회 실패",
    create: "기분 기록 저장 실패",
    update: "기분 기록 수정 실패",
    remove: "기분 기록 삭제 실패",
  },
});

export const useMoodList = moodQueries.useList;
export const useUpdateMood = moodQueries.useUpdate;
export const useRemoveMood = moodQueries.useRemove;

// 하루 1건 제약 위반(409) 시 전용 메시지를 보여줘야 해서 팩토리 훅을 그대로 쓰지 않고 감싼다
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
