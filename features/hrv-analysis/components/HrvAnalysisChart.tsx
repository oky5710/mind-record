"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import * as d3 from "d3";
import styled from "styled-components";
import { ChartWrapper, ChartEmptyState } from "@/features/chart/components/charts/ChartLayout";
import SimpleTooltip from "./SimpleTooltip";

export interface HrvSamplePoint {
  timestamp: string;
  value: number;
}

export interface GanttRange {
  start: string;
  end: string;
}

export interface MoodPoint {
  date: string;
  score: number;
}

interface Props {
  data: HrvSamplePoint[];
  pxPerDay?: number;
  height?: number;
  color?: string;
  /** 최근 N일만 보여줌 (시간 단위처럼 확대해서 볼 때 전체 기간을 다 그리면 무거워짐) */
  windowDays?: number;
  /** 개별 측정 지점을 원으로 표시할지 (확대해서 볼 때만 의미 있음) */
  showPoints?: boolean;
  /** "date": MM-dd만 표시. "time": 평소엔 hh:mm, 자정(날짜 경계)엔 MM-dd를 볼드로 */
  tickMode?: "date" | "time";
  /** 값이 바뀔 때마다 해당 날짜가 화면 중앙에 오도록 스크롤 이동 */
  jumpToDate?: string | null;
  /** 같은 시간 축 아래에 수면 구간을 간트 차트로 표시 */
  sleepRanges?: GanttRange[];
  /** 같은 시간 축 아래에 운동 구간을 간트 차트로 표시 */
  exerciseRanges?: GanttRange[];
  /** 같은 시간 축 위에 커피 마신 시각을 이모티콘으로 표시 */
  coffeeTimes?: string[];
  /** 같은 시간 축 위에 검사 받은 시각을 점으로 표시 */
  examTimes?: string[];
  /** 같은 시간 축 아래에 날짜별 기분 점수(1~5)를 하루짜리 사각형으로 표시 */
  moodData?: MoodPoint[];
  /** 검사 결과의 SDNN 값을 검사 시점의 HRV 라인 차트 위에 녹색 세모로 표시 */
  examSdnnPoints?: HrvSamplePoint[];
  /** true면 개별 샘플 대신 하루 중앙값 하나로 묶어서 라인을 그림 (일 단위 개요용) */
  dailyMedian?: boolean;
  /** true면 라인 대신 월별 최소~최대 범위 막대 + 중앙값 선으로 그림 (월 단위 개요용) */
  monthlyRange?: boolean;
  /** 월 단위 막대를 클릭했을 때 해당 월의 시작일(yyyy-MM-dd)을 전달 */
  onMonthClick?: (date: string) => void;
}

type SeriesKind = "line" | "gantt" | "dot" | "mood";

interface SeriesDef {
  key: string;
  label: string;
  color: string;
  kind: SeriesKind;
}

const MARGIN = { top: 16, right: 16, bottom: 28 };
const DRAG_THRESHOLD_PX = 4;
// 워치 미착용 등으로 측정이 비어있던 구간은 선을 잇지 않고 끊어 보이게 함
// (정상 간격은 대체로 2시간 안팎 — 그 몇 배 이상 비면 착용하지 않은 것으로 봄)
const GAP_THRESHOLD_MS = 3 * 60 * 60 * 1000;
const LANE_HEIGHT = 34;

const ScrollContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  cursor: grab;
  scrollbar-width: none;

  &:active {
    cursor: grabbing;
  }

  &::-webkit-scrollbar {
    display: none;
  }
`;

const PlotArea = styled.div`
  position: relative;
`;

// 절대위치(높이 0)로 감싸서 정확한 y좌표에 놓되, 안쪽 라벨은 sticky로
// 가로 스크롤 중에도 항상 왼쪽에 붙어 보이게 함 (y축이 별도 폭을 차지하지 않음)
const YTickRow = styled.div`
  position: absolute;
  left: 0;
  width: 100%;
  height: 0;
