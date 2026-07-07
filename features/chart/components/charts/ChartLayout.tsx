import styled from "styled-components";

export const CHART_MARGIN = { top: 16, right: 16, bottom: 28, left: 40 };

export const ChartWrapper = styled.div`
  width: 100%;
`;

export const ChartEmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  font-size: 13px;
  color: var(--muted-foreground, #71717a);
`;

export const AxisGroup = styled.g`
  font-size: 10px;

  .domain,
  line {
    stroke: var(--border, #e4e4e7);
  }

  text {
    fill: var(--muted-foreground, #71717a);
  }
`;
