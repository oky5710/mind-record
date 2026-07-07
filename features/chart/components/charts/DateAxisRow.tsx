"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { AxisGroup } from "./ChartLayout";
import { formatDateTick } from "./format";
import { LANE_MARGIN } from "./laneLayout";
import { toCenteredAxisScale } from "./bandUtils";

const MIN_LABEL_SPACING_PX = 80;
const AXIS_HEIGHT = 24;

interface Props {
  dates: string[];
  xScale: d3.ScaleBand<string>;
  dayWidth: number;
  totalWidth: number;
  orientation: "top" | "bottom";
}

export default function DateAxisRow({ dates, xScale, dayWidth, totalWidth, orientation }: Props) {
  const axisRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!axisRef.current) return;
    const daysPerLabel = Math.max(1, Math.round(MIN_LABEL_SPACING_PX / dayWidth));
    const tickValues = dates.filter((_, i) => i % daysPerLabel === 0);
    const centeredScale = toCenteredAxisScale(xScale);
    const axis =
      orientation === "top" ? d3.axisTop(centeredScale) : d3.axisBottom(centeredScale);
    d3.select(axisRef.current).call(axis.tickValues(tickValues).tickFormat((d) => formatDateTick(d)));
  }, [xScale, dates, dayWidth, orientation]);

  const translateY = orientation === "top" ? AXIS_HEIGHT : 0;

  return (
    <svg width={totalWidth} height={AXIS_HEIGHT} style={{ display: "block" }}>
      <g transform={`translate(${LANE_MARGIN.left}, ${translateY})`}>
        <AxisGroup ref={axisRef} />
      </g>
    </svg>
  );
}
