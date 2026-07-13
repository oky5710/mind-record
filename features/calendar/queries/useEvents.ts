import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthedFetch } from "@/features/shared/lib/authFetch";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

export type EventType = "MEDICATION_CHANGE" | "RELATIONSHIP_ISSUE" | "WORK_STRESS" | "HOSPITAL_VISIT" | "OTHER";

export type Sentiment = "POSITIVE" | "NEGATIVE" | "NEUTRAL";

export interface EventPayload {
  date: string;
  type: EventType;
  title: string;
  description?: string;
  sentiment?: Sentiment;
  intensity?: number;
}

export interface EventRecord extends EventPayload {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export function useEventList(date?: string) {
  const { authedFetch, token, isReady } = useAuthedFetch();
  return useQuery({
    queryKey: ["events", date],
    queryFn: async (): Promise<EventRecord[]> => {
      const url = date ? `${BASE_URL}/events?date=${date}` : `${BASE_URL}/events`;
      const res = await authedFetch(url);
      if (!res.ok) throw new Error("이벤트 조회 실패");
      return res.json();
    },
    enabled: isReady && !!token,
  });
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
