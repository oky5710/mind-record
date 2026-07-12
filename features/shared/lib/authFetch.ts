"use client";

import { useSession } from "next-auth/react";

/** 백엔드 API 호출에 로그인 세션의 JWT를 Authorization 헤더로 붙여주는 훅 */
export function useAuthedFetch() {
  const { data: session, status } = useSession();
  const token = session?.backendToken;

  function authedFetch(input: string, init: RequestInit = {}) {
    return fetch(input, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }

  return { authedFetch, token, isReady: status !== "loading" };
}
