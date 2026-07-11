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

interface Props {
  data: HrvSamplePoint[];
  pxPerDay?: number;
  height?: number;
  color?: string;
}

const MARGIN = { top: 16, right: 16, bottom: 28, left: 40 };
const DRAG_THRESHOLD_PX = 4;
// 워치 미착용 등으로 측정이 비어있던 구간은 선을 잇지 않고 끊어 보이게 함
// (정상 간격은 대체로 2시간 안팎 — 그 몇 배 이상 비면 착용하지 않은 것으로 봄)
const GAP_THRESHOLD_MS = 3 * 60 * 60 * 1000;

const Row = styled.div`
  display: flex;
  align-items: flex-start;
`;

const YAxisSvg = styled.svg`
  flex-shrink: 0;
  display: block;
`;

const YAxisGroup = styled(AxisGroup)`
  .domain {
    display: none;
  }
`;

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

function formatDateTime(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. ${hh}:${mm}`;
}

export default function HrvAnalysisChart({ data, pxPerDay = 60, height = 260, color = "#14b8a6" }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startScrollLeft: number;
    pointerId: number;
    dragging: boolean;
  } | null>(null);
  const hasInitScrolled = useRef(false);
  const xAxisRef = useRef<SVGGElement>(null);
  const yAxisRef = useRef<SVGGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: Date; value: number } | null>(
    null
  );

  const points = useMemo(
    () =>
      data
        .map((d) => ({ date: new Date(d.timestamp), value: d.value }))
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [data]
  );

  const innerHeight = height - MARGIN.top - MARGIN.bottom;

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
    d3.select(xAxisRef.current).call(d3.axisBottom(xScale).ticks(Math.max(3, Math.round(innerWidth / 100))));
  }, [xScale, innerWidth]);

  useEffect(() => {
    if (!yAxisRef.current) return;
    d3.select(yAxisRef.current).call(d3.axisLeft(yScale).ticks(5).tickSize(0));
  }, [yScale]);

  const yTicks = useMemo(() => yScale.ticks(5), [yScale]);

  // 처음 로드되면 가장 최근 데이터가 보이도록 오른쪽 끝으로 스크롤
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || hasInitScrolled.current || points.length === 0) return;
    el.scrollLeft = el.scrollWidth - el.clientWidth;
    hasInitScrolled.current = true;
  }, [points]);

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
      <Row>
        <YAxisSvg width={MARGIN.left} height={height}>
          <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
            <YAxisGroup ref={yAxisRef} />
          </g>
        </YAxisSvg>
        <ScrollContainer
          ref={scrollRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <svg width={scrollableWidth} height={height} style={{ display: "block" }}>
            <g transform={`translate(0, ${MARGIN.top})`}>
              {yTicks.map((t) => (
                <line
                  key={t}
                  x1={0}
                  x2={innerWidth}
                  y1={yScale(t)}
                  y2={yScale(t)}
                  stroke="#e4e4e7"
                />
              ))}
              <AxisGroup ref={xAxisRef} transform={`translate(0, ${innerHeight})`} />
              <path d={lineGenerator(points) ?? undefined} fill="none" stroke={color} strokeWidth={1.5} />
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
        </ScrollContainer>
      </Row>
      <SimpleTooltip
        data={tooltip ? { x: tooltip.x, y: tooltip.y, label: `${formatDateTime(tooltip.date)} · ${tooltip.value}ms` } : null}
      />
    </ChartWrapper>
  );
}
