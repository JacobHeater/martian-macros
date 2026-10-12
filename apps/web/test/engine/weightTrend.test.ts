import { expect, it } from 'vitest';
import { CalendarDate, type WeightObservation } from '../../src/domain';
import { WeightTrendModel } from '../../src/engine/WeightTrendModel';
import type { WeightTrendPoint } from '../../src/engine/WeightTrendPoint';
import { DartRandom } from '../support/DartRandom';
import { expectClose } from '../support/expectClose';

const model = new WeightTrendModel();
const start = CalendarDate.of(2026, 1, 1);

function noisyLine({
  days,
  startKg,
  slopeKgPerDay,
  sigmaKg = 0.6,
  seed = 1,
}: {
  days: number;
  startKg: number;
  slopeKgPerDay: number;
  sigmaKg?: number;
  seed?: number;
}): WeightObservation[] {
  const random = new DartRandom(seed);
  const gauss = () => {
    const radius = Math.sqrt(-2 * Math.log(1 - random.nextDouble()));
    return radius * Math.cos(2 * Math.PI * random.nextDouble());
  };
  const out: WeightObservation[] = [];
  for (let d = 0; d < days; d++) {
    out.push({ date: start.addDays(d), weightKg: startKg + slopeKgPerDay * d + gauss() * sigmaKg });
  }
  return out;
}

const at = (trend: readonly WeightTrendPoint[], i: number) => trend[i] as WeightTrendPoint;
const lastOf = (trend: readonly WeightTrendPoint[]) => at(trend, trend.length - 1);

it('returns nothing without observations', () => {
  expect(model.smooth([])).toEqual([]);
});

it('recovers a steady loss rate through day-to-day water noise', () => {
  const trend = model.smooth(noisyLine({ days: 42, startKg: 90, slopeKgPerDay: -0.08 }));
  expect(trend).toHaveLength(42);
  const weekly = lastOf(trend).slopeKgPerDay * 7;
  expectClose(weekly, -0.56, 0.15);
  // Interior smoothed levels are far closer to the truth than a raw
  // weigh-in (sigma 0.6 kg).
  for (const day of [10, 20, 30]) {
    expectClose(at(trend, day).levelKg, 90 - 0.08 * day, 0.3);
  }
});

it('treats flat weight as flat', () => {
  const trend = model.smooth(noisyLine({ days: 28, startKg: 80, slopeKgPerDay: 0, seed: 7 }));
  expectClose(lastOf(trend).slopeKgPerDay * 7, 0, 0.2);
});

it('rejects a pounds-for-kilograms entry', () => {
  const obs = noisyLine({ days: 21, startKg: 81.6, slopeKgPerDay: 0 });
  obs[10] = { date: start.addDays(10), weightKg: 180 };
  const trend = model.smooth(obs);
  expect(at(trend, 10).rejected).toBe(true);
  expect(at(trend, 10).observed).toBe(false);
  expectClose(at(trend, 10).levelKg, 81.6, 0.6);
});

it('accepts a real step change after repeated rejections', () => {
  const obs = noisyLine({ days: 14, startKg: 80, slopeKgPerDay: 0 });
  for (let d = 14; d < 28; d++) obs.push({ date: start.addDays(d), weightKg: 88 });
  const trend = model.smooth(obs);
  expectClose(lastOf(trend).levelKg, 88, 1.0);
  expect(lastOf(trend).rejected).toBe(false);
});

it('fills gaps and is less certain inside them', () => {
  const full = noisyLine({ days: 30, startKg: 80, slopeKgPerDay: 0 });
  const gapped = [...full];
  gapped.splice(10, 10);
  const withGap = model.smooth(gapped);
  expect(withGap).toHaveLength(30);
  expect(at(withGap, 15).observed).toBe(false);
  expect(at(withGap, 15).levelVariance).toBeGreaterThan(at(model.smooth(full), 15).levelVariance);
});

it('extends through a later date with no weigh-ins', () => {
  const trend = model.smooth(noisyLine({ days: 10, startKg: 80, slopeKgPerDay: 0 }), { through: start.addDays(13) });
  expect(lastOf(trend).date).toBe(start.addDays(13));
});

it('noise multiplier reduces the pull of widened days', () => {
  const obs = noisyLine({ days: 21, startKg: 80, slopeKgPerDay: 0, sigmaKg: 0 });
  obs[20] = { date: start.addDays(20), weightKg: 81.5 };
  const plain = lastOf(model.smooth(obs)).levelKg;
  const widened = lastOf(
    model.smooth(obs, { noiseMultiplier: (d) => (d === start.addDays(20) ? 2.0 : 1.0) }),
  ).levelKg;
  expect(widened).toBeLessThan(plain);
});

// Not in the Dart tests: the smoothed trend for a fixed series, as the Dart
// VM printed it. The filter uses only +, -, *, / and square root, so the
// two languages must agree to the last digit.
it('gives digit for digit what the Dart engine gives', () => {
  const series: WeightObservation[] = [];
  for (let i = 0; i < 60; i++) {
    if (i % 5 === 3) continue;
    const kg = Math.round((82.3 - 0.07 * i + 0.6 * Math.sin(i * 1.7) + (i === 17 ? 2.4 : 0)) * 100) / 100;
    series.push({ date: CalendarDate.fromEpochDay(20000 + i), weightKg: kg });
  }
  const end = lastOf(model.smooth(series));
  expect([end.date.epochDay, end.levelKg, end.slopeKgPerDay, end.waterKg, end.levelVariance]).toEqual([
    20059, 78.13418869168761, -0.07346757153593872, -0.07948020450016254, 0.08181231770386606,
  ]);
});
