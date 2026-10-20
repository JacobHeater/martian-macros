import type { WeightTrendPoint } from '../engine/WeightTrendPoint';
import type { Fmt } from '../format/Fmt';
import './charts.css';

interface TrendStatsProps {
  /** At least one point. */
  trend: readonly WeightTrendPoint[];
  fmt: Fmt;
}

/**
 * The trend weight as the hero's one figure (MM-287), heard as "Trend
 * weight 184.1 lb", with how it moved in a week and since the start as one
 * quiet line beneath it: "−0.6 lb last 7 days · −5.5 lb since start". A
 * change there is too little history for is left out, never dashed.
 */
export function TrendStats({ trend, fmt }: TrendStatsProps) {
  const last = trend[trend.length - 1];
  const first = trend[0];
  if (last === undefined || first === undefined) return null;
  const weekAgo = trend.length > 7 ? trend[trend.length - 8] : undefined;
  const changes = [
    ...(weekAgo === undefined ? [] : [`${fmt.weightDelta(last.levelKg - weekAgo.levelKg)} last 7 days`]),
    ...(trend.length < 2 ? [] : [`${fmt.weightDelta(last.levelKg - first.levelKg)} since start`]),
  ];
  return (
    <div className="chart-stats">
      <p className="chart-stat-figure">
        <span className="mm-visually-hidden">Trend weight </span>
        {fmt.weight(last.levelKg)}
      </p>
      {changes.length === 0 ? null : <p className="chart-stat-line">{changes.join(' · ')}</p>}
    </div>
  );
}
