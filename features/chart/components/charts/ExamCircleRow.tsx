import { useMemo } from "react";
import * as d3 from "d3";
import styled from "styled-components";
import { LANE_MARGIN } from "./laneLayout";
import { cellCenter } from "./bandUtils";

const LabelSlot = styled.div`
  height: 0;
  position: relative;
  z-index: 2;
`;

const Label = styled.div`
  position: sticky;
  top: 0;
  left: 0;
  width: fit-content;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted-foreground, #71717a);
  background: var(--background, #fff);
  padding: 2px 6px;
  border-radius: 0 0 4px 0;
  white-space: nowrap;
`;

const LegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
`;

const Dot = styled.span<{ $color: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  background: ${(p) => p.$color};
`;

export interface ExamCircleDatum {
  date: string;
  lfNorm: number;
  hfNorm: number;
}

interface Props {
  data: ExamCircleDatum[];
  xScale: d3.ScaleBand<string>;
  totalWidth: number;
  dayWidth: number;
  height?: number;
  colors: { lfNorm: string; hfNorm: string };
  onSelect?: (date: string) => void;
}

const MIN_RADIUS = 2;

export default function ExamCircleRow({
  data,
  xScale,
  totalWidth,
  dayWidth,
  height = 44,
  colors,
  onSelect,
}: Props) {
  const innerHeight = height - LANE_MARGIN.top - LANE_MARGIN.bottom;
  const maxRadius = (dayWidth * 0.7) / 2;
  const cy = innerHeight / 2;

  const radiusScale = useMemo(
    () => d3.scaleLinear().domain([0, 100]).range([MIN_RADIUS, maxRadius]).clamp(true),
    [maxRadius]
  );

  return (
    <div>
      <LabelSlot>
        <Label>
          <LegendItem>
            <Dot $color={colors.lfNorm} />
            LF Norm
          </LegendItem>
          <LegendItem>
            <Dot $color={colors.hfNorm} />
            HF Norm
          </LegendItem>
        </Label>
      </LabelSlot>
      <svg width={totalWidth} height={height} style={{ display: "block" }}>
        <g transform={`translate(${LANE_MARGIN.left}, ${LANE_MARGIN.top})`}>
          {data.map((d) => {
            const diff = Math.abs(d.lfNorm - d.hfNorm);
            const radius = radiusScale(diff);
            const color = d.lfNorm >= d.hfNorm ? colors.lfNorm : colors.hfNorm;
            const cx = cellCenter(xScale, d.date);
            return (
              <circle
                key={d.date}
                cx={cx}
                cy={cy}
                r={radius}
                fill={color}
                style={{ cursor: onSelect ? "pointer" : undefined }}
                onClick={() => onSelect?.(d.date)}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
