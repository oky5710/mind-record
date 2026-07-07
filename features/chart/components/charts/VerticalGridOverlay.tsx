import * as d3 from "d3";
import styled from "styled-components";
import { LANE_MARGIN } from "./laneLayout";

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: -1;
`;

const GridLine = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--border, #e4e4e7);
`;

interface Props {
  dates: string[];
  xScale: d3.ScaleBand<string>;
}

export default function VerticalGridOverlay({ dates, xScale }: Props) {
  return (
    <Overlay>
      {dates.map((date) => (
        <GridLine key={date} style={{ left: (xScale(date) ?? 0) + LANE_MARGIN.left }} />
      ))}
    </Overlay>
  );
}
