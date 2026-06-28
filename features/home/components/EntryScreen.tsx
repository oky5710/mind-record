"use client";

import { useEffect, useState } from "react";
import { comfortMessages } from "@/features/home/constants/message";
import { useCatPhoto } from "@/features/home/queries/useCatPhoto";
import Navigation from "@/features/shared/components/Navigation";
import { useCreateCoffee } from "@/features/calendar/queries/useCoffee";

const ALL_MESSAGES = Object.values(comfortMessages).flat();

export default function EntryScreen() {
  const { data: imageUrl, isError } = useCatPhoto();
  const [message, setMessage] = useState<string | null>(null);
  const { mutate: createCoffee, isPending: coffeePending } = useCreateCoffee();

  function handleQuickCoffee() {
    const now = new Date();
    createCoffee({ date: now.toISOString(), type: "아메리카노" });
  }

  useEffect(() => {
    const all = ALL_MESSAGES;
    setMessage(all[Math.floor(Math.random() * all.length)]);
  }, []);

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-gray-900">
      {/* 배경 이미지 */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt="오늘의 고양이"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* 로딩 중 스켈레톤 */}
      {!imageUrl && !isError && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse" />
      )}

      {/* 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />

      {/* 상단 네비게이션 */}
      <Navigation transparent />

      {/* 간편 입력 */}
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-10 flex flex-col items-center gap-4">
        <div className="flex gap-3">
          <button
            onClick={handleQuickCoffee}
            disabled={coffeePending}
            className="px-5 py-2.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium hover:bg-white/30 active:bg-white/40 transition-colors disabled:opacity-50"
          >
            {coffeePending ? "저장 중..." : "☕ 커피"}
          </button>
          {[{ label: "🏃 운동" }, { label: "😊 기분" }].map(({ label }) => (
            <button
              key={label}
              className="px-5 py-2.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium hover:bg-white/30 active:bg-white/40 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>

        {/* 위로 메시지 */}
        {message && (
          <p className="text-white text-xl font-medium leading-relaxed drop-shadow-lg max-w-xs text-center">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
