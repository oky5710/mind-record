import { createResourceQueries } from "@/features/shared/lib/createResourceQueries";

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

const eventQueries = createResourceQueries<EventPayload, EventRecord>({
  path: "events",
  queryKey: "events",
  supportsDateFilter: true,
  messages: {
    list: "이벤트 조회 실패",
    create: "이벤트 저장 실패",
    update: "이벤트 수정 실패",
    remove: "이벤트 삭제 실패",
  },
});

export const useEventList = eventQueries.useList;
export const useCreateEvent = eventQueries.useCreate;
export const useUpdateEvent = eventQueries.useUpdate;
export const useRemoveEvent = eventQueries.useRemove;
