import type { AxisScale, ScaleBand } from "d3";

export function bandCenterOffset(scale: ScaleBand<string>) {
  return (scale.step() - scale.bandwidth()) / 2;
}

export function cellCenter(scale: ScaleBand<string>, date: string) {
  return (scale(date) ?? 0) + scale.step() / 2;
}

// d3-axis centers ticks on a band scale's bandwidth (scale(d) + bandwidth/2),
// but our grid lines mark the full step cell. This proxy scale reports no
// `.bandwidth`, so d3-axis falls back to plain positioning — we compute the
// step-cell center ourselves so tick labels land on the grid lines.
export function toCenteredAxisScale(scale: ScaleBand<string>): AxisScale<string> {
  const fn = ((d: string) => cellCenter(scale, d)) as unknown as AxisScale<string>;
  fn.domain = () => scale.domain();
  fn.range = () => scale.range();
  fn.copy = () => fn;
  return fn;
}
