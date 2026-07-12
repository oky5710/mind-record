"use client";

import { useMemo, useState } from "react";
import Navigation from "@/features/shared/components/Navigation";
import { Input } from "@/components/ui/input";
import { useWearableSampleList } from "@/features/calendar/queries/useWearableSample";
import { useWearableList } from "@/features/calendar/queries/useWearable";
import { useExerciseList } from "@/features/calendar/queries/useExercise";
import { useCoffeeList } from "@/features/calendar/queries/useCoffee";
import { useHrvList } from "@/features/calendar/queries/useHrv";
import { useMoodList } from "@/features/calendar/queries/useMood";
import { useGoogleCalendarEvents } from "@/features/calendar/queries/useGoogleCalendarEvents";
import HrvAnalysisChart from "./HrvAnalysisChart";
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BarChartIcon from '@mui/icons-material/BarChart';

type ViewMode = "day" | "hour" | "month";

export default function HrvAnalysisPage() {
  const { data, isLoading, error } = useWearableSampleList("heartRateVariability");
  const { data: wearableData } = useWearableList();
  const { data: exerciseData } = useExerciseList();
  const { data: coffeeData } = useCoffeeList();
  const { data: hrvExamData } = useHrvList();
  const { data: moodData } = useMoodList();
  const [mode, setMode] = useState<ViewMode>("hour");
  const [jumpDate, setJumpDate] = useState<string | null>(null);

  // 구글 캘린더는 데이터가 많을 수 있어 처음엔 최근 1년치만 불러오고,
  // 차트를 과거 방향 끝까지 스크롤하면 1년씩 더 불러옴. 오늘 이후(미래)는 조회하지 않음
  const [calendarFrom, setCalendarFrom] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  });
  const calendarTo = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const { data: googleCalendarEvents } = useGoogleCalendarEvents(calendarFrom, calendarTo);

  // 무한 확장 방지용 안전 한계 (과거 15년까지만)
  const CALENDAR_MIN_YEAR_OFFSET = 15;

  function handleCalendarScrollNearEdge(direction: "past" | "future") {
    if (direction !== "past") return;
    const now = new Date();
    setCalendarFrom((prev) => {
      const d = new Date(prev);
      if (now.getFullYear() - d.getFullYear() >= CALENDAR_MIN_YEAR_OFFSET) return prev;
      d.setFullYear(d.getFullYear() - 1);
      return d.toISOString().slice(0, 10);
    });
  }

  const sleepRanges = useMemo(
    () =>
      (wearableData ?? [])
        .filter((w) => w.sleepStart && w.sleepEnd)
        .map((w) => ({ start: w.sleepStart!, end: w.sleepEnd! })),
    [wearableData]
  );

  const exerciseRanges = useMemo(
    () =>
      (exerciseData ?? [])
        .filter((e) => e.startedAt && e.endedAt)
        .map((e) => ({ start: e.startedAt!, end: e.endedAt! })),
    [exerciseData]
  );

  const coffeeTimes = useMemo(() => (coffeeData ?? []).map((c) => c.date), [coffeeData]);

  const examTimes = useMemo(() => (hrvExamData ?? []).map((h) => h.examinedAt), [hrvExamData]);

  const moodPoints = useMemo(
    () => (moodData ?? []).map((m) => ({ date: m.date, score: m.score })),
    [moodData]
  );

  const googleCalendarRanges = useMemo(
    () =>
      (googleCalendarEvents ?? []).map((e) => ({
        start: e.start,
        end: e.end,
        status: e.myResponseStatus,
      })),
    [googleCalendarEvents]
  );

  const examSdnnPoints = useMemo(
    () =>
      (hrvExamData ?? [])
        .filter((h) => h.sdnn !== undefined)
        .map((h) => ({ timestamp: h.examinedAt, value: h.sdnn! })),
    [hrvExamData]
  );

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <Navigation />
      <div className="flex-1 max-w-md lg:max-w-4xl mx-auto w-full px-4 py-4">
        <p className="text-sm text-muted-foreground mb-3">
          애플워치로 측정된 심박변이(HRV SDNN)를 약 2시간 간격으로 표시합니다.
        </p>

        <div className="flex justify-between">
          <div className="flex rounded border-blue-500 border-1 overflow-hidden">
          <button
            type="button"
            onClick={() => setMode("day")}
            className={[
              "px-2 transition-colors text-s",
              mode === "day"
                ? "bg-blue-50 text-blue-500"
                : "bg-white hover:bg-muted/70 opacity-20",
            ].join(" ")}
          >
            <CalendarMonthIcon fontSize={'small'}/>
          </button>
            <span className={"border-r-1 border-blue-500"}/>
          <button
            type="button"
            onClick={() => setMode("hour")}
            className={[
              "px-2 transition-colors text-s",
              mode === "hour"
                ? "bg-blue-50 text-blue-500 "
                : "bg-white  hover:bg-muted/70 opacity-20",
            ].join(" ")}
          >
            <QueryBuilderIcon fontSize={'small'}/>
          </button>
            <span className={"border-r-1 border-blue-500"}/>
          <button
            type="button"
            onClick={() => setMode("month")}
            className={[
              "px-2 transition-colors text-s",
              mode === "month"
                ? "bg-blue-50 text-blue-500 "
                : "bg-white  hover:bg-muted/70 opacity-20",
            ].join(" ")}
          >
            <BarChartIcon fontSize={'small'}/>
          </button></div>
          <Input
            type="date"
            lang="ko-KR"
            value={jumpDate ?? ""}
            onChange={(e) => setJumpDate(e.target.value || null)}
            className="w-auto ml-auto "
            aria-label="날짜로 이동"
          />
        </div>

        {isLoading && (
          <p className="text-sm text-muted-foreground text-center py-10">불러오는 중...</p>
        )}
        {error && <p className="text-sm text-destructive text-center py-10">{error.message}</p>}
        {!isLoading && !error && mode === "day" && (
          <HrvAnalysisChart
            data={data ?? []}
            pxPerDay={60}
            tickMode="date"
            jumpToDate={jumpDate}
            dailyMedian
            showPoints
            sleepRanges={sleepRanges}
            exerciseRanges={exerciseRanges}
            googleCalendarRanges={googleCalendarRanges}
            onScrollNearEdge={handleCalendarScrollNearEdge}
            coffeeTimes={coffeeTimes}
            examTimes={examTimes}
            moodData={moodPoints}
            examSdnnPoints={examSdnnPoints}
          />
        )}
        {!isLoading && !error && mode === "hour" && (
          <HrvAnalysisChart
            data={data ?? []}
            pxPerDay={400}
            windowDays={30}
            showPoints
            tickMode="time"
            jumpToDate={jumpDate}
            sleepRanges={sleepRanges}
            exerciseRanges={exerciseRanges}
            googleCalendarRanges={googleCalendarRanges}
            onScrollNearEdge={handleCalendarScrollNearEdge}
            coffeeTimes={coffeeTimes}
            examTimes={examTimes}
            moodData={moodPoints}
            examSdnnPoints={examSdnnPoints}
          />
        )}
        {!isLoading && !error && mode === "month" && (
          <HrvAnalysisChart
            data={data ?? []}
            pxPerDay={1.2}
            tickMode="date"
            jumpToDate={jumpDate}
            monthlyRange
            onMonthClick={(date) => {
              setMode("day");
              setJumpDate(date);
            }}
            sleepRanges={sleepRanges}
            exerciseRanges={exerciseRanges}
            googleCalendarRanges={googleCalendarRanges}
            onScrollNearEdge={handleCalendarScrollNearEdge}
            coffeeTimes={coffeeTimes}
            examTimes={examTimes}
            moodData={moodPoints}
            examSdnnPoints={examSdnnPoints}
          />
        )}
      </div>
    </div>
  );
}
