"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import * as d3 from "d3";
import styled from "styled-components";
import { ChartWrapper, ChartEmptyState, AxisGroup } from "@/features/chart/components/charts/ChartLayout";
import SimpleTooltip from "./SimpleTooltip";
import type { HrvSamplePoint } from "./HrvAnalysisChart";

interface Props {
  data: HrvSamplePoint[];
  availableDates: string[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  height?: number;
  color?: string;
}

const MARGIN = { top: 16, right: 16, bottom: 28, left: 40 };
// 워치 미착용 등으로 측정이 비어있던 구간은 선을 잇지 않고 끊어 보이게 함
const GAP_THRESHOLD_MS = 3 * 60 * 60 * 1000;

const DayNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const NavButton = styled.button`
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 13px;
  color: var(--muted-foreground, #71717a);
  background: none;
  border: none;
  cursor: pointer;

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }

  &:not(:disabled):hover {
    background: var(--muted, #f4f4f5);
  }
`;

const DateLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
`;

const YAxisGroup = styled(AxisGroup)`
  .domain {
    display: none;
  }

  .tick line {
    stroke: #e4e4e7;
  }
`;

function formatDayLabel(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

function formatTime(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function HrvDayChart({
  data,
  availableDates,
  selectedDate,
  onSelectDate,
  height = 260,
  color = "#14b8a6",
}: Props) {
  const xAxisRef = useRef<SVGGElement>(null);
  const yAxisRef = useRef<SVGGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: Date; value: number } | null>(
    null
  );

  useLayoutEffect(() => {
    function updateWidth() {
      if (containerRef.current) setWidth(containerRef.current.clientWidth);
    }
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const currentIndex = selectedDate ? availableDates.indexOf(selectedDate) : -1;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex >= 0 && currentIndex < availableDates.length - 1;

  const dayPoints = useMemo(() => {
    if (!selectedDate) return [];
    return data
      .filter((d) => d.timestamp.slice(0, 10) === selectedDate)
      .map((d) => ({ date: new Date(d.timestamp), value: d.value }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [data, selectedDate]);

  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  const [dayStart, dayEnd] = useMemo(() => {
    const start = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();
    return [start, new Date(start.getTime() + 24 * 60 * 60 * 1000)];
  }, [selectedDate]);

  const xScale = useMemo(
    () => d3.scaleTime().domain([dayStart, dayEnd]).range([0, innerWidth]),
    [dayStart, dayEnd, innerWidth]
  );

  const yScale = useMemo(() => {
    const max = d3.max(dayPoints, (p) => p.value) ?? 0;
    return d3.scaleLinear().domain([0, max]).nice().range([innerHeight, 0]);
  }, [dayPoints, innerHeight]);

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
    d3.select(xAxisRef.current).call(d3.axisBottom(xScale).ticks(6).tickFormat((d) => formatTime(d as Date)));
  }, [xScale]);

  useEffect(() => {
    if (!yAxisRef.current) return;
    d3.select(yAxisRef.current).call(d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth));
  }, [yScale, innerWidth]);

  function goPrev() {
    if (canGoPrev) onSelectDate(availableDates[currentIndex - 1]);
  }

  function goNext() {
    if (canGoNext) onSelectDate(availableDates[currentIndex + 1]);
  }

  function handleHoverMove(e: ReactPointerEvent<SVGRectElement>) {
    if (e.pointerType !== "mouse" || dayPoints.length === 0) return;
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const xPos = e.clientX - rect.left - MARGIN.left;
    const date = xScale.invert(xPos);
    const i = bisectDate(dayPoints, date);
    const candidates = [dayPoints[i - 1], dayPoints[i]].filter(Boolean) as {
      date: Date;
      value: number;
    }[];
    if (candidates.length === 0) return;
    const closest = candidates.reduce((a, b) =>
      Math.abs(a.date.getTime() - date.getTime()) < Math.abs(b.date.getTime() - date.getTime()) ? a : b
    );
    setTooltip({ x: e.clientX, y: e.clientY, date: closest.date, value: closest.value });
  }

  function handleHoverLeave(e: ReactPointerEvent) {
    if (e.pointerType === "mouse") setTooltip(null);
  }

  return (
    <ChartWrapper>
      <DayNav>
        <NavButton type="button" onClick={goPrev} disabled={!canGoPrev} aria-label="이전 날짜">
          ‹ 이전
        </NavButton>
        <DateLabel>{selectedDate ? formatDayLabel(selectedDate) : "-"}</DateLabel>
        <NavButton type="button" onClick={goNext} disabled={!canGoNext} aria-label="다음 날짜">
          다음 ›
        </NavButton>
      </DayNav>
      <div ref={containerRef} style={{ width: "100%" }}>
        {dayPoints.length === 0 ? (
          <ChartEmptyState>이 날짜엔 측정 데이터가 없습니다</ChartEmptyState>
        ) : (
          <svg width={width} height={height} style={{ display: "block" }}>
            <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
              <YAxisGroup ref={yAxisRef} />
              <AxisGroup ref={xAxisRef} transform={`translate(0, ${innerHeight})`} />
              <path d={lineGenerator(dayPoints) ?? undefined} fill="none" stroke={color} strokeWidth={1.5} />
              {dayPoints.map((p, i) => (
                <circle key={i} cx={xScale(p.date)} cy={yScale(p.value)} r={3} fill={color} />
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
            </g>
          </svg>
        )}
      </div>
      <SimpleTooltip
        data={tooltip ? { x: tooltip.x, y: tooltip.y, label: `${formatTime(tooltip.date)} · ${tooltip.value}ms` } : null}
      />
    </ChartWrapper>
  );
}
