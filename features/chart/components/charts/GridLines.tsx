import * as d3 from "d3";

interface Props {
  dates: string[];
  xScale: d3.ScaleBand<string>;
  height: number;
}

export default function GridLines({ dates, xScale, height }: Props) {
  return (
    <g>
      {dates.map((date) => (
        <line
          key={date}
          x1={xScale(date)}
          x2={xScale(date)}
          y1={0}
          y2={height}
          stroke="var(--border, #e4e4e7)"
          strokeWidth={1}
        />
      ))}
    </g>
  );
}