`;

const YTickLabel = styled.div`
  position: sticky;
  left: 4px;
  display: inline-block;
  width: fit-content;
  font-size: 10px;
  color: var(--muted-foreground, #71717a);
  pointer-events: none;
  white-space: nowrap;
  transform: translateY(calc(-100% - 4px));
`;

// 간트 레인 제목도 y축 숫자와 같은 방식(sticky)으로 왼쪽에 고정
const LaneLabelRow = styled.div`
  position: absolute;
  left: 0;
  width: 100%;
  height: 0;
`;

const LaneLabel = styled.div`
  position: sticky;
  left: 4px;
  display: inline-block;
  vertical-align: top;
  width: fit-content;
  font-size: 11px;
  font-weight: 600;
  color: var(--foreground, #18181b);
  background: rgba(255, 255, 255, 0.2);
  padding: 1px 4px;
  pointer-events: none;
  white-space: nowrap;
  transform: translateY(-50%);
`;

const LegendRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 10px;
  padding: 0 4px;
`;

const LegendItem = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 500;
  color: var(--foreground, #18181b);
  background: ${(p) => (p.$active ? "var(--muted, #f4f4f5)" : "transparent")};
  border: none;
  border-radius: 999px;
  padding: 3px 10px;
  cursor: pointer;
  opacity: ${(p) => (p.$active ? 1 : 0.45)};

  &:disabled {
    cursor: default;
  }
`;

const LegendDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 999px;
  display: inline-block;
`;

const LegendDash = styled.span`
  width: 14px;
  height: 0;
  border-top: 2px dashed #64748b;
  display: inline-block;
`;

// 이 차트만 x축 색을 공용 AxisGroup보다 진하게 표시
const AxisGroupDark = styled.g`
  font-size: 10px;

  .domain,
  line {
    stroke: #52525b;
  }

  text {
    fill: #3f3f46;
  }
`;

function formatYmd(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function formatYmdHm(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${formatYmd(d)} ${hh}:${mi}`;
}

function formatTimeOfDay(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function HrvAnalysisChart({
  data,
  pxPerDay = 60,
  height = 260,
  color = "#14b8a6",
  windowDays,
  showPoints = false,
  tickMode = "date",
  jumpToDate,
  sleepRanges,
  exerciseRanges,
  coffeeTimes,
  examTimes,
  moodData,
  examSdnnPoints,
  dailyMedian = false,
  monthlyRange = false,
  onMonthClick,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startScrollLeft: number;
    pointerId: number;
    dragging: boolean;
  } | null>(null);
  const hasInitScrolled = useRef(false);
  const topAxisRef = useRef<SVGGElement>(null);
  const bottomAxisRef = useRef<SVGGElement>(null);
  const gradientId = useId().replace(/:/g, "");
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: Date; value: number } | null>(
    null
  );
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

  function toggleSeries(key: string) {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  const seriesDefs = useMemo(() => {
    const list: SeriesDef[] = [{ key: "hrv", label: "심박변이", color, kind: "line" }];
    if (sleepRanges) list.push({ key: "sleep", label: "수면", color: "#6366f1", kind: "gantt" });
    if (exerciseRanges) list.push({ key: "exercise", label: "운동", color: "#f97316", kind: "gantt" });
    if (coffeeTimes) list.push({ key: "coffee", label: "커피", color: "#92400e", kind: "dot" });
    if (examTimes) list.push({ key: "exam", label: "검사", color: "#dc2626", kind: "dot" });
    if (moodData) list.push({ key: "mood", label: "기분", color: "#f59e0b", kind: "mood" });
    return list;
  }, [color, sleepRanges, exerciseRanges, coffeeTimes, examTimes, moodData]);

  const moodColorScale = useMemo(
    () => d3.scaleLinear<string>().domain([1, 3, 5]).range(["#ef4444", "#f59e0b", "#22c55e"]).clamp(true),
    []
  );

  const showHrv = !hiddenKeys.has("hrv");

  const lanes = useMemo(() => {
    const visible = seriesDefs.filter((s) => s.kind !== "line" && !hiddenKeys.has(s.key));
    let cursor = showHrv ? innerHeight : 0;
    return visible.map((s) => {
      const y = cursor;
      cursor += LANE_HEIGHT;
      return {
        ...s,
        y,
        ranges: s.key === "sleep" ? sleepRanges ?? [] : s.key === "exercise" ? exerciseRanges ?? [] : [],
        times: s.key === "coffee" ? coffeeTimes ?? [] : s.key === "exam" ? examTimes ?? [] : [],
        moodPoints: s.key === "mood" ? moodData ?? [] : [],
      };
    });
  }, [
    seriesDefs,
    hiddenKeys,
    showHrv,
    innerHeight,
    sleepRanges,
    exerciseRanges,
    coffeeTimes,
    examTimes,
    moodData,
  ]);

  const ganttAreaHeight = lanes.length * LANE_HEIGHT;
  const hrvBlockHeight = showHrv ? innerHeight : 0;
  const axisY = hrvBlockHeight + ganttAreaHeight;
  const totalHeight = MARGIN.top + hrvBlockHeight + ganttAreaHeight + MARGIN.bottom;

  // 수면/운동/커피/검사가 HRV 측정 기간보다 최근일 수 있으므로, 모든 시리즈를
  // 합친 타임스탬프를 기준으로 시간 축(도메인)을 잡아야 최신 데이터가 함께 보임
  const allTimestamps = useMemo(() => {
    const arr: number[] = data.map((d) => new Date(d.timestamp).getTime());
    (sleepRanges ?? []).forEach((r) => {
      arr.push(new Date(r.start).getTime(), new Date(r.end).getTime());
    });
    (exerciseRanges ?? []).forEach((r) => {
      arr.push(new Date(r.start).getTime(), new Date(r.end).getTime());
    });
    (coffeeTimes ?? []).forEach((t) => arr.push(new Date(t).getTime()));
    (examTimes ?? []).forEach((t) => arr.push(new Date(t).getTime()));
    (moodData ?? []).forEach((m) => arr.push(new Date(`${m.date.slice(0, 10)}T00:00:00`).getTime()));
    return arr.filter((t) => !isNaN(t)).sort((a, b) => a - b);
  }, [data, sleepRanges, exerciseRanges, coffeeTimes, examTimes, moodData]);

  const [minDate, maxDate] = useMemo(() => {
    if (allTimestamps.length === 0) {
      const now = new Date();
      return [now, now];
    }
    const overallMin = allTimestamps[0];
    const overallMax = allTimestamps[allTimestamps.length - 1];
    if (!windowDays) return [new Date(overallMin), new Date(overallMax)];
    // 특정 날짜로 이동한 경우, 그 날짜를 기준으로 앞뒤 절반씩 보여줌
    // (기본은 전체 시리즈 중 가장 최근 데이터 기준으로 최근 N일만)
    if (jumpToDate) {
      const anchor = new Date(`${jumpToDate}T00:00:00`).getTime();
      const half = (windowDays / 2) * 86_400_000;
      return [new Date(anchor - half), new Date(anchor + half)];
    }
    return [new Date(overallMax - windowDays * 86_400_000), new Date(overallMax)];
  }, [allTimestamps, windowDays, jumpToDate]);

  const points = useMemo(() => {
    const minT = minDate.getTime();
    const maxT = maxDate.getTime();
    const filtered = data
      .map((d) => ({ date: new Date(d.timestamp), value: d.value }))
      .filter((p) => p.date.getTime() >= minT && p.date.getTime() <= maxT)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (!dailyMedian) return filtered;

    // 하루 단위로 묶어 중앙값 하나로 대표 (날짜 시작 시각에 위치)
    const dayMap = new Map<number, number[]>();
    filtered.forEach((p) => {
      const dayStart = new Date(p.date.getFullYear(), p.date.getMonth(), p.date.getDate()).getTime();
      const values = dayMap.get(dayStart) ?? [];
      values.push(p.value);
      dayMap.set(dayStart, values);
    });
    return Array.from(dayMap.entries())
      .map(([dayStart, values]) => ({ date: new Date(dayStart), value: d3.median(values) ?? 0 }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [data, minDate, maxDate, dailyMedian]);

  // 월 단위: 월별 최소/최대/중앙값 통계 (막대 + 중앙값 선으로 표시)
  const monthlyStats = useMemo(() => {
    if (!monthlyRange) return [];
    const minT = minDate.getTime();
    const maxT = maxDate.getTime();
    const filtered = data
      .map((d) => ({ date: new Date(d.timestamp), value: d.value }))
      .filter((p) => p.date.getTime() >= minT && p.date.getTime() <= maxT);

    const monthMap = new Map<string, number[]>();
    filtered.forEach((p) => {
      const key = `${p.date.getFullYear()}-${p.date.getMonth()}`;
      const values = monthMap.get(key) ?? [];
      values.push(p.value);
      monthMap.set(key, values);
    });

    return Array.from(monthMap.entries())
      .map(([key, values]) => {
        const [y, m] = key.split("-").map(Number);
        const sorted = [...values].sort((a, b) => a - b);
        return {
          monthStart: new Date(y, m, 1),
          monthEnd: new Date(y, m + 1, 1),
          min: sorted[0],
          max: sorted[sorted.length - 1],
          median: d3.median(sorted) ?? 0,
        };
      })
      .sort((a, b) => a.monthStart.getTime() - b.monthStart.getTime());
  }, [data, minDate, maxDate, monthlyRange]);

  const totalDays = Math.max(1, (maxDate.getTime() - minDate.getTime()) / 86_400_000);
  const innerWidth = Math.max(300, totalDays * pxPerDay);
  const scrollableWidth = innerWidth + MARGIN.right;

  const xScale = useMemo(
    () => d3.scaleTime().domain([minDate, maxDate]).range([0, innerWidth]),
    [minDate, maxDate, innerWidth]
  );

  const yScale = useMemo(() => {
    const max = monthlyRange
      ? d3.max(monthlyStats, (m) => m.max) ?? 0
      : d3.max(points, (p) => p.value) ?? 0;
    return d3.scaleLinear().domain([0, max]).nice().range([innerHeight, 0]);
  }, [points, monthlyStats, monthlyRange, innerHeight]);

  // 일 중앙값 모드는 점 사이 간격이 원래 하루(약 86_400_000ms)이므로 그에 맞는 기준으로 끊어짐을 판단
  const gapThresholdMs = dailyMedian ? 1.5 * 86_400_000 : GAP_THRESHOLD_MS;

  const lineGenerator = useMemo(
    () =>
      d3
        .line<{ date: Date; value: number }>()
        .x((p) => xScale(p.date))
        .y((p) => yScale(p.value))
        .defined((p, i, arr) => i === 0 || p.date.getTime() - arr[i - 1].date.getTime() <= gapThresholdMs),
    [xScale, yScale, gapThresholdMs]
  );

  const areaGenerator = useMemo(
    () =>
      d3
        .area<{ date: Date; value: number }>()
        .x((p) => xScale(p.date))
        .y0(innerHeight)
        .y1((p) => yScale(p.value))
        .defined((p, i, arr) => i === 0 || p.date.getTime() - arr[i - 1].date.getTime() <= gapThresholdMs),
    [xScale, yScale, innerHeight, gapThresholdMs]
  );

  const bisectDate = useMemo(() => d3.bisector((p: { date: Date }) => p.date).left, []);

  useEffect(() => {
    const formatTick =
      tickMode === "time"
        ? (d: Date) => (d3.timeDay(d).getTime() === d.getTime() ? d3.timeFormat("%m-%d")(d) : formatTimeOfDay(d))
        : monthlyRange
          ? (d: Date) => (d3.timeYear(d).getTime() === d.getTime() ? d3.timeFormat("%Y")(d) : d3.timeFormat("%m-%d")(d))
          : (d: Date) => d3.timeFormat("%m-%d")(d);

    // HRV 라인차트 안쪽(top, 간트 차트와 붙도록 라벨을 안으로 당김) + 전체 레인들 아래(bottom)
    const configs = [
      { el: topAxisRef.current, inset: true },
      { el: bottomAxisRef.current, inset: false },
    ];
    configs.forEach(({ el: axisEl, inset }) => {
      if (!axisEl) return;
      const sel = d3.select(axisEl).call(
        d3
          .axisBottom(xScale)
          .ticks(Math.max(3, Math.round(innerWidth / 70)))
          .tickFormat((d) => formatTick(d as Date))
          .tickSize(inset ? 0 : 6)
          .tickPadding(inset ? 3 : 8)
      );

      const texts = sel.selectAll<SVGTextElement, Date>(".tick text");
      const n = texts.size();
      // 자정(날짜 경계) 눈금은 볼드로, 맨 앞/뒤 눈금은 캔버스 밖으로 잘리지
      // 않도록 정렬 기준을 안쪽으로 붙임
      const items: { node: SVGTextElement; isBoundary: boolean; left: number; right: number }[] = [];
      texts.each(function (d, i) {
        const isBoundary =
          tickMode === "time"
            ? d3.timeDay(d).getTime() === d.getTime()
            : monthlyRange && d3.timeYear(d).getTime() === d.getTime();
        const textSel = d3
          .select(this)
          .style("font-weight", isBoundary ? "700" : "400")
          .style("text-anchor", i === 0 ? "start" : i === n - 1 ? "end" : "middle")
          .style("display", "");
        // outside(bottom) 축은 tickPadding으로 이미 간격이 반영되어 있으므로 건드리지 않음
        if (inset) textSel.attr("y", -14);
        // getBBox()는 이 <text>가 속한 .tick <g transform="translate(x,0)">의
        // 로컬 좌표를 반환하므로, 실제 틱 위치(xScale(d))를 더해 절대 좌표로 변환
        const tickX = xScale(d);
        const box = this.getBBox();
        items.push({ node: this, isBoundary, left: tickX + box.x, right: tickX + box.x + box.width });
      });

      // 겹치는 라벨은 자연스럽게 생략 (날짜 경계 라벨은 항상 유지)
      const LABEL_PADDING = 6;
      const boundaryLefts = items.filter((it) => it.isBoundary).map((it) => it.left);
      let lastVisibleRight: number | null = null;
      items.forEach((item) => {
        if (item.isBoundary) {
          d3.select(item.node).style("display", "");
          lastVisibleRight = item.right;
          return;
        }
        const overlapsPrev = lastVisibleRight !== null && item.left < lastVisibleRight + LABEL_PADDING;
        const nextBoundaryLeft = boundaryLefts.find((left) => left > item.left);
        const overlapsNextBoundary =
          nextBoundaryLeft !== undefined && item.right + LABEL_PADDING > nextBoundaryLeft;
        const shouldHide = overlapsPrev || overlapsNextBoundary;
        d3.select(item.node).style("display", shouldHide ? "none" : "");
        if (!shouldHide) lastVisibleRight = item.right;
      });
    });
  }, [xScale, innerWidth, tickMode, showHrv, axisY, monthlyRange]);

  const yTicks = useMemo(() => yScale.ticks(5), [yScale]);

  // 전체 데이터 중 가장 최근 시점 기준 최근 30일 중앙값 (현재 확대/스크롤 범위와 무관)
  const recentAvg = useMemo(() => {
    if (data.length === 0) return null;
    const sorted = data
      .map((d) => ({ date: new Date(d.timestamp), value: d.value }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    const latest = sorted[sorted.length - 1].date.getTime();
    const cutoff = latest - 30 * 86_400_000;
    const recent = sorted.filter((p) => p.date.getTime() >= cutoff);
    if (recent.length === 0) return null;
    return d3.median(recent, (p) => p.value) ?? null;
  }, [data]);

  // 날짜(또는 월 단위일 땐 월) 경계마다 세로 실선 그리드를 그려 라인/간트 레인이 서로 정렬돼 보이게 함
  const dayGridlines = useMemo(() => {
    if (monthlyRange) return d3.timeMonth.range(d3.timeMonth.floor(minDate), maxDate);
    return d3.timeDay.range(d3.timeDay.floor(minDate), maxDate);
  }, [minDate, maxDate, monthlyRange]);

  // 처음 로드되면 가장 최근 데이터가 보이도록 오른쪽 끝으로 스크롤
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || hasInitScrolled.current || allTimestamps.length === 0) return;
    el.scrollLeft = el.scrollWidth - el.clientWidth;
    hasInitScrolled.current = true;
  }, [allTimestamps, innerWidth]);

  // 날짜를 입력받으면 해당 날짜가 화면 왼쪽 시작 지점에 오도록 스크롤 이동
  useLayoutEffect(() => {
    if (!jumpToDate) return;
    const el = scrollRef.current;
    if (!el) return;
    const targetX = xScale(new Date(`${jumpToDate}T00:00:00`));
    el.scrollLeft = Math.max(0, targetX - 16);
  }, [jumpToDate, xScale]);

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const el = scrollRef.current;
    if (!el) return;
    dragRef.current = {
      startX: e.clientX,
      startScrollLeft: el.scrollLeft,
      pointerId: e.pointerId,
      dragging: false,
    };
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const dx = e.clientX - dragRef.current.startX;
    if (!dragRef.current.dragging) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
      dragRef.current.dragging = true;
      el.setPointerCapture(dragRef.current.pointerId);
    }
    el.scrollLeft = dragRef.current.startScrollLeft - dx;
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function updateTooltipAt(svg: SVGSVGElement, clientX: number, clientY: number) {
    const rect = svg.getBoundingClientRect();
    const xPos = clientX - rect.left;
    const date = xScale.invert(xPos);
    const i = bisectDate(points, date);
    const p = points[Math.min(i, points.length - 1)];
    if (!p) return;
    setTooltip({ x: clientX, y: clientY, date: p.date, value: p.value });
  }

  function handleHoverMove(e: ReactPointerEvent<SVGRectElement>) {
    if (e.pointerType !== "mouse") return;
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    updateTooltipAt(svg, e.clientX, e.clientY);
  }

  function handleHoverLeave(e: ReactPointerEvent) {
    if (e.pointerType === "mouse") setTooltip(null);
  }

  function handleHoverClick(e: ReactMouseEvent<SVGRectElement>) {
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    updateTooltipAt(svg, e.clientX, e.clientY);
  }

  if (allTimestamps.length === 0) {
    return <ChartEmptyState>데이터가 없습니다</ChartEmptyState>;
  }

  return (
    <ChartWrapper>
      <ScrollContainer
        ref={scrollRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onScroll={() => setTooltip(null)}
      >
        <PlotArea style={{ width: scrollableWidth, height: totalHeight }}>
          {showHrv &&
            yTicks.map((t) => (
              <YTickRow key={t} style={{ top: MARGIN.top + yScale(t) }}>
                <YTickLabel>{t}</YTickLabel>
              </YTickRow>
            ))}
          {lanes.map((lane) => (
            <LaneLabelRow key={lane.key} style={{ top: MARGIN.top + lane.y + LANE_HEIGHT / 2 }}>
              <LaneLabel>{lane.label}</LaneLabel>
            </LaneLabelRow>
          ))}
          <svg width={scrollableWidth} height={totalHeight} style={{ display: "block" }}>
            <g transform={`translate(0, ${MARGIN.top})`}>
              {dayGridlines.map((d, i) => (
                <line key={i} x1={xScale(d)} x2={xScale(d)} y1={0} y2={axisY} stroke="#e4e4e7" />
              ))}
              {showHrv && (
                <>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2={innerHeight} gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  {yTicks.map((t) => (
                    <line key={t} x1={0} x2={innerWidth} y1={yScale(t)} y2={yScale(t)} stroke="#e4e4e7" />
                  ))}
                  {monthlyRange ? (
                    monthlyStats.map((m, i) => {
                      const x1 = xScale(m.monthStart);
                      const x2 = xScale(m.monthEnd);
                      const fullW = x2 - x1;
                      const barW = fullW * 0.4;
                      const barX = x1 + (fullW - barW) / 2;
                      const yTop = yScale(m.max);
                      const yBottom = yScale(m.min);
                      const h = Math.max(1, yBottom - yTop);
                      const yMed = yScale(m.median);
                      return (
                        <g
                          key={i}
                          style={{ cursor: onMonthClick ? "pointer" : undefined }}
                          onClick={() => onMonthClick?.(formatYmd(m.monthStart))}
                        >
                          <rect
                            x={barX - 2}
                            y={0}
                            width={barW + 4}
                            height={innerHeight}
                            fill="transparent"
                          />
                          <rect x={barX} y={yTop} width={barW} height={h} rx={6} fill={color} opacity={0.35} />
                          <line
                            x1={barX}
                            x2={barX + barW}
                            y1={yMed}
                            y2={yMed}
                            stroke={color}
                            strokeWidth={3}
                          />
                        </g>
                      );
                    })
                  ) : (
                    <>
                      <path d={areaGenerator(points) ?? undefined} fill={`url(#${gradientId})`} stroke="none" />
                      <path d={lineGenerator(points) ?? undefined} fill="none" stroke={color} strokeWidth={1.5} />
                      {showPoints &&
                        points.map((p, i) => {
                          const isLow = recentAvg !== null && p.value < recentAvg * 0.25;
                          return (
                            <circle
                              key={i}
                              cx={xScale(p.date)}
                              cy={yScale(p.value)}
                              r={4}
                              fill="#fff"
                              stroke={isLow ? "#ef4444" : color}
                              strokeWidth={1.5}
                            />
                          );
                        })}
                    </>
                  )}
                  {recentAvg !== null && (
                    <line
                      x1={0}
                      x2={innerWidth}
                      y1={yScale(recentAvg)}
                      y2={yScale(recentAvg)}
                      stroke="#64748b"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                  )}
                  {(examSdnnPoints ?? []).map((p, i) => {
                    const d = new Date(p.timestamp);
                    if (isNaN(d.getTime())) return null;
                    const x = xScale(d);
                    if (x < 0 || x > innerWidth) return null;
                    const y = yScale(p.value);
                    const s = 5;
                    return (
                      <polygon
                        key={i}
                        points={`${x},${y - s} ${x - s},${y + s} ${x + s},${y + s}`}
                        fill="#22c55e"
                      />
                    );
                  })}
                  {!monthlyRange && (
                    <rect
                      x={0}
                      y={0}
                      width={innerWidth}
                      height={innerHeight}
                      fill="transparent"
                      onPointerMove={handleHoverMove}
                      onPointerLeave={handleHoverLeave}
                      onClick={handleHoverClick}
                    />
                  )}
                  {tooltip !== null && (
                    <line
                      x1={xScale(tooltip.date)}
                      x2={xScale(tooltip.date)}
                      y1={0}
                      y2={axisY}
                      stroke="#52525b"
                      strokeWidth={1}
                    />
                  )}
                  <AxisGroupDark ref={topAxisRef} transform={`translate(0, ${innerHeight})`} />
                </>
              )}
              {/* HRV 라인 바로 아래 축과 위치가 겹칠 때(레인이 없을 때)는 중복 렌더링하지 않음 */}
              {(!showHrv || ganttAreaHeight > 0) && (
                <AxisGroupDark ref={bottomAxisRef} transform={`translate(0, ${axisY})`} />
              )}
              {lanes.map((lane, i) => (
                <g key={lane.key}>
                  {i > 0 && <line x1={0} x2={innerWidth} y1={lane.y} y2={lane.y} stroke="#d4d4d8" />}
                  {lane.kind === "gantt" &&
                    lane.ranges.map((r, ri) => {
                      const start = new Date(r.start);
                      const end = new Date(r.end);
                      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return null;
                      const x1 = Math.max(0, Math.min(innerWidth, xScale(start)));
                      const x2 = Math.max(0, Math.min(innerWidth, xScale(end)));
                      const w = x2 - x1;
                      if (w <= 0) return null;
                      return (
                        <rect
                          key={ri}
                          x={x1}
                          y={lane.y + 3}
                          width={w}
                          height={LANE_HEIGHT - 6}
                          rx={4}
                          fill={lane.color}
                          opacity={0.85}
                        />
                      );
                    })}
                  {lane.kind === "dot" &&
                    lane.times.map((t, ti) => {
                      const d = new Date(t);
                      if (isNaN(d.getTime())) return null;
                      const x = xScale(d);
                      if (x < 0 || x > innerWidth) return null;
                      return (
                        <circle
                          key={ti}
                          cx={x}
                          cy={lane.y + LANE_HEIGHT / 2}
                          r={5}
                          fill={lane.color}
                          stroke="#fff"
                          strokeWidth={1.5}
                        />
                      );
                    })}
                  {lane.kind === "mood" &&
                    lane.moodPoints.map((m, mi) => {
                      const day = m.date.slice(0, 10);
                      const start = new Date(`${day}T00:00:00`);
                      const x = xScale(start);
                      if (x < 0 || x > innerWidth) return null;
                      return (
                        <circle
                          key={mi}
                          cx={x}
                          cy={lane.y + LANE_HEIGHT / 2}
                          r={5}
                          fill={moodColorScale(m.score)}
                        />
                      );
                    })}
                </g>
              ))}
            </g>
          </svg>
        </PlotArea>
      </ScrollContainer>
      <LegendRow>
        {seriesDefs.map((s) => (
          <LegendItem
            key={s.key}
            type="button"
            $active={!hiddenKeys.has(s.key)}
            onClick={() => toggleSeries(s.key)}
          >
            <LegendDot style={{ background: s.color }} />
            {s.label}
          </LegendItem>
        ))}
      </LegendRow>
      {showHrv && recentAvg !== null && (
        <LegendRow>
          <LegendItem type="button" $active disabled>
            <LegendDash />
            최근 30일 중앙값 {recentAvg.toFixed(1)}
          </LegendItem>
        </LegendRow>
      )}
      <SimpleTooltip
        data={
          tooltip
            ? {
                x: tooltip.x,
                y: tooltip.y,
                label:
                  tickMode === "date"
                    ? formatYmd(tooltip.date)
                    : `${formatYmdHm(tooltip.date)} SDNN ${tooltip.value}`,
              }
            : null
        }
      />
    </ChartWrapper>
  );
}
