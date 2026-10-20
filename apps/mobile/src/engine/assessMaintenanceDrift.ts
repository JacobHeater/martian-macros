import type { CalendarDate } from '../domain/CalendarDate';
import type { MaintenanceAnchor } from './MaintenanceAnchor';
import type { MaintenanceDrift } from './MaintenanceDrift';
import { MaintenanceRule } from './MaintenanceRule';
import type { WeightTrendPoint } from './WeightTrendPoint';

/**
 * Whether the trend weight has drifted out of the maintenance band (MM-130):
 * out when every trend point of the last `driftDays` days through yesterday
 * lies outside the band on the same side. Undefined without a trend.
 */
export function assessMaintenanceDrift({
  anchor,
  trend,
  today,
}: {
  anchor: MaintenanceAnchor;
  trend: readonly WeightTrendPoint[];
  today: CalendarDate;
}): MaintenanceDrift | undefined {
  const through = today.addDays(-1);
  const points = trend.filter((p) => !p.date.isAfter(through)).sort((a, b) => a.date.compareTo(b.date));
  const latest = points[points.length - 1];
  if (latest === undefined) return undefined;
  const side = (p: WeightTrendPoint): -1 | 0 | 1 => {
    const d = p.levelKg - anchor.weightKg;
    return d > anchor.halfWidthKg ? 1 : d < -anchor.halfWidthKg ? -1 : 0;
  };
  const latestSide = side(latest);
  let daysOutside = 0;
  if (latestSide !== 0) {
    for (let i = points.length - 1; i >= 0; i--) {
      const p = points[i] as WeightTrendPoint;
      if (side(p) !== latestSide) break;
      daysOutside = p.date.daysUntil(through) + 1;
    }
  }
  return {
    status: latestSide === 0 ? 'inBand' : daysOutside >= MaintenanceRule.driftDays ? 'out' : 'drifting',
    anchor,
    trendWeightKg: latest.levelKg,
    deviationKg: latest.levelKg - anchor.weightKg,
    daysOutside,
  };
}
