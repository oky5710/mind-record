"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import EntryModal from "./EntryModal";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function Calendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
  // 마지막 주 7칸 채우기
  const lastWeek = weeks[weeks.length - 1];
  while (lastWeek.length < 7) lastWeek.push(null);

  function prevMonth() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function isToday(day: number) {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  }

  return (
    <div className="w-full max-w-md mx-auto select-none">
      {/* 헤더 */}
      <p>입력하고 싶은 날짜를 선택해주세요!</p>
      <div className="flex items-center justify-between px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevMonth}
          aria-label="이전 달"
        >
          ‹
        </Button>
        <h2 className="text-lg font-semibold">
          {year}년 {month + 1}월
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={nextMonth}
          aria-label="다음 달"
        >
          ›
        </Button>
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
              const colIndex = di;
              return (
                <button
                  key={di}
                  disabled={day === null}
                  onClick={() => day !== null && setSelectedDate(new Date(year, month, day))}
                  className={[
                    "h-14 flex flex-col items-center justify-start pt-1.5 text-sm transition-colors",
                    day === null ? "cursor-default" : "cursor-pointer hover:bg-muted/60 active:bg-muted",
                    isToday(day ?? -1)
                      ? "font-bold"
                      : colIndex === 0
                      ? "text-destructive"
                      : colIndex === 6
                      ? "text-blue-500"
                      : "text-foreground",
                  ].join(" ")}
                >
                  {day !== null && (
                    <span
                      className={[
                        "w-7 h-7 flex items-center justify-center rounded-full text-sm",
                        isToday(day)
                          ? "bg-primary text-primary-foreground font-bold"
                          : "",
                      ].join(" ")}
                    >
                      {day}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* 날짜 클릭 팝업 */}
      {selectedDate && (
        <EntryModal
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
