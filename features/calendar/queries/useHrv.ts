import { createResourceQueries } from "@/features/shared/lib/createResourceQueries";

export interface HrvPayload {
  examinedAt: string;
  hospital?: string;
  memo?: string;
  mhr?: number;
  sdnn?: number;
  rmssd?: number;
  psi?: number;
  tp?: number;
  vlf?: number;
  lf?: number;
  hf?: number;
  lfNorm?: number;
  hfNorm?: number;
  lfHfRatio?: number;
  ectopicBeat?: number;
  srd?: number;
  result?: string;
}

export interface HrvRecord extends HrvPayload {
  id: number;
  createdAt: string;
}

const hrvQueries = createResourceQueries<HrvPayload, HrvRecord, number>({
  path: "hrv",
  queryKey: "hrv",
  messages: {
    list: "HRV 목록 조회 실패",
    create: "HRV 저장에 실패했습니다",
    update: "HRV 수정에 실패했습니다",
    remove: "HRV 삭제에 실패했습니다",
  },
});

export const useHrvList = hrvQueries.useList;
export const useCreateHrv = hrvQueries.useCreate;
export const useUpdateHrv = hrvQueries.useUpdate;
export const useRemoveHrv = hrvQueries.useRemove;
