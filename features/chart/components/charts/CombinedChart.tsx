import { useMemo } from "react";
import * as d3 from "d3";
import GridLines from "./GridLines";
import { LANE_MARGIN } from "./laneLayout";
import type { ChartDataPoint } from "./types";

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
  dates: string[];
  xScale: d3.ScaleBand<string>;
  totalWidth: number;
  height?: number;
}

export default function CombinedChart({
  series,
  hiddenKeys,
  dates,
  xScale,
  totalWidth,
  height = 220,
}: Props) {
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
        .x((d) => (xScale(d.date) ?? 0) + xScale.bandwidth() / 2)
        .y((d) => yScale(d.value)),
    [xScale, yScale]
  );

  const barSeries = visibleSeries.filter((s) => s.type === "bar");
  const lineSeries = visibleSeries.filter((s) => s.type === "line");
  const barBandWidth = barSeries.length > 0 ? xScale.bandwidth() / barSeries.length : 0;

  return (
    <svg width={totalWidth} height={height} style={{ display: "block" }}>
      <g transform={`translate(${LANE_MARGIN.left}, ${LANE_MARGIN.top})`}>
        <GridLines dates={dates} xScale={xScale} height={innerHeight} />
        {barSeries.map((s, si) =>
          s.data.map((d) => (
            <rect
              key={`${s.key}-${d.date}`}
              x={(xScale(d.date) ?? 0) + si * barBandWidth}
              y={yScale(d.value)}
              width={barBandWidth}
              height={innerHeight - yScale(d.value)}
              fill={s.color}
              rx={2}
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
              <circle
                key={`${s.key}-${d.date}`}
                cx={(xScale(d.date) ?? 0) + xScale.bandwidth() / 2}
                cy={yScale(d.value)}
                r={3}
                fill={s.color}
              />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}
