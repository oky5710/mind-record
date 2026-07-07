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
  display: flex;
  flex-direction: column;
  width: fit-content;
`;

const Separator = styled.div`
  border-top: 1px solid var(--border, #e4e4e7);
`;

export default function ChartGroup({ combinedSeries, lanes, dayWidth = 30, onReachStart }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startScrollLeft: number } | null>(null);
  const prevDatesRef = useRef<string[] | null>(null);
  const hasRequestedMoreRef = useRef(false);

  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

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
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function handleScroll(e: ReactUIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
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
          <DateAxisRow dates={dates} xScale={xScale} dayWidth={dayWidth} totalWidth={totalWidth} orientation="top" />
          <Separator />
          <CombinedChart
            series={combinedSeries}
            hiddenKeys={hiddenKeys}
            dates={dates}
            xScale={xScale}
            totalWidth={totalWidth}
          />
          {lanes.map((lane) => (
            <Fragment key={lane.key}>
              <Separator />
              <BarLane
                label={lane.label}
                color={lane.color}
                data={lane.data}
                dates={dates}
                xScale={xScale}
                totalWidth={totalWidth}
              />
            </Fragment>
          ))}
          <Separator />
          <DateAxisRow dates={dates} xScale={xScale} dayWidth={dayWidth} totalWidth={totalWidth} orientation="bottom" />
        </Stack>
      </ScrollContainer>
    </ChartWrapper>
  );
}
