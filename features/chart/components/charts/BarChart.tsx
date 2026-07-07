"use client";

import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import { CHART_MARGIN, ChartWrapper, ChartEmptyState, AxisGroup } from "./ChartLayout";
import { formatDateTick } from "./format";
import type { ChartDataPoint } from "./types";

interface Props {
  data: ChartDataPoint[];
  color: string;
  width?: number;
  height?: number;
}

export default function BarChart({ data, color, width = 320, height = 200 }: Props) {
  const xAxisRef = useRef<SVGGElement>(null);
  const yAxisRef = useRef<SVGGElement>(null);

  const innerWidth = width - CHART_MARGIN.left - CHART_MARGIN.right;
  const innerHeight = height - CHART_MARGIN.top - CHART_MARGIN.bottom;

  const xScale = useMemo(
    () =>
      d3
        .scaleBand<string>()
        .domain(data.map((d) => d.date))
        .range([0, innerWidth])
        .padding(0.3),
    [data, innerWidth]
  );

  const yScale = useMemo(() => {
    const max = d3.max(data, (d) => d.value) ?? 0;
    return d3.scaleLinear().domain([0, max]).nice().range([innerHeight, 0]);
  }, [data, innerHeight]);

  useEffect(() => {
    if (!xAxisRef.current) return;
    d3.select(xAxisRef.current).call(
      d3.axisBottom(xScale).tickFormat((d) => formatDateTick(d))
    );
  }, [xScale]);

  useEffect(() => {
    if (!yAxisRef.current) return;
    d3.select(yAxisRef.current).call(d3.axisLeft(yScale).ticks(4));
  }, [yScale]);

  if (data.length === 0) {
    return <ChartEmptyState>데이터가 없습니다</ChartEmptyState>;
  }

  return (
    <ChartWrapper>
      <svg width={width} height={height}>
        <g transform={`translate(${CHART_MARGIN.left}, ${CHART_MARGIN.top})`}>
          <AxisGroup ref={yAxisRef} />
          <AxisGroup ref={xAxisRef} transform={`translate(0, ${innerHeight})`} />
          {data.map((d) => (
            <rect
              key={d.date}
              x={xScale(d.date)}
              y={yScale(d.value)}
              width={xScale.bandwidth()}
              height={innerHeight - yScale(d.value)}
              fill={color}
              rx={2}
            />
          ))}
        </g>
      </svg>
    </ChartWrapper>
  );
}
