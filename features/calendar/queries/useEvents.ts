import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthedFetch } from "@/features/shared/lib/authFetch";

const BASE_URL = "http://localhost:3001";

export type EventType =
  | "FRIEND_MEETING" | "CONCERT" | "RELATIONSHIP_STRESS"
  | "CONFLICT" | "EXERCISE" | "HOBBY" | "OTHER";

export type Sentiment = "POSITIVE" | "NEGATIVE" | "NEUTRAL";

export interface EventPayload {
  date: string;
  type: EventType;
  title: string;
  description?: string;
  sentiment: Sentiment;
  intensity: number;
}

export function useCreateEvent() {
  const { authedFetch } = useAuthedFetch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: EventPayload) => {
      const res = await authedFetch(`${BASE_URL}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("이벤트 저장 실패");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
