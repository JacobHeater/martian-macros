import type { WeightTrendPoint } from '../engine/WeightTrendPoint';
import { linePath } from './linePath';
import './charts.css';

interface TrendSparklineProps {
  trend: readonly WeightTrendPoint[];
  days?: number;
}

const width = 320;
const height = 56;

/**
 * The small trend line: the same line and uncertainty band as the full
 * chart, with no axes and no dots (MM-107). Its meaning is carried by the
 * text beside it; the drawing is hidden from screen readers.
 */
export function TrendSparkline({ trend, days = 30 }: TrendSparklineProps) {
  const points = trend.length > days ? trend.slice(trend.length - days) : trend;
  if (points.length < 2) return <p className="chart-caption">A trend needs more weigh-ins.</p>;

  const at = (p: WeightTrendPoint, sigmas: number) => p.levelKg + sigmas * p.levelSigmaKg;
  const low = Math.min(...points.map((p) => at(p, -2)));
  const high = Math.max(...points.map((p) => at(p, 2)));
  const x = (i: number) => 2 + (i / (points.length - 1)) * (width - 4);
  const y = (value: number) => 2 + (height - 4) * (high === low ? 0.5 : 1 - (value - low) / (high - low));
  const along = (sigmas: number) => points.map((p, i) => [x(i), y(at(p, sigmas))] as const);
  const band = `${linePath(along(2))}${linePath([...along(-2)].reverse()).replace('M', 'L')}Z`;

  return (
    <svg className="chart-plot chart-spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <path className="chart-band" d={band} />
      <path className="chart-line chart-estimate" d={linePath(along(0))} strokeWidth={2.5} />
    </svg>
  );
}
