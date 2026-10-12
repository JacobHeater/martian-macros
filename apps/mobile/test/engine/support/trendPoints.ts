import type { CalendarDate } from '../../../src/domain';
import { DailyTargets, TargetsRecord, WeightTrendPoint } from '../../../src/engine';

/**
 * A synthetic weight trend for the safety checks: `days` points from
 * `start`, losing `lossFractionPerWeek` of `levelKg` a week at a steady
 * pace, with the given uncertainty on the pace. A weigh-in is used on every
 * `observedEvery`th day.
 */
export function trendOf({
  start,
  days = 21,
  levelKg = 90,
  lossFractionPerWeek,
  slopeSigmaFractionPerWeek = 0.0005,
  observedEvery = 1,
}: {
  start: CalendarDate;
  days?: number;
  levelKg?: number;
  lossFractionPerWeek: number;
  slopeSigmaFractionPerWeek?: number;
  observedEvery?: number;
}): WeightTrendPoint[] {
  const slope = (-lossFractionPerWeek * levelKg) / 7;
  const sigmaPerDay = (slopeSigmaFractionPerWeek * levelKg) / 7;
  const points: WeightTrendPoint[] = [];
  for (let i = 0; i < days; i++) {
    points.push(
      new WeightTrendPoint({
        date: start.addDays(i),
        levelKg: levelKg + slope * (i - (days - 1)),
        slopeKgPerDay: slope,
        waterKg: 0,
        levelVariance: 0.04,
        slopeVariance: sigmaPerDay * sigmaPerDay,
        observed: i % observedEvery === 0,
        rejected: false,
      }),
    );
  }
  return points;
}

/**
 * A targets record that starts a deficit on `day`: 500 kcal under
 * expenditure, which opens a settling window.
 */
export function deficitStartingOn(day: CalendarDate): TargetsRecord {
  return new TargetsRecord({
    effectiveFrom: day,
    mode: 'fatLoss',
    tdeeKcal: 2800,
    tdeeSigmaKcal: 300,
    tdeeStatus: 'held',
    targets: new DailyTargets({ kcal: 2300, proteinG: 160, fatG: 70, carbsG: 250, weeklyRateFraction: -0.0075 }),
  });
}
