import { describe, expect, it } from 'vitest';
import { CalendarDate, type DayCompleteness, IntakeDay, type WeightObservation } from '../../src/domain';
import { CalorieBand, DailyTargets, intakeStandingOf, summarizeAdherence, TargetsRecord } from '../../src/engine';
import { expectClose } from '../support/expectClose';
import { upTo } from '../support/upTo';

/** MM-149 (and the band of MM-123): what the user did over a week, as facts. */
const through = CalendarDate.of(2026, 3, 14);
const from = through.addDays(-6);

const targets = (kcal: number, { effectiveFrom, proteinMinimumG = 130 }: { effectiveFrom?: CalendarDate; proteinMinimumG?: number } = {}) =>
  new TargetsRecord({
    effectiveFrom: effectiveFrom ?? from.addDays(-30),
    targets: new DailyTargets({ kcal, proteinG: 160, proteinMinimumG, fatG: 70, carbsG: 220, weeklyRateFraction: -0.005 }),
    mode: 'fatLoss',
    tdeeKcal: 2600,
    tdeeSigmaKcal: 200,
    tdeeStatus: 'updated',
  });

const day = (
  offset: number,
  kcal: number,
  {
    protein = 140,
    completeness = 'complete',
    estimatedShare = 0,
  }: { protein?: number; completeness?: DayCompleteness; estimatedShare?: number } = {},
) =>
  new IntakeDay({
    date: from.addDays(offset),
    kcal,
    proteinG: protein,
    carbsG: 200,
    fatG: 70,
    completeness,
    estimatedShare,
  });

const weigh = (offset: number): WeightObservation => ({ date: from.addDays(offset), weightKg: 80 });

const summarize = (
  intake: readonly IntakeDay[],
  { target = 2100, floor = 1500, weights = [] }: { target?: number; floor?: number; weights?: WeightObservation[] } = {},
) => summarizeAdherence({ through, intake, weights, history: [targets(target)], floorKcal: floor });

describe('the band (MM-123)', () => {
  it('is the larger of 5% and 100 kcal', () => {
    expect(new CalorieBand(2400).lowKcal).toBe(2280);
    expect(new CalorieBand(2400).highKcal).toBe(2520);
    expect(new CalorieBand(1400).lowKcal).toBe(1300);
    expect(new CalorieBand(1400).highKcal).toBe(1500);
  });

  it('inside is on target; outside is below or above', () => {
    const at = (kcal: number) => intakeStandingOf({ kcal, targetKcal: 2400 });
    expect(at(2310)).toBe('onTarget');
    expect(at(2200)).toBe('below');
    expect(at(2560)).toBe('above');
  });

  it('below the floor is never on target', () => {
    expect(intakeStandingOf({ kcal: 1450, targetKcal: 1500, floorKcal: 1500 })).toBe('belowFloor');
  });
});

it('a typical week states each fact', () => {
  const s = summarize(
    [
      day(0, 2200),
      day(1, 2150, { protein: 120 }),
      day(2, 2180),
      day(3, 2170),
      day(4, 2200),
      day(5, 900, { completeness: 'partial' }),
    ],
    { weights: upTo(6).map((i) => weigh(i)) },
  );
  expect(s.daysLogged).toBe(6);
  expect(s.completeDays).toBe(5);
  expect(s.weighIns).toBe(6);
  expectClose(s.averageIntakeKcal, 2180, 1e-9);
  expect(s.averageTargetKcal).toBe(2100);
  expect(s.standing).toBe('onTarget');
  expect(s.proteinDays).toBe(4);
  expect(s.mostlyEstimated).toBe(false);
  expect(s.workouts).toBeUndefined();
});

it('over and under by the same amount are the same distance', () => {
  const over = summarize(upTo(5).map((i) => day(i, 2350)));
  const under = summarize(upTo(5).map((i) => day(i, 1850)));
  expect(over.standing).toBe('above');
  expect(under.standing).toBe('below');
  expect(over.distanceKcal).toBe(250);
  expect(under.distanceKcal).toBe(-250);
});

it('a week averaging below the floor is described as below it', () => {
  const s = summarize(
    upTo(6).map((i) => day(i, 1050)),
    { target: 1900 },
  );
  expect(s.standing).toBe('belowFloor');
});

it('partial and unlogged days are not counted against anything', () => {
  const s = summarize([day(0, 2100), day(1, 2100), day(2, 700, { completeness: 'partial' })]);
  expect(s.daysLogged).toBe(3);
  expect(s.completeDays).toBe(2);
  expect(s.averageIntakeKcal, 'rests on the 2 complete days').toBe(2100);
});

it('an unmarked day far below the usual intake is not a whole day', () => {
  const s = summarize([
    ...upTo(5).map((i) => day(i, 2100, { completeness: 'unmarked' })),
    day(5, 600, { completeness: 'unmarked' }),
  ]);
  expect(s.daysLogged).toBe(6);
  expect(s.completeDays).toBe(5);
});

it('a week mostly from estimates says so', () => {
  const s = summarize(upTo(5).map((i) => day(i, 2000, { estimatedShare: 0.6 })));
  expect(s.mostlyEstimated).toBe(true);
  expect(summarize(upTo(5).map((i) => day(i, 2000, { estimatedShare: 0.4 }))).mostlyEstimated).toBe(false);
});

it('with nothing logged there is no average and no standing', () => {
  const s = summarize([]);
  expect(s.daysLogged).toBe(0);
  expect(s.averageIntakeKcal).toBeUndefined();
  expect(s.standing).toBeUndefined();
  expect(s.proteinDays).toBeUndefined();
});

it('the weekly target is the average of the targets in force', () => {
  const s = summarizeAdherence({
    through,
    intake: upTo(7).map((i) => day(i, 2000)),
    weights: [],
    history: [targets(2100), targets(2000, { effectiveFrom: from.addDays(4) })],
  });
  // Four days at 2,100 and three at 2,000.
  expectClose(s.averageTargetKcal, (4 * 2100 + 3 * 2000) / 7, 1e-9);
});

it('days outside the week are not counted', () => {
  const s = summarize([
    new IntakeDay({
      date: from.addDays(-1),
      kcal: 2100,
      proteinG: 140,
      carbsG: 200,
      fatG: 70,
      completeness: 'complete',
    }),
    day(0, 2100),
  ]);
  expect(s.daysLogged).toBe(1);
  expect(s.completeDays).toBe(1);
});
