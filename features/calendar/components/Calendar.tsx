"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import EntryModal from "./EntryModal";
import BottomSheet from "@/features/shared/components/BottomSheet";
import HrvDetailSheet from "./HrvDetailSheet";
import { useHrvList, type HrvRecord } from "@/features/calendar/queries/useHrv";
import { useExerciseList, type ExerciseRecord } from "@/features/calendar/queries/useExercise";
import { useCoffeeList, type CoffeeRecord } from "@/features/calendar/queries/useCoffee";
import { useMoodList, type MoodRecord } from "@/features/calendar/queries/useMood";
import { MOOD_OPTIONS } from "./forms/MoodForm";

function getMoodOption(score: number) {
  return MOOD_OPTIONS.find((o) => o.score === score);
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function CoffeeDetailSheet({ record, onClose }: { record: CoffeeRecord; onClose: () => void }) {
  const date = new Date(record.date);
  const dateLabel = `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`;
  const timeLabel = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

  return (
    <BottomSheet open onOpenChange={(v) => !v && onClose()} title={`커피 — ${dateLabel}`}>
      <div className="pt-4 flex flex-col gap-1">
        {[
          { label: "종류", value: record.type },
          { label: "시간", value: timeLabel },
          { label: "메모", value: record.memo },
        ]
          .filter(({ value }) => value !== undefined)
          .map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ))}
      </div>
    </BottomSheet>
  );
}

