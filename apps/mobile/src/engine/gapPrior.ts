import type { CalendarDate } from '../domain/CalendarDate';
import type { ActivityGap } from './ActivityGap';
import { GapRule } from './GapRule';
import type { TargetsRecord } from './TargetsRecord';
import type { TdeePrior } from './TdeePrior';
import type { WeightTrendPoint } from './WeightTrendPoint';

/**
 * The starting estimate after a gap (MM-147), or undefined when the usual
 * prior applies.
 *
 * Expenditure changes slowly, so a hard-won measurement is kept, not
 * discarded: after a gap of four weeks or more whose end still falls inside
 * the estimation window, the last measured expenditure becomes the starting
 * estimate with its uncertainty widened to 10%. If weight changed by more
 * than 5% across a gap of any length, that figure is first moved by the
 * change in resting energy, since it is then clearly stale.
 */
export function gapPrior({
  gaps,
  history,
  trend,
  asOf,
  windowDays,
  profileRevision,
  restingEnergyAt,
}: {
  gaps: readonly ActivityGap[];
  history: readonly TargetsRecord[];
  trend: readonly WeightTrendPoint[];
  asOf: CalendarDate;
  windowDays: number;
  profileRevision: number;
  restingEnergyAt: (weightKg: number) => number;
}): TdeePrior | undefined {
  const windowStart = asOf.addDays(1 - windowDays);
  const recent = gaps.filter((g) => !g.to.isBefore(windowStart));
  const gap = recent[recent.length - 1];
  const latest = trend[trend.length - 1];
  if (gap === undefined || latest === undefined) return undefined;
  const before = trend.filter((p) => p.date.isBefore(gap.from));
  const lastBefore = before[before.length - 1];
  if (lastBefore === undefined) return undefined;
  const weightBefore = lastBefore.levelKg;
  const weightNow = latest.levelKg;
  const changed = Math.abs(weightNow / weightBefore - 1) > GapRule.rescaleWeightChange;
  if (gap.days < GapRule.recalibrateDays && !changed) return undefined;

  const measured = history.filter(
    (r) => !r.effectiveFrom.isAfter(gap.from) && r.profileRevision === profileRevision && r.tdeeStatus === 'updated',
  );
  const last = measured[measured.length - 1];
  if (last === undefined) return undefined;
  const kcal = changed ? last.tdeeKcal + restingEnergyAt(weightNow) - restingEnergyAt(weightBefore) : last.tdeeKcal;
  return {
    kcal,
    sigmaKcal: Math.max(last.tdeeSigmaKcal, kcal * GapRule.recalibrateSigmaFraction),
  };
}
