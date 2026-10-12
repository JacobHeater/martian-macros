import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain';
import { BodyFatEstimate, lossSafetyRaiseKcal, type TargetsRecord, type WeightTrendPoint } from '../../src/engine';
import { deficitStartingOn, trendOf } from './support/trendPoints';

/** MM-115: when loss outruns the limit, raise calories now. */
const start = CalendarDate.of(2026, 1, 1);
const bodyFat25 = new BodyFatEstimate({ percent: 25, sigmaPercent: 3 });
const bodyFat11 = new BodyFatEstimate({ percent: 11, sigmaPercent: 3 });

const raise = ({
  trend,
  history = [],
  bodyFat = bodyFat25,
}: {
  trend: readonly WeightTrendPoint[];
  history?: readonly TargetsRecord[];
  bodyFat?: BodyFatEstimate;
}) =>
  lossSafetyRaiseKcal({
    trend,
    history,
    sex: 'male',
    bodyFat,
    safetyBodyFatPercent: bodyFat.percent,
    resistanceTrained: true,
  });

it('a clear loss over the limit raises the target by the excess', () => {
  // 1.2% a week against a 1.0% limit at 25% body fat: 0.2% of 90 kg is
  // 0.18 kg a week, about 8,200 kcal a kg, so about 210 kcal a day.
  const kcal = raise({ trend: trendOf({ start, lossFractionPerWeek: 0.012 }) });
  expect(kcal).toBeGreaterThanOrEqual(150);
  expect(kcal).toBeLessThanOrEqual(260);
});

it('a loss within the limit raises nothing', () => {
  expect(raise({ trend: trendOf({ start, lossFractionPerWeek: 0.009 }) })).toBe(0);
});

it('one raise is capped at 400 kcal', () => {
  expect(raise({ trend: trendOf({ start, lossFractionPerWeek: 0.02 }) })).toBe(400);
});

it('the first week of a deficit does not count', () => {
  // A deficit began 8 days before the last trend day (a 1.8 kg drop in
  // the first 8 days is glycogen and water).
  const history = [deficitStartingOn(start.addDays(13))];
  expect(raise({ trend: trendOf({ start, lossFractionPerWeek: 0.02 }), history })).toBe(0);
});

it('days just after the settling window are not enough yet', () => {
  // The window covers days 8 to 17; only 4 weigh-ins in the last 14 days
  // fall outside it.
  const history = [deficitStartingOn(start.addDays(8))];
  expect(raise({ trend: trendOf({ start, lossFractionPerWeek: 0.02 }), history })).toBe(0);
});

it('once enough weigh-ins fall outside the window, it counts', () => {
  const history = [deficitStartingOn(start)];
  expect(raise({ trend: trendOf({ start, lossFractionPerWeek: 0.02 }), history })).toBeGreaterThan(0);
});

it('too few weigh-ins is not clear enough', () => {
  // A weigh-in every third day: 5 or fewer in the last 14 days.
  expect(raise({ trend: trendOf({ start, lossFractionPerWeek: 0.013, observedEvery: 3 }) })).toBe(0);
});

it('a pace that is not clearly over its own uncertainty raises nothing', () => {
  // 1.3% a week, but the pace is uncertain by 0.5% a week: 1.3 - 1.5 x
  // 0.5 is below the 1.0% limit.
  expect(
    raise({ trend: trendOf({ start, lossFractionPerWeek: 0.013, slopeSigmaFractionPerWeek: 0.005 }) }),
  ).toBe(0);
});

it('the limit is lower for lean users', () => {
  const trend = trendOf({ start, lossFractionPerWeek: 0.009 });
  expect(raise({ trend, bodyFat: bodyFat25 }), 'limit 1.0%').toBe(0);
  expect(raise({ trend, bodyFat: bodyFat11 }), 'limit 0.5% at 11% body fat').toBeGreaterThan(0);
});

it('gaining or holding weight never raises anything', () => {
  expect(raise({ trend: trendOf({ start, lossFractionPerWeek: 0 }) })).toBe(0);
  expect(raise({ trend: trendOf({ start, lossFractionPerWeek: -0.005 }) })).toBe(0);
});

it('no trend, no raise', () => {
  expect(raise({ trend: [] })).toBe(0);
});
