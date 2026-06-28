"use client";

import { useEffect, useState } from "react";
import { comfortMessages } from "@/features/home/constants/message";
import { useCatPhoto } from "@/features/home/queries/useCatPhoto";
import Navigation from "@/features/shared/components/Navigation";

const ALL_MESSAGES = Object.values(comfortMessages).flat();

export default function EntryScreen() {
  const { data: imageUrl, isError } = useCatPhoto();
  const [message, setMessage] = useState<string | null>(null);

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

      {/* 위로 메시지 */}
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-16 flex flex-col items-center text-center">
        {message && (
          <p className="text-white text-xl font-medium leading-relaxed drop-shadow-lg max-w-xs">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
