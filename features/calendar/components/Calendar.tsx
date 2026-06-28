"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import EntryModal from "./EntryModal";
import BottomSheet from "@/features/shared/components/BottomSheet";
import { useHrvList, type HrvRecord } from "@/features/calendar/queries/useHrv";
import { useExerciseList, type ExerciseRecord } from "@/features/calendar/queries/useExercise";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function HrvDetailSheet({ record, onClose }: { record: HrvRecord; onClose: () => void }) {
  const date = new Date(record.examinedAt);
  const dateLabel = `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`;

  const rows: { label: string; value: number | string | undefined }[] = [
    { label: "MHR", value: record.mhr },
    { label: "SDNN", value: record.sdnn },
    { label: "RMSSD", value: record.rmssd },
    { label: "PSI", value: record.psi },
    { label: "TP", value: record.tp },
    { label: "VLF", value: record.vlf },
    { label: "LF", value: record.lf },
    { label: "HF", value: record.hf },
    { label: "LF Norm", value: record.lfNorm },
    { label: "HF Norm", value: record.hfNorm },
    { label: "LF/HF Ratio", value: record.lfHfRatio },
    { label: "Ectopic Beat", value: record.ectopicBeat },
    { label: "SRD", value: record.srd },
    { label: "결과", value: record.result },
  ];

  return (
    <BottomSheet open onOpenChange={(v) => !v && onClose()} title={`HRV 검사 — ${dateLabel}`}>
      <div className="pt-4 flex flex-col gap-1">
        {record.hospital && (
          <p className="text-xs text-muted-foreground mb-2">병원: {record.hospital}</p>
        )}
        {record.memo && (
          <p className="text-xs text-muted-foreground mb-3">메모: {record.memo}</p>
        )}
        {rows.map(({ label, value }) =>
          value !== undefined && value !== null ? (
            <div key={label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ) : null
        )}
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
          { label: "강도", value: `${record.intensity} (${intensityLabels[record.intensity]})` },
        ].map(({ label, value }) => (
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

  const { data: hrvList } = useHrvList();
  const { data: exerciseList } = useExerciseList();

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

  function getHrvForDay(day: number): HrvRecord[] {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return hrvByDate.get(key) ?? [];
  }

  function getExercisesForDay(day: number): ExerciseRecord[] {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return exerciseByDate.get(key) ?? [];
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
    <div className="w-full max-w-md mx-auto select-none">
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
                      <span
                        className={[
                          "w-6 h-6 flex items-center justify-center rounded-full text-xs mb-1",
                          isToday(day) ? "bg-primary text-primary-foreground font-bold" : "",
                        ].join(" ")}
                      >
                        {day}
                      </span>
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
    </div>
  );
}
