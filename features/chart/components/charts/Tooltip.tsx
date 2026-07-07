import styled from "styled-components";
import { formatFullDate } from "./format";

export interface HoverPoint {
  date: string;
  x: number;
  y: number;
}

export interface TooltipEntry {
  label: string;
  value: number;
  color: string;
}

export interface TooltipData {
  x: number;
  y: number;
  date: string;
  entries: TooltipEntry[];
}

const TooltipBox = styled.div<{ $x: number; $y: number }>`
  position: fixed;
  left: ${(p) => p.$x}px;
  top: ${(p) => p.$y}px;
  transform: translate(-50%, calc(-100% - 10px));
  background: var(--foreground, #18181b);
  color: var(--background, #fff);
  font-size: 11px;
  line-height: 1.5;
  padding: 8px 10px;
  border-radius: 6px;
  pointer-events: none;
  white-space: nowrap;
  z-index: 50;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
`;

const DateHeader = styled.div`
  font-weight: 600;
  margin-bottom: 4px;
  opacity: 0.85;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Dot = styled.span<{ $color: string }>`
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${(p) => p.$color};
  flex-shrink: 0;
`;

interface Props {
  data: TooltipData | null;
}

export default function Tooltip({ data }: Props) {
  if (!data || data.entries.length === 0) return null;
  return (
    <TooltipBox $x={data.x} $y={data.y}>
      <DateHeader>{formatFullDate(data.date)}</DateHeader>
      {data.entries.map((entry, i) => (
        <Row key={i}>
          <Dot $color={entry.color} />
          {entry.label}: {entry.value}
        </Row>
      ))}
    </TooltipBox>
  );
}
