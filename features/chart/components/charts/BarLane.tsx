import { useMemo } from "react";
import * as d3 from "d3";
import styled from "styled-components";
import GridLines from "./GridLines";
import { LANE_MARGIN } from "./laneLayout";
import type { ChartDataPoint } from "./types";

const LaneLabel = styled.div`
  position: sticky;
  left: 0;
  width: fit-content;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted-foreground, #71717a);
  background: var(--background, #fff);
  padding: 6px 6px 2px ${LANE_MARGIN.left}px;
  border-radius: 0 4px 0 0;
`;

interface Props {
  label: string;
  color: string;
  data: ChartDataPoint[];
  dates: string[];
  xScale: d3.ScaleBand<string>;
  totalWidth: number;
  height?: number;
}

export default function BarLane({
  label,
  color,
  data,
  dates,
  xScale,
  totalWidth,
  height = 90,
}: Props) {
  const innerHeight = height - LANE_MARGIN.top - LANE_MARGIN.bottom;

  const yScale = useMemo(() => {
    const max = d3.max(data, (d) => d.value) ?? 0;
    return d3.scaleLinear().domain([0, max]).nice().range([innerHeight, 0]);
  }, [data, innerHeight]);

  return (
    <div>
      <LaneLabel>{label}</LaneLabel>
      <svg width={totalWidth} height={height} style={{ display: "block" }}>
        <g transform={`translate(${LANE_MARGIN.left}, ${LANE_MARGIN.top})`}>
          <GridLines dates={dates} xScale={xScale} height={innerHeight} />
          {data.map((d) => (
            <rect
              key={d.date}
              x={xScale(d.date) ?? 0}
              y={yScale(d.value)}
              width={xScale.bandwidth()}
              height={innerHeight - yScale(d.value)}
              fill={color}
              rx={2}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
