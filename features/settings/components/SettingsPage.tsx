"use client";

import { useState } from "react";
import Navigation from "@/features/shared/components/Navigation";
import { useAuthedFetch } from "@/features/shared/lib/authFetch";
import { Button } from "@/components/ui/button";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

export default function SettingsPage() {
  const { authedFetch, isReady, token } = useAuthedFetch();
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function issueToken() {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const res = await authedFetch(`${BASE_URL}/auth/device-token`);
      if (!res.ok) throw new Error("토큰 발급에 실패했습니다");
      const data = await res.json();
      setDeviceToken(data.accessToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  async function copyToken() {
    if (!deviceToken) return;
    await navigator.clipboard.writeText(deviceToken);
    setCopied(true);
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <Navigation />
      <div className="flex-1 max-w-md lg:max-w-4xl mx-auto w-full px-4 py-6 flex flex-col gap-4">
        <div>
          <h1 className="text-lg font-bold">자동화(단축어) 토큰</h1>
          <p className="text-sm text-muted-foreground mt-1">
            iOS 단축어에서 서버로 건강 데이터를 보낼 때 쓰는 토큰입니다. 일반
            로그인 토큰과 달리 만료되지 않으니, 단축어의 Authorization
            헤더에 한 번만 넣어두면 계속 쓸 수 있습니다.
          </p>
        </div>

        <Button onClick={issueToken} disabled={!isReady || !token || loading}>
          {loading ? "발급 중..." : "토큰 발급"}
        </Button>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {deviceToken && (
          <div className="flex flex-col gap-2">
            <textarea
              readOnly
              value={deviceToken}
              rows={4}
              className="w-full rounded-md border border-border bg-muted p-2 text-xs font-mono break-all"
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button variant="outline" onClick={copyToken}>
              {copied ? "복사됨" : "복사하기"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
