import { useMemo, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import * as d3 from "d3";
import { LANE_MARGIN } from "./laneLayout";
import { bandCenterOffset, cellCenter } from "./bandUtils";
import type { ChartDataPoint } from "./types";
import type { HoverPoint } from "./Tooltip";

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  type: "bar" | "line";
  data: ChartDataPoint[];
}

interface Props {
  series: ChartSeries[];
  hiddenKeys: Set<string>;
  xScale: d3.ScaleBand<string>;
  totalWidth: number;
  height?: number;
  onHoverPoint?: (point: HoverPoint | null) => void;
}

export default function CombinedChart({
  series,
  hiddenKeys,
  xScale,
  totalWidth,
  height = 220,
  onHoverPoint,
}: Props) {
  const touchHideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const visibleSeries = useMemo(
    () => series.filter((s) => !hiddenKeys.has(s.key)),
    [series, hiddenKeys]
  );

  const innerHeight = height - LANE_MARGIN.top - LANE_MARGIN.bottom;

  const yScale = useMemo(() => {
    const allValues = visibleSeries.flatMap((s) => s.data.map((d) => d.value));
    const max = d3.max(allValues) ?? 0;
    return d3.scaleLinear().domain([0, max]).nice().range([innerHeight, 0]);
  }, [visibleSeries, innerHeight]);

  const lineGenerator = useMemo(
    () =>
      d3
        .line<ChartDataPoint>()
        .x((d) => cellCenter(xScale, d.date))
        .y((d) => yScale(d.value)),
    [xScale, yScale]
  );

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

  const barSeries = visibleSeries.filter((s) => s.type === "bar");
  const lineSeries = visibleSeries.filter((s) => s.type === "line");
  const barBandWidth = barSeries.length > 0 ? xScale.bandwidth() / barSeries.length : 0;
  const barGroupOffset = bandCenterOffset(xScale);

  return (
    <svg width={totalWidth} height={height} style={{ display: "block" }}>
      <g transform={`translate(${LANE_MARGIN.left}, ${LANE_MARGIN.top})`}>
        {barSeries.map((s, si) =>
          s.data.map((d) => (
            <rect
              key={`${s.key}-${d.date}`}
              x={(xScale(d.date) ?? 0) + barGroupOffset + si * barBandWidth}
              y={yScale(d.value)}
              width={barBandWidth}
              height={innerHeight - yScale(d.value)}
              fill={s.color}
              rx={2}
              onPointerEnter={(e) => handleEnter(e, d.date)}
              onPointerLeave={handleLeave}
            />
          ))
        )}
        {lineSeries.map((s) => (
          <g key={s.key}>
            <path
              d={lineGenerator(s.data) ?? undefined}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
            />
            {s.data.map((d) => (
              <g key={`${s.key}-${d.date}`}>
                <circle
                  cx={cellCenter(xScale, d.date)}
                  cy={yScale(d.value)}
                  r={3}
                  fill={s.color}
                />
                <circle
                  cx={cellCenter(xScale, d.date)}
                  cy={yScale(d.value)}
                  r={10}
                  fill="transparent"
                  onPointerEnter={(e) => handleEnter(e, d.date)}
                  onPointerLeave={handleLeave}
                />
              </g>
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}
