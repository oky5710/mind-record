"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { comfortMessages } from "@/features/home/constants/message";
import { useCatPhoto } from "@/features/home/queries/useCatPhoto";
import Navigation from "@/features/shared/components/Navigation";
import { useCreateCoffee, useCoffeeList } from "@/features/calendar/queries/useCoffee";
import { useCreateMood, useMoodList } from "@/features/calendar/queries/useMood";
import { useLogMedicationTiming, useMedicationLogList } from "@/features/medicine/queries/useMedications";

const MOOD_OPTIONS = [
  { score: 1, icon: "😞" },
  { score: 2, icon: "😕" },
  { score: 3, icon: "😐" },
  { score: 4, icon: "🙂" },
  { score: 5, icon: "😄" },
];

const ALL_MESSAGES = Object.values(comfortMessages).flat();

const HEART_COUNT = 5;
const HEART_STAGGER_MS = 120;
const HEART_LIFETIME_MS = 1100;
const HEART_X_SPREAD = 30;

interface Heart {
  id: number;
  x: number;
  y: number;
  dx: number;
}

export default function EntryScreen() {
  const { data: imageUrl, isError } = useCatPhoto();
  const [message, setMessage] = useState<string | null>(null);
  const { mutate: createCoffee, isPending: coffeePending } = useCreateCoffee();
  const { mutate: createMood, isPending: moodPending } = useCreateMood();
  const todayStr = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; })();
  const { data: todayMoods } = useMoodList(todayStr);
  const hasTodayMood = (todayMoods?.length ?? 0) > 0;
  const { data: coffeeList } = useCoffeeList();
  const todayCoffeeCount = (coffeeList ?? []).filter((c) => c.date.slice(0, 10) === todayStr).length;
  const { mutate: logMedicationTiming, isPending: medicationPending } = useLogMedicationTiming();
  const { data: todayMedicationLogs } = useMedicationLogList(todayStr);
  const hasMorningTaken = (todayMedicationLogs ?? []).some((l) => l.timing === "MORNING" && l.taken);
  const hasBedtimeTaken = (todayMedicationLogs ?? []).some((l) => l.timing === "BEDTIME" && l.taken);
  const [hearts, setHearts] = useState<Heart[]>([]);
  const nextHeartId = useRef(0);

  function handlePhotoClick(e: MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let i = 0; i < HEART_COUNT; i++) {
      setTimeout(() => {
        const id = nextHeartId.current++;
        const dx = Math.random() * HEART_X_SPREAD * 2 - HEART_X_SPREAD;
        setHearts((prev) => [...prev, { id, x, y, dx }]);
        setTimeout(() => {
          setHearts((prev) => prev.filter((h) => h.id !== id));
        }, HEART_LIFETIME_MS);
      }, i * HEART_STAGGER_MS);
    }
  }

  function handleQuickCoffee() {
    const now = new Date();
    createCoffee({ date: now.toISOString(), type: "아메리카노" });
  }

  function handleQuickMood(score: number) {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    createMood({ date: dateStr, score });
  }

  function handleQuickMedication(timing: "MORNING" | "BEDTIME") {
    logMedicationTiming(timing);
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
          onClick={handlePhotoClick}
          className="absolute inset-0 w-full h-full object-cover cursor-pointer"
        />
      )}

      <p>Track your mind. Find the patterns.</p>

      {/* 로딩 중 스켈레톤 */}
      {!imageUrl && !isError && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse" />
      )}

      {/* 클릭 시 떠오르는 하트 */}
      {hearts.map((h) => (
        <span
          key={h.id}
          aria-hidden
          className="absolute text-2xl pointer-events-none animate-float-up"
          style={{ left: h.x + h.dx, top: h.y }}
        >
          ❤️
        </span>
      ))}

      {/* 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 pointer-events-none" />

      {/* 상단 네비게이션 */}
      <Navigation transparent />

      {/* 간편 입력 */}
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-10 flex flex-col items-center gap-5">
        {/* 기분 선택 */}
        {!hasTodayMood && (
          <div className="flex flex-col items-center gap-2 w-full">
            <p className="text-white/80 text-sm font-medium drop-shadow">오늘 기분은 어땠나요?</p>
            <div className="flex gap-3">
              {MOOD_OPTIONS.map(({ score, icon }) => (
                <button
                  key={score}
                  onClick={() => handleQuickMood(score)}
                  disabled={moodPending}
                  className="text-3xl w-12 h-12 flex items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/35 hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 간편 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={handleQuickCoffee}
            disabled={coffeePending}
            className="relative px-5 py-2.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium hover:bg-white/30 active:bg-white/40 transition-colors disabled:opacity-50"
          >
            {coffeePending ? "저장 중..." : "☕ 커피"}
            {todayCoffeeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold border-1 border-white/50">
                {todayCoffeeCount}
              </span>
            )}
          </button>
          <button
            onClick={() => handleQuickMedication("MORNING")}
            disabled={medicationPending}
            className="relative px-5 py-2.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium hover:bg-white/30 active:bg-white/40 transition-colors disabled:opacity-50"
          >
            🌅 아침
            {hasMorningTaken && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-orange-500 text-white text-[10px] font-bold border-1 border-white/50">
                ✓
              </span>
            )}
          </button>
          <button
            onClick={() => handleQuickMedication("BEDTIME")}
            disabled={medicationPending}
            className="relative px-5 py-2.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium hover:bg-white/30 active:bg-white/40 transition-colors disabled:opacity-50"
          >
            🌙 취침
            {hasBedtimeTaken && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-indigo-500 text-white text-[10px] font-bold border-1 border-white/50">
                ✓
              </span>
            )}
          </button>
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
