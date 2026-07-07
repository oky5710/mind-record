import { useMemo, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import * as d3 from "d3";
import styled from "styled-components";
import { LANE_MARGIN } from "./laneLayout";
import { bandCenterOffset } from "./bandUtils";
import type { ChartDataPoint } from "./types";
import type { HoverPoint } from "./Tooltip";

const LaneLabelSlot = styled.div`
  height: 0;
  position: relative;
  z-index: 2;
`;

const LaneLabel = styled.div`
  position: sticky;
  top: 0;
  left: 0;
  width: fit-content;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted-foreground, #71717a);
  background: var(--background, #fff);
  padding: 2px 6px;
  border-radius: 0 0 4px 0;
`;

interface Props {
  label: string;
  color: string;
  data: ChartDataPoint[];
  xScale: d3.ScaleBand<string>;
  totalWidth: number;
  height?: number;
  onHoverPoint?: (point: HoverPoint | null) => void;
}

export default function BarLane({
  label,
  color,
  data,
  xScale,
  totalWidth,
  height = 90,
  onHoverPoint,
}: Props) {
  const touchHideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const innerHeight = height - LANE_MARGIN.top - LANE_MARGIN.bottom;

  const yScale = useMemo(() => {
    const max = d3.max(data, (d) => d.value) ?? 0;
    return d3.scaleLinear().domain([0, max]).nice().range([innerHeight, 0]);
  }, [data, innerHeight]);

  const centerOffset = bandCenterOffset(xScale);

  function handleEnter(e: ReactPointerEvent, date: string) {
    onHoverPoint?.({ x: e.clientX, y: e.clientY, date });
    window.clearTimeout(touchHideTimerRef.current);
    if (e.pointerType !== "mouse") {
      touchHideTimerRef.current = setTimeout(() => onHoverPoint?.(null), 2000);
    }
  }

  function handleLeave(e: ReactPointerEvent) {
    if (e.pointerType === "mouse") onHoverPoint?.(null);
  }

  return (
    <div>
      <LaneLabelSlot>
        <LaneLabel>{label}</LaneLabel>
      </LaneLabelSlot>
      <svg width={totalWidth} height={height} style={{ display: "block" }}>
        <g transform={`translate(${LANE_MARGIN.left}, ${LANE_MARGIN.top})`}>
          {data.map((d) => (
            <rect
              key={d.date}
              x={(xScale(d.date) ?? 0) + centerOffset}
              y={yScale(d.value)}
              width={xScale.bandwidth()}
              height={innerHeight - yScale(d.value)}
              fill={color}
              rx={2}
              onPointerEnter={(e) => handleEnter(e, d.date)}
              onPointerLeave={handleLeave}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
