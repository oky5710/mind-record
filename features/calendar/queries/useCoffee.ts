import { createResourceQueries } from "@/features/shared/lib/createResourceQueries";

export interface CoffeePayload {
  date: string;
  type?: string;
  memo?: string;
}

export interface CoffeeRecord {
  id: string;
  date: string;
  type?: string;
  memo?: string;
  createdAt: string;
}

const coffeeQueries = createResourceQueries<CoffeePayload, CoffeeRecord>({
  path: "coffee",
  queryKey: "coffee",
  supportsDateFilter: true,
  messages: {
    list: "커피 기록 조회 실패",
    create: "커피 기록 저장 실패",
    update: "커피 기록 수정 실패",
    remove: "커피 기록 삭제 실패",
  },
});

export const useCoffeeList = coffeeQueries.useList;
export const useCreateCoffee = coffeeQueries.useCreate;
export const useUpdateCoffee = coffeeQueries.useUpdate;
export const useRemoveCoffee = coffeeQueries.useRemove;
