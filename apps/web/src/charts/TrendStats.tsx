import type { WeightTrendPoint } from '../engine/WeightTrendPoint';
import type { Fmt } from '../format/Fmt';
import './charts.css';

interface TrendStatsProps {
  /** At least one point. */
  trend: readonly WeightTrendPoint[];
  fmt: Fmt;
}

/** The trend weight now, how it moved in a week, and how far it is from the start. */
export function TrendStats({ trend, fmt }: TrendStatsProps) {
  const last = trend[trend.length - 1];
  const first = trend[0];
  if (last === undefined || first === undefined) return null;
  const weekAgo = trend.length > 7 ? trend[trend.length - 8] : undefined;
  const stats: readonly (readonly [string, string])[] = [
    ['Trend weight', fmt.weight(last.levelKg)],
    ['Last 7 days', weekAgo === undefined ? '—' : fmt.weightDelta(last.levelKg - weekAgo.levelKg)],
    ['Since start', trend.length < 2 ? '—' : fmt.weightDelta(last.levelKg - first.levelKg)],
  ];
  return (
    <dl className="chart-stats">
      {stats.map(([label, value]) => (
        <div key={label} className="chart-stat">
          <dt className="chart-stat-label">{label}</dt>
          <dd className="chart-stat-value">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
