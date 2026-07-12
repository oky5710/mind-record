"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6 bg-background px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Mind Profiler</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          정신건강을 기록하는 앱, 로그인하고 시작하세요
        </p>
      </div>
      <Button onClick={() => signIn("google", { callbackUrl: "/" })} size="lg">
        Google로 로그인
      </Button>
    </div>
  );
}
