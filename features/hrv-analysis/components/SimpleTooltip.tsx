import styled from "styled-components";

const TooltipBox = styled.div<{ $x: number; $y: number }>`
  position: fixed;
  left: ${(p) => p.$x}px;
  top: ${(p) => p.$y}px;
  transform: translate(-50%, calc(-100% - 10px));
  background: var(--foreground, #18181b);
  color: var(--background, #fff);
  font-size: 11px;
  padding: 6px 8px;
  border-radius: 6px;
  pointer-events: none;
  white-space: nowrap;
  z-index: 50;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
`;

export interface SimpleTooltipData {
  x: number;
  y: number;
  label: string;
}

export default function SimpleTooltip({ data }: { data: SimpleTooltipData | null }) {
  if (!data) return null;
  return (
    <TooltipBox $x={data.x} $y={data.y}>
      {data.label}
    </TooltipBox>
  );
}
