import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthedFetch } from "@/features/shared/lib/authFetch";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

interface ResourceMessages {
  list: string;
  create: string;
  update: string;
  remove: string;
}

interface CreateResourceQueriesOptions {
  /** API 경로 세그먼트 (예: "coffee", "hrv") */
  path: string;
  /** TanStack Query 캐시 키 (보통 path와 동일) */
  queryKey: string;
  /** 목록 조회가 ?date= 파라미터를 지원하는지 */
  supportsDateFilter?: boolean;
  messages: ResourceMessages;
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  const text = await res.text();
  return text || fallback;
}

/** 로그인 유저 소유 리소스에 대한 list/create/update/remove 훅을 한 번에 생성 */
export function createResourceQueries<TPayload, TRecord, TId = string>({
  path,
  queryKey,
  supportsDateFilter = false,
  messages,
}: CreateResourceQueriesOptions) {
  const resourceUrl = `${BASE_URL}/${path}`;

  function useList(date?: string) {
    const { authedFetch, token, isReady } = useAuthedFetch();
    return useQuery({
      queryKey: supportsDateFilter ? [queryKey, date] : [queryKey],
      queryFn: async (): Promise<TRecord[]> => {
        const url = supportsDateFilter && date ? `${resourceUrl}?date=${date}` : resourceUrl;
        const res = await authedFetch(url);
        if (!res.ok) throw new Error(messages.list);
        return res.json();
      },
      enabled: isReady && !!token,
    });
  }

  function useCreate() {
    const { authedFetch } = useAuthedFetch();
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (payload: TPayload): Promise<TRecord> => {
        const res = await authedFetch(resourceUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await readErrorMessage(res, messages.create));
        return res.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      },
    });
  }

  function useUpdate() {
    const { authedFetch } = useAuthedFetch();
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, payload }: { id: TId; payload: Partial<TPayload> }): Promise<TRecord> => {
        const res = await authedFetch(`${resourceUrl}/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await readErrorMessage(res, messages.update));
        return res.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      },
    });
  }

  function useRemove() {
    const { authedFetch } = useAuthedFetch();
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (id: TId) => {
        const res = await authedFetch(`${resourceUrl}/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(await readErrorMessage(res, messages.remove));
        return res.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      },
    });
  }

  return { useList, useCreate, useUpdate, useRemove };
}