function ExerciseDetailSheet({ record, onClose }: { record: ExerciseRecord; onClose: () => void }) {
  const date = new Date(record.date);
  const dateLabel = `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`;
  const intensityLabels = ["", "매우 쉬움", "쉬움", "보통", "힘듦", "매우 힘듦"];

  return (
    <BottomSheet open onOpenChange={(v) => !v && onClose()} title={`운동 — ${dateLabel}`}>
      <div className="pt-4 flex flex-col gap-1">
        {[
          { label: "종류", value: record.type },
          { label: "시간", value: `${record.durationMinutes}분` },
          record.intensity != null
            ? { label: "강도", value: `${record.intensity} (${intensityLabels[record.intensity]})` }
            : undefined,
        ]
          .filter((row) => row !== undefined)
          .map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium">{value}</span>
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}

export default function Calendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHrv, setSelectedHrv] = useState<HrvRecord | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseRecord | null>(null);
  const [selectedCoffee, setSelectedCoffee] = useState<CoffeeRecord | null>(null);

  const { data: hrvList } = useHrvList();
  const { data: exerciseList } = useExerciseList();
  const { data: coffeeList } = useCoffeeList();
  const { data: moodList } = useMoodList();

  const hrvByDate = useMemo(() => {
    const map = new Map<string, HrvRecord[]>();
    hrvList?.forEach((r) => {
      const key = r.examinedAt.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return map;
  }, [hrvList]);

  const exerciseByDate = useMemo(() => {
    const map = new Map<string, ExerciseRecord[]>();
    exerciseList?.forEach((r) => {
      const key = r.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return map;
  }, [exerciseList]);

  const coffeeByDate = useMemo(() => {
    const map = new Map<string, CoffeeRecord[]>();
    coffeeList?.forEach((r) => {
      const key = r.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return map;
  }, [coffeeList]);

  const moodByDate = useMemo(() => {
    const map = new Map<string, MoodRecord[]>();
    moodList?.forEach((r) => {
      const key = r.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return map;
  }, [moodList]);

  function getHrvForDay(day: number): HrvRecord[] {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return hrvByDate.get(key) ?? [];
  }

  function getExercisesForDay(day: number): ExerciseRecord[] {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return exerciseByDate.get(key) ?? [];
  }

  function getCoffeesForDay(day: number): CoffeeRecord[] {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return coffeeByDate.get(key) ?? [];
  }

  function getMoodsForDay(day: number): MoodRecord[] {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return moodByDate.get(key) ?? [];
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  const lastWeek = weeks[weeks.length - 1];
  while (lastWeek.length < 7) lastWeek.push(null);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  function isToday(day: number) {
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  }

  return (
    <div className="w-full max-w-md lg:max-w-4xl mx-auto select-none">
      <p className="text-sm text-muted-foreground px-4 pt-3">입력하고 싶은 날짜를 선택해주세요!</p>
      <div className="flex items-center justify-between px-4 py-2">
        <Button variant="ghost" size="icon" onClick={prevMonth} aria-label="이전 달">‹</Button>
        <h2 className="text-lg font-semibold">{year}년 {month + 1}월</h2>
        <Button variant="ghost" size="icon" onClick={nextMonth} aria-label="다음 달">›</Button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-t border-border">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={`py-2 text-center text-xs font-medium ${
              i === 0 ? "text-destructive" : i === 6 ? "text-blue-500" : "text-muted-foreground"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="border-t border-border">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-border/50">
            {week.map((day, di) => {
              const hrvRecords = day !== null ? getHrvForDay(day) : [];
              const exerciseRecords = day !== null ? getExercisesForDay(day) : [];
              const coffeeRecords = day !== null ? getCoffeesForDay(day) : [];
              const moodRecords = day !== null ? getMoodsForDay(day) : [];
              return (
                <div
                  key={di}
                  role={day !== null ? "button" : undefined}
                  tabIndex={day !== null ? 0 : undefined}
                  onClick={() => day !== null && setSelectedDate(new Date(year, month, day))}
                  onKeyDown={(e) => e.key === "Enter" && day !== null && setSelectedDate(new Date(year, month, day))}
                  className={[
                    "min-h-20 flex flex-col items-start p-1 text-sm transition-colors",
                    day === null ? "cursor-default" : "cursor-pointer hover:bg-muted/60 active:bg-muted",
                    di === 0 ? "text-destructive" : di === 6 ? "text-blue-500" : "text-foreground",
                  ].join(" ")}
                >
                  {day !== null && (
                    <>
                      <div className="w-full flex items-center justify-between mb-1">
                        <span
                          className={[
                            "w-6 h-6 flex items-center justify-center rounded-full text-xs",
                            isToday(day) ? "bg-primary text-primary-foreground font-bold" : "",
                          ].join(" ")}
                        >
                          {day}
                        </span>
                        {moodRecords.map((r) => (
                          <span key={r.id} className="text-base leading-none" aria-label="기분">
                            {getMoodOption(r.score)?.icon}
                          </span>
                        ))}
                      </div>
                      <div className="w-full flex flex-col gap-0.5">
                        {hrvRecords.map((r) => (
                          <button
                            key={r.id}
                            onClick={(e) => { e.stopPropagation(); setSelectedHrv(r); }}
                            className="w-full text-left px-1 py-0.5 rounded bg-primary/15 hover:bg-primary/25 transition-colors"
                          >
                            <span className="text-[10px] font-medium text-primary leading-tight block truncate">
                              HRV 검사
                            </span>
                          </button>
                        ))}
                        {exerciseRecords.map((r) => (
                          <button
                            key={r.id}
                            onClick={(e) => { e.stopPropagation(); setSelectedExercise(r); }}
                            className="w-full text-left px-1 py-0.5 rounded bg-green-500/15 hover:bg-green-500/25 transition-colors"
                          >
                            <span className="text-[10px] font-medium text-green-600 dark:text-green-400 leading-tight block truncate">
                              {r.type}
                            </span>
                          </button>
                        ))}
                        {coffeeRecords.length > 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedCoffee(coffeeRecords[0]); }}
                            className="w-full text-left px-1 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 transition-colors"
                          >
                            <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400 leading-tight block truncate">
                              커피{coffeeRecords.length > 1 ? ` ×${coffeeRecords.length}` : ""}
                            </span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {selectedDate && (
        <EntryModal date={selectedDate} onClose={() => setSelectedDate(null)} />
      )}

      {selectedHrv && (
        <HrvDetailSheet record={selectedHrv} onClose={() => setSelectedHrv(null)} />
      )}
      {selectedExercise && (
        <ExerciseDetailSheet record={selectedExercise} onClose={() => setSelectedExercise(null)} />
      )}
      {selectedCoffee && (
        <CoffeeDetailSheet record={selectedCoffee} onClose={() => setSelectedCoffee(null)} />
      )}
    </div>
  );
}
