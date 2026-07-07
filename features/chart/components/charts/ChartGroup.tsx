"use client";

import { Fragment, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, UIEvent as ReactUIEvent } from "react";
import * as d3 from "d3";
import styled from "styled-components";
import { ChartWrapper, ChartEmptyState } from "./ChartLayout";
import { LANE_MARGIN } from "./laneLayout";
import { collectDates } from "./dateUtils";
import Legend from "./Legend";
import DateAxisRow from "./DateAxisRow";
import CombinedChart, { type ChartSeries } from "./CombinedChart";
import BarLane from "./BarLane";
import VerticalGridOverlay from "./VerticalGridOverlay";
import Tooltip, { type TooltipData, type HoverPoint } from "./Tooltip";
import type { ChartDataPoint } from "./types";

export interface ChartLane {
  key: string;
  label: string;
  color: string;
  data: ChartDataPoint[];
}

interface Props {
  combinedSeries: ChartSeries[];
  lanes: ChartLane[];
  dayWidth?: number;
  onReachStart?: () => void;
}

const LOAD_MORE_THRESHOLD_DAYS = 3;

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

const Stack = styled.div`
  position: relative;
  z-index: 0;
  display: flex;
  flex-direction: column;
  width: fit-content;
`;

const Separator = styled.div`
  border-top: 1px solid #a1a1aa;
`;

const StickyAxisBar = styled.div<{ $edge: "top" | "bottom" }>`
  position: sticky;
  ${(p) => (p.$edge === "top" ? "top: 0;" : "bottom: 0;")}
  overflow: hidden;
  width: 100%;
  background: var(--background, #fff);
  z-index: 3;
  ${(p) =>
    p.$edge === "top" ? "border-bottom: 1px solid #a1a1aa;" : "border-top: 1px solid #a1a1aa;"}
`;

const StickyAxisInner = styled.div`
  width: fit-content;
`;

export default function ChartGroup({ combinedSeries, lanes, dayWidth = 30, onReachStart }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startScrollLeft: number } | null>(null);
  const prevDatesRef = useRef<string[] | null>(null);
  const hasRequestedMoreRef = useRef(false);
  const topAxisInnerRef = useRef<HTMLDivElement>(null);
  const bottomAxisInnerRef = useRef<HTMLDivElement>(null);

  function syncAxisOffset(scrollLeft: number) {
    const transform = `translateX(${-scrollLeft}px)`;
    if (topAxisInnerRef.current) topAxisInnerRef.current.style.transform = transform;
    if (bottomAxisInnerRef.current) bottomAxisInnerRef.current.style.transform = transform;
  }

  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  function toggleSeries(key: string) {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const dates = useMemo(
    () => collectDates([...combinedSeries.map((s) => s.data), ...lanes.map((l) => l.data)]),
    [combinedSeries, lanes]
  );

  const dataByDate = useMemo(() => {
    const map = new Map<string, { label: string; value: number; color: string }[]>();
    const allSources = [...combinedSeries, ...lanes];
    allSources.forEach((source) => {
      source.data.forEach((d) => {
        if (!map.has(d.date)) map.set(d.date, []);
        map.get(d.date)!.push({ label: source.label, value: d.value, color: source.color });
      });
    });
    return map;
  }, [combinedSeries, lanes]);

  function handleHover(point: HoverPoint | null) {
    if (!point) {
      setTooltip(null);
      return;
    }
    setTooltip({ x: point.x, y: point.y, date: point.date, entries: dataByDate.get(point.date) ?? [] });
  }

  const innerWidth = dates.length * dayWidth;
  const totalWidth = innerWidth + LANE_MARGIN.left + LANE_MARGIN.right;

  const xScale = useMemo(
    () => d3.scaleBand<string>().domain(dates).range([0, innerWidth]).padding(0.5),
    [dates, innerWidth]
  );

  // Jump to the most recent date on first load; when older dates are
  // prepended (infinite-scroll-back), shift scrollLeft by the added width
  // so the content the user is currently looking at doesn't jump.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const prevDates = prevDatesRef.current;

    if (prevDates === null) {
      if (dates.length > 0) {
        el.scrollLeft = el.scrollWidth - el.clientWidth;
        syncAxisOffset(el.scrollLeft);
        prevDatesRef.current = dates;
      }
      return;
    }

    const prependedDays = dates.length - prevDates.length;
    const isPrepend =
      prependedDays > 0 &&
      prevDates.length > 0 &&
      dates[dates.length - 1] === prevDates[prevDates.length - 1];

    if (isPrepend) {
      el.scrollLeft += prependedDays * dayWidth;
      syncAxisOffset(el.scrollLeft);
    }
    prevDatesRef.current = dates;
  }, [dates, dayWidth]);

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const el = scrollRef.current;
    if (!el) return;
    dragRef.current = { startX: e.clientX, startScrollLeft: el.scrollLeft };
    el.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = dragRef.current.startScrollLeft - (e.clientX - dragRef.current.startX);
    syncAxisOffset(el.scrollLeft);
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function handleScroll(e: ReactUIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    syncAxisOffset(el.scrollLeft);
    const threshold = dayWidth * LOAD_MORE_THRESHOLD_DAYS;
    if (el.scrollLeft < threshold) {
      if (!hasRequestedMoreRef.current) {
        hasRequestedMoreRef.current = true;
        onReachStart?.();
      }
    } else {
      hasRequestedMoreRef.current = false;
    }
  }

  const noData =
    combinedSeries.every((s) => s.data.length === 0) && lanes.every((l) => l.data.length === 0);

  if (noData) {
    return <ChartEmptyState>데이터가 없습니다</ChartEmptyState>;
  }

  return (
    <ChartWrapper>
      <Legend
        entries={combinedSeries.map((s) => ({ key: s.key, label: s.label, color: s.color }))}
        hiddenKeys={hiddenKeys}
        onToggle={toggleSeries}
      />
      <StickyAxisBar $edge="top">
        <StickyAxisInner ref={topAxisInnerRef}>
          <DateAxisRow dates={dates} xScale={xScale} dayWidth={dayWidth} totalWidth={totalWidth} orientation="top" />
        </StickyAxisInner>
      </StickyAxisBar>
      <ScrollContainer
        ref={scrollRef}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <Stack>
          <VerticalGridOverlay dates={dates} xScale={xScale} />
          <CombinedChart
            series={combinedSeries}
            hiddenKeys={hiddenKeys}
            xScale={xScale}
            totalWidth={totalWidth}
            onHoverPoint={handleHover}
          />
          {lanes.map((lane) => (
            <Fragment key={lane.key}>
              <Separator />
              <BarLane
                label={lane.label}
                color={lane.color}
                data={lane.data}
                xScale={xScale}
                totalWidth={totalWidth}
                onHoverPoint={handleHover}
              />
            </Fragment>
          ))}
        </Stack>
      </ScrollContainer>
      <StickyAxisBar $edge="bottom">
        <StickyAxisInner ref={bottomAxisInnerRef}>
          <DateAxisRow dates={dates} xScale={xScale} dayWidth={dayWidth} totalWidth={totalWidth} orientation="bottom" />
        </StickyAxisInner>
      </StickyAxisBar>
      <Tooltip data={tooltip} />
    </ChartWrapper>
  );
}
