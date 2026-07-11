"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import * as d3 from "d3";
import styled from "styled-components";
import { ChartWrapper, ChartEmptyState, AxisGroup } from "@/features/chart/components/charts/ChartLayout";
import SimpleTooltip from "./SimpleTooltip";

export interface HrvSamplePoint {
  timestamp: string;
  value: number;
}

export interface GanttRange {
  start: string;
  end: string;
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
}

type SeriesKind = "line" | "gantt" | "emoji";

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
const LANE_HEIGHT = 24;
const LANE_GAP = 8;
const GANTT_TOP_GAP = 20;

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
  width: fit-content;
  font-size: 11px;
  font-weight: 600;
  color: var(--foreground, #18181b);
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
`;

const LegendDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 999px;
  display: inline-block;
`;

function formatDateTime(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. ${hh}:${mm}`;
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
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startScrollLeft: number;
    pointerId: number;
    dragging: boolean;
  } | null>(null);
  const hasInitScrolled = useRef(false);
  const xAxisRef = useRef<SVGGElement>(null);
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

  const points = useMemo(() => {
    const sorted = data
      .map((d) => ({ date: new Date(d.timestamp), value: d.value }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    if (!windowDays || sorted.length === 0) return sorted;
    // 특정 날짜로 이동한 경우, 그 날짜를 기준으로 앞뒤 절반씩 보여줌
    // (기본은 최신 데이터 기준으로 최근 N일만)
    if (jumpToDate) {
      const anchor = new Date(`${jumpToDate}T00:00:00`).getTime();
      const half = (windowDays / 2) * 86_400_000;
      return sorted.filter((p) => {
        const t = p.date.getTime();
        return t >= anchor - half && t <= anchor + half;
      });
    }
    const cutoff = sorted[sorted.length - 1].date.getTime() - windowDays * 86_400_000;
    return sorted.filter((p) => p.date.getTime() >= cutoff);
  }, [data, windowDays, jumpToDate]);

  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  const seriesDefs = useMemo(() => {
    const list: SeriesDef[] = [{ key: "hrv", label: "심박변이", color, kind: "line" }];
    if (sleepRanges) list.push({ key: "sleep", label: "수면", color: "#6366f1", kind: "gantt" });
    if (exerciseRanges) list.push({ key: "exercise", label: "운동", color: "#f97316", kind: "gantt" });
    if (coffeeTimes) list.push({ key: "coffee", label: "커피", color: "#92400e", kind: "emoji" });
    return list;
  }, [color, sleepRanges, exerciseRanges, coffeeTimes]);

  const showHrv = !hiddenKeys.has("hrv");

  const lanes = useMemo(() => {
    const visible = seriesDefs.filter((s) => s.kind !== "line" && !hiddenKeys.has(s.key));
    let cursor = (showHrv ? innerHeight : 0) + (visible.length > 0 ? GANTT_TOP_GAP : 0);
    return visible.map((s) => {
      const y = cursor;
      cursor += LANE_HEIGHT + LANE_GAP;
      return {
        ...s,
        y,
        ranges: s.key === "sleep" ? sleepRanges ?? [] : s.key === "exercise" ? exerciseRanges ?? [] : [],
        times: s.key === "coffee" ? coffeeTimes ?? [] : [],
      };
    });
  }, [seriesDefs, hiddenKeys, showHrv, innerHeight, sleepRanges, exerciseRanges, coffeeTimes]);

  const ganttAreaHeight =
    lanes.length > 0 ? GANTT_TOP_GAP + lanes.length * LANE_HEIGHT + (lanes.length - 1) * LANE_GAP : 0;
  const hrvBlockHeight = showHrv ? innerHeight : 0;
  const axisY = hrvBlockHeight + ganttAreaHeight;
  const totalHeight = MARGIN.top + hrvBlockHeight + ganttAreaHeight + MARGIN.bottom;

  const [minDate, maxDate] = useMemo(() => {
    if (points.length === 0) {
      const now = new Date();
      return [now, now];
    }
    return [points[0].date, points[points.length - 1].date];
  }, [points]);

  const totalDays = Math.max(1, (maxDate.getTime() - minDate.getTime()) / 86_400_000);
  const innerWidth = Math.max(300, totalDays * pxPerDay);
  const scrollableWidth = innerWidth + MARGIN.right;

  const xScale = useMemo(
    () => d3.scaleTime().domain([minDate, maxDate]).range([0, innerWidth]),
    [minDate, maxDate, innerWidth]
  );

  const yScale = useMemo(() => {
    const max = d3.max(points, (p) => p.value) ?? 0;
    return d3.scaleLinear().domain([0, max]).nice().range([innerHeight, 0]);
  }, [points, innerHeight]);

  const lineGenerator = useMemo(
    () =>
      d3
        .line<{ date: Date; value: number }>()
        .x((p) => xScale(p.date))
        .y((p) => yScale(p.value))
        .defined((p, i, arr) => i === 0 || p.date.getTime() - arr[i - 1].date.getTime() <= GAP_THRESHOLD_MS),
    [xScale, yScale]
  );

  const bisectDate = useMemo(() => d3.bisector((p: { date: Date }) => p.date).left, []);

  useEffect(() => {
    if (!xAxisRef.current) return;
    const formatTick =
      tickMode === "time"
        ? (d: Date) => (d3.timeDay(d).getTime() === d.getTime() ? d3.timeFormat("%m-%d")(d) : formatTimeOfDay(d))
        : (d: Date) => d3.timeFormat("%m-%d")(d);

    const sel = d3.select(xAxisRef.current).call(
      d3
        .axisBottom(xScale)
        .ticks(Math.max(3, Math.round(innerWidth / 70)))
        .tickFormat((d) => formatTick(d as Date))
    );

    const texts = sel.selectAll<SVGTextElement, Date>(".tick text");
    const n = texts.size();
    // 자정(날짜 경계) 눈금은 볼드로, 맨 앞/뒤 눈금은 캔버스 밖으로 잘리지
    // 않도록 정렬 기준을 안쪽으로 붙임
    const items: { node: SVGTextElement; isBoundary: boolean; left: number; right: number }[] = [];
    texts.each(function (d, i) {
      const isBoundary = tickMode === "time" && d3.timeDay(d).getTime() === d.getTime();
      d3.select(this)
        .style("font-weight", isBoundary ? "700" : "400")
        .style("text-anchor", i === 0 ? "start" : i === n - 1 ? "end" : "middle")
        .style("display", "");
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
  }, [xScale, innerWidth, tickMode]);

  const yTicks = useMemo(() => yScale.ticks(5), [yScale]);

  // 처음 로드되면 가장 최근 데이터가 보이도록 오른쪽 끝으로 스크롤
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || hasInitScrolled.current || points.length === 0) return;
    el.scrollLeft = el.scrollWidth - el.clientWidth;
    hasInitScrolled.current = true;
  }, [points]);

  // 날짜를 입력받으면 해당 날짜가 화면 중앙에 오도록 스크롤 이동
  useLayoutEffect(() => {
    if (!jumpToDate) return;
    const el = scrollRef.current;
    if (!el) return;
    const targetX = xScale(new Date(`${jumpToDate}T00:00:00`));
    el.scrollLeft = Math.max(0, targetX - el.clientWidth / 2);
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

  function handleHoverMove(e: ReactPointerEvent<SVGRectElement>) {
    if (e.pointerType !== "mouse") return;
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const xPos = e.clientX - rect.left;
    const date = xScale.invert(xPos);
    const i = bisectDate(points, date);
    const p = points[Math.min(i, points.length - 1)];
    if (!p) return;
    setTooltip({ x: e.clientX, y: e.clientY, date: p.date, value: p.value });
  }

  function handleHoverLeave(e: ReactPointerEvent) {
    if (e.pointerType === "mouse") setTooltip(null);
  }

  if (points.length === 0) {
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
              {showHrv && (
                <>
                  {yTicks.map((t) => (
                    <line key={t} x1={0} x2={innerWidth} y1={yScale(t)} y2={yScale(t)} stroke="#e4e4e7" />
                  ))}
                  <path d={lineGenerator(points) ?? undefined} fill="none" stroke={color} strokeWidth={1.5} />
                  {showPoints &&
                    points.map((p, i) => (
                      <circle
                        key={i}
                        cx={xScale(p.date)}
                        cy={yScale(p.value)}
                        r={3}
                        fill="#fff"
                        stroke={color}
                        strokeWidth={1.5}
                      />
                    ))}
                  <rect
                    x={0}
                    y={0}
                    width={innerWidth}
                    height={innerHeight}
                    fill="transparent"
                    onPointerMove={handleHoverMove}
                    onPointerLeave={handleHoverLeave}
                  />
                </>
              )}
              <AxisGroup ref={xAxisRef} transform={`translate(0, ${axisY})`} />
              {lanes.map((lane) => (
                <g key={lane.key}>
                  <rect x={0} y={lane.y} width={innerWidth} height={LANE_HEIGHT} rx={4} fill="#f4f4f5" />
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
                  {lane.kind === "emoji" &&
                    lane.times.map((t, ti) => {
                      const d = new Date(t);
                      if (isNaN(d.getTime())) return null;
                      const x = xScale(d);
                      if (x < 0 || x > innerWidth) return null;
                      return (
                        <text
                          key={ti}
                          x={x}
                          y={lane.y + LANE_HEIGHT / 2}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={14}
                        >
                          ☕
                        </text>
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
            {s.kind === "emoji" ? <span aria-hidden>☕</span> : <LegendDot style={{ background: s.color }} />}
            {s.label}
          </LegendItem>
        ))}
      </LegendRow>
      <SimpleTooltip
        data={tooltip ? { x: tooltip.x, y: tooltip.y, label: `${formatDateTime(tooltip.date)} · ${tooltip.value}ms` } : null}
      />
    </ChartWrapper>
  );
}
