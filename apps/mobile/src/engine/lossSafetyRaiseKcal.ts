import type { BiologicalSex } from '../domain/BiologicalSex';
import type { CalendarDate } from '../domain/CalendarDate';
import type { BodyFatEstimate } from './BodyFatEstimate';
import {
  safetyRaiseCapKcal,
  safetyRaiseLookbackDays,
  safetyRaiseMinWeighIns,
  safetyRaiseSigmas,
} from './coachConstants';
import { energyDensityForSlope } from './energyDensityForSlope';
import { SafetyBounds } from './SafetyBounds';
import { settlingWindows } from './settlingWindows';
import type { TargetsRecord } from './TargetsRecord';
import type { WeightTrendPoint } from './WeightTrendPoint';

/**
 * How many kcal a day to add to the target now, because the user is losing
 * weight faster than the fastest pace allowed for their body fat (MM-115).
 * Zero when the pace is within the limit or the evidence is not clear.
 *
 * "Clear" means all of: today is outside the settling window after a change
 * of intake level (early loss is glycogen and water, MM-131); at least
 * `safetyRaiseMinWeighIns` weigh-ins were used in the last
 * `safetyRaiseLookbackDays` days, not counting those inside a settling
 * window; and the trend's loss pace, less `safetyRaiseSigmas` of its own
 * standard deviations, still exceeds the limit. The pace is the trend
 * model's current slope, which already smooths over the recent weigh-ins.
 *
 * The raise is the energy that brings the pace back to the limit, valued
 * with the same lean/fat partition as targets, and capped at
 * `safetyRaiseCapKcal` per check-in.
 */
export function lossSafetyRaiseKcal({
  trend,
  history,
  sex,
  bodyFat,
  safetyBodyFatPercent,
  resistanceTrained,
}: {
  trend: readonly WeightTrendPoint[];
  history: readonly TargetsRecord[];
  sex: BiologicalSex;
  bodyFat: BodyFatEstimate;
  safetyBodyFatPercent: number;
  resistanceTrained: boolean;
}): number {
  const last = trend[trend.length - 1];
  if (last === undefined) return 0;
  const windows = settlingWindows(history);
  const settling = (day: CalendarDate) => windows.some((w) => w.contains(day));
  if (settling(last.date)) return 0;

  const from = last.date.addDays(-(safetyRaiseLookbackDays - 1));
  const weighIns = trend.filter((p) => p.observed && !p.date.isBefore(from) && !settling(p.date)).length;
  if (weighIns < safetyRaiseMinWeighIns) return 0;

  const level = last.levelKg;
  const limit = SafetyBounds.maxWeeklyLossFraction(sex, safetyBodyFatPercent);
  const loss = (-last.slopeKgPerDay * 7) / level;
  const sigma = (Math.sqrt(last.slopeVariance) * 7) / level;
  if (loss - safetyRaiseSigmas * sigma <= limit) return 0;

  const density = energyDensityForSlope({
    slopeKgPerDay: last.slopeKgPerDay,
    fatMassKg: bodyFat.fatMassKg(level),
    resistanceTrained,
  });
  const excessKgPerWeek = (loss - limit) * level;
  return Math.min(safetyRaiseCapKcal, (excessKgPerWeek * density) / 7);
}
