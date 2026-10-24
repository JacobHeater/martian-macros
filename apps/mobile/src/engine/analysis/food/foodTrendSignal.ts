import type { TrendDay } from '../../trends/TrendDay';
import type { TrendDetector } from '../../trends/TrendDetector';
import type { TrendDirection } from '../../trends/TrendDirection';
import type { TrendSignal } from '../../trends/TrendSignal';
import type { FoodDay } from './FoodDay';
import { FoodSignalId } from './FoodSignalId';
import type { FoodSpan } from './FoodSpan';

/** The detectors a daily food series runs (MM-605): the level and the drift; no day of the week (MM-609's). */
const standard: readonly TrendDetector[] = ['shift', 'recentAgainstBaseline', 'shortRun', 'longRun', 'levelAgainstTarget', 'drift'];

/**
 * A food signal as the trend engine reads it (MM-605, MM-606): one value a
 * day, and the day's own target where it has one. A day not logged is
 * unlogged, a partial day is partial (judged by no intake signal, ratios
 * included), and a whole day without a value (no targets, too little data)
 * is excluded. A Refeed or a Day off is eligible and counted (`planned`).
 *
 * `detectors` is empty for a signal read per meal or per food (N3, N8, N9,
 * N15, N16), which a daily series cannot carry: its level rule speaks alone.
 */
export function foodTrendSignal({
  id,
  value,
  target,
  unit,
  delta,
  sigmaFloor,
  roundTo,
  goodDirection,
  detectors = standard,
}: {
  id: FoodSignalId;
  value: (day: FoodDay, span: FoodSpan) => number | undefined;
  target?: ((day: FoodDay, span: FoodSpan) => number | undefined) | undefined;
  unit: string;
  delta: number;
  sigmaFloor: number;
  roundTo: number;
  goodDirection: TrendDirection | undefined;
  detectors?: readonly TrendDetector[];
}): TrendSignal<FoodSpan> {
  return {
    id,
    series: (span) =>
      span.days.map((day): TrendDay => {
        if (day.intake === undefined) return { date: day.date, value: undefined, eligible: false, reason: 'unlogged' };
        const v = value(day, span);
        if (!day.whole) return { date: day.date, value: v, eligible: false, reason: 'partial' };
        if (v === undefined || !Number.isFinite(v)) return { date: day.date, value: undefined, eligible: false, reason: 'excluded' };
        return {
          date: day.date,
          value: v,
          eligible: true,
          reason: undefined,
          target: target?.(day, span),
          relativeSigma: day.intake.relativeSigma,
          estimatedShare: day.intake.estimatedShare,
          planned: day.kind !== 'none',
        };
      }),
    unit,
    delta,
    sigmaFloor,
    roundTo,
    family: FoodSignalId.family(id),
    priority: 'coaching',
    goodDirection,
    resolutionIsGoodNews: goodDirection !== undefined,
    actionable: true,
    order: FoodSignalId.order(id),
    aspects: detectors.length === 0 ? [] : ['level', 'drift'],
    detectors,
  };
}
