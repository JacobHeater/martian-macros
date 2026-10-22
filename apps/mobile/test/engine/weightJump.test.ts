import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { IntakeDay } from '../../src/domain/IntakeDay';
import { Workout } from '../../src/domain/training/Workout';
import { TargetShape } from '../../src/domain/TargetShape';
import type { WeightEvent } from '../../src/domain/WeightEvent';
import { WeekShape } from '../../src/domain/WeekShape';
import { DailyTargets } from '../../src/engine/DailyTargets';
import { explainWeightJump } from '../../src/engine/explainWeightJump';
import { fatMassKcalPerKg } from '../../src/engine/partitionConstants';
import { TargetShapeLimits } from '../../src/engine/TargetShapeLimits';
import { TargetsRecord } from '../../src/engine/TargetsRecord';
import { WeightJumpRule } from '../../src/engine/WeightJumpRule';
import { weightJumpWithheld } from '../../src/engine/weightJumpWithheld';
import { WeightTrendPoint } from '../../src/engine/WeightTrendPoint';
import type { InsightSafeguards } from '../../src/engine/InsightSafeguards';
import { expectClose } from '../support/expectClose';

/** MM-142: when the scale jumps, what in the log probably did it. */
const today = CalendarDate.of(2026, 10, 20);

const point = (daysAgo: number, levelKg = 80) =>
  new WeightTrendPoint({
    date: today.addDays(-daysAgo),
    levelKg,
    slopeKgPerDay: 0,
    waterKg: 0,
    levelVariance: 0.04,
    slopeVariance: 0.001,
    observed: true,
    rejected: false,
  });
const trend = Array.from({ length: 30 }, (_, i) => point(29 - i));

/** Fourteen ordinary days before the two searched, then the two given: [carbs, kcal]. */
const intakeWith = (yesterday: { carbs?: number; kcal?: number; complete?: boolean } = {}, dayBefore: { carbs?: number } = {}) => {
  const days: IntakeDay[] = [];
  for (let daysAgo = 16; daysAgo >= 3; daysAgo--) {
    days.push(new IntakeDay({ date: today.addDays(-daysAgo), kcal: 2200, proteinG: 150, carbsG: 230, fatG: 70, completeness: 'complete' }));
  }
  days.push(new IntakeDay({ date: today.addDays(-2), kcal: 2200, proteinG: 150, carbsG: dayBefore.carbs ?? 230, fatG: 70, completeness: 'complete' }));
  days.push(
    new IntakeDay({
      date: today.addDays(-1),
      kcal: yesterday.kcal ?? 2200,
      proteinG: 150,
      carbsG: yesterday.carbs ?? 230,
      fatG: 70,
      completeness: yesterday.complete === false ? 'partial' : 'complete',
    }),
  );
  return days;
};

const targets = (kcal: number, from = today.addDays(-40)) =>
  new TargetsRecord({
    effectiveFrom: from,
    mode: 'fatLoss',
    tdeeKcal: 2500,
    tdeeSigmaKcal: 200,
    tdeeStatus: 'updated',
    targets: new DailyTargets({ kcal, proteinG: 160, fatG: 70, carbsG: 230, weeklyRateFraction: -0.005 }),
  });

const explain = (readingKg: number, rest: Partial<Parameters<typeof explainWeightJump>[0]> = {}) =>
  explainWeightJump({ reading: { date: today, weightKg: readingKg }, trend, ...rest });

const entry = (daysAgo: number, { sodiumMg, alcoholG, kcal = 500 }: { sodiumMg?: number; alcoholG?: number; kcal?: number }) =>
  new FoodEntry({ id: 0, date: today.addDays(-daysAgo), meal: 'dinner', name: 'Food', kcal, proteinG: 20, carbsG: 50, fatG: 15, source: 'weighed', sodiumMg, alcoholG });

describe('when a reading is explained', () => {
  it('a reading inside one standard deviation of the water noise is not', () => {
    expect(explain(80.2)).toBeUndefined();
    expect(explain(79.8)).toBeUndefined();
  });

  it('a reading at the threshold is, above or below the trend', () => {
    expectClose(explain(80.48)?.deviationKg, 0.48, 1e-9);
    expect(explain(80.48)?.above).toBe(true);
    expect(explain(79.5)?.above).toBe(false);
    expectClose(explain(79.5)?.thresholdKg, WeightJumpRule.noiseFraction * 80, 1e-9);
  });

  it('a day with no trend point has no explanation', () => {
    expect(explainWeightJump({ reading: { date: today.addDays(1), weightKg: 82 }, trend })).toBeUndefined();
  });

  it('the arithmetic line uses the energy in fat: 1.1 kg is about 10,400 kcal', () => {
    expectClose(explain(81.1)?.fatKcal, 1.1 * fatMassKcalPerKg, 1e-6);
  });
});

describe('the causes', () => {
  it('a high-carbohydrate day names the carbohydrate with both figures', () => {
    const e = explain(81.1, { intake: intakeWith({ carbs: 340 }) });
    expect(e?.causes.map((c) => c.kind)).toEqual(['carbohydrate']);
    expect(e?.causes[0]?.figures).toEqual({ daysAgo: 1, amount: 340, usual: 230 });
  });

  it('carbohydrate under 30% above the usual is not a cause', () => {
    expect(explain(81.1, { intake: intakeWith({ carbs: 290 }) })?.causes).toEqual([]);
  });

  it('the day before yesterday counts too, and the larger excess is named', () => {
    const e = explain(81.1, { intake: intakeWith({ carbs: 300 }, { carbs: 400 }) });
    expect(e?.causes[0]?.figures['daysAgo']).toBe(2);
    expect(e?.causes[0]?.figures['amount']).toBe(400);
  });

  it('a usual of fewer than five logged days says nothing about carbohydrate', () => {
    const thin = intakeWith({ carbs: 340 }).filter((d) => d.date.daysUntil(today) <= 4);
    expect(explain(81.1, { intake: thin })?.causes).toEqual([]);
  });

  it('several causes are listed in order, at most three', () => {
    const e = explain(81.1, {
      intake: intakeWith({ carbs: 340, kcal: 3200 }),
      history: [targets(2100)],
      workouts: [new Workout({ id: 1, date: today.addDays(-1), startedAt: new Date(2026, 9, 19, 18), endedAt: new Date(2026, 9, 19, 19) })],
      entries: [entry(1, { alcoholG: 28 })],
    });
    expect(e?.causes.map((c) => c.kind)).toEqual(['carbohydrate', 'calories', 'alcohol']);
    expect(e?.causes).toHaveLength(WeightJumpRule.maxCauses);
  });

  it('a workout still in progress is not a cause; a finished one yesterday or the day before is', () => {
    const open = new Workout({ id: 1, date: today.addDays(-1), startedAt: new Date(2026, 9, 19, 18) });
    expect(explain(81.1, { workouts: [open] })?.causes).toEqual([]);
    const done = new Workout({ id: 2, date: today.addDays(-2), startedAt: new Date(2026, 9, 18, 18), endedAt: new Date(2026, 9, 18, 19) });
    expect(explain(81.1, { workouts: [done] })?.causes).toEqual([{ kind: 'workout', figures: { daysAgo: 2 } }]);
    const old = new Workout({ id: 3, date: today.addDays(-3), startedAt: new Date(2026, 9, 17, 18), endedAt: new Date(2026, 9, 17, 19) });
    expect(explain(81.1, { workouts: [old] })?.causes).toEqual([]);
  });

  it('nothing in the log leaves the causes empty, honestly', () => {
    const e = explain(81, { intake: intakeWith() });
    expect(e).toBeDefined();
    expect(e?.causes).toEqual([]);
  });

  it('a low reading the morning after an illness event names the event', () => {
    const events: WeightEvent[] = [{ date: today.addDays(-1), type: 'illness' }];
    const e = explain(79, { weightEvents: events, intake: intakeWith() });
    expect(e?.above).toBe(false);
    expect(e?.causes).toEqual([{ kind: 'weightEvent', figures: { daysAgo: 1 }, eventType: 'illness' }]);
  });

  it('an event three or more days back is not a cause', () => {
    expect(explain(81, { weightEvents: [{ date: today.addDays(-3), type: 'travel' }] })?.causes).toEqual([]);
    expect(explain(81, { weightEvents: [{ date: today, type: 'largeOrSaltyMeal' }] })?.causes[0]?.kind).toBe('weightEvent');
  });

  it('a real overshoot says how much could be fat at most', () => {
    const e = explain(81.1, { intake: intakeWith({ kcal: 5100 }), history: [targets(2100)] });
    const calories = e?.calories;
    expect(calories?.figures['overTargetKcal']).toBe(3000);
    expect(calories?.figures['overExpenditureKcal']).toBe(2600);
    expectClose(calories?.figures['fatAtMostKg'], 2600 / fatMassKcalPerKg, 1e-9);
  });

  it('over target but under expenditure could store no fat', () => {
    const e = explain(80.6, { intake: intakeWith({ kcal: 2400 }), history: [targets(2100)] });
    expect(e?.calories?.figures['fatAtMostKg']).toBe(0);
  });

  it('calories inside the band are no cause, and a partial day under it says nothing', () => {
    expect(explain(81.1, { intake: intakeWith({ kcal: 2200 }), history: [targets(2100)] })?.calories).toBeUndefined();
    expect(explain(79, { intake: intakeWith({ kcal: 1200, complete: false }), history: [targets(2100)] })?.calories).toBeUndefined();
    const low = explain(79, { intake: intakeWith({ kcal: 1200 }), history: [targets(2100)] })?.calories;
    expect(low?.figures['overTargetKcal']).toBe(-900);
    expectClose(low?.figures['fatAtMostKg'], 1300 / fatMassKcalPerKg, 1e-9);
  });

  it('a planned higher day eaten as planned is judged against its own target, not the flat one (MM-124)', () => {
    const yesterday = today.addDays(-1);
    const shapes = [new TargetShape({ since: today.addDays(-40), week: new WeekShape({ higherDays: [yesterday.weekday], raise: 0.2 }) })];
    const limits = new TargetShapeLimits({ floorKcal: 1500, sex: 'male', trendWeightKg: 80, heightCm: 180 });
    const rest = { intake: intakeWith({ kcal: 2400 }), history: [targets(2000)] };
    expect(explain(81.1, rest)?.calories?.figures['targetKcal']).toBe(2000);
    expect(explain(81.1, { ...rest, shapes, limits })?.calories).toBeUndefined();
    // Well over the day's own target is still a cause, said against that target.
    const over = explain(81.1, { ...rest, intake: intakeWith({ kcal: 3400 }), shapes, limits })?.calories;
    expectClose(over?.figures['targetKcal'], 2400, 1);
  });

  it('a low reading mirrors the carbohydrate rule: a day well under the usual', () => {
    expect(explain(79, { intake: intakeWith({ carbs: 120 }) })?.causes[0]?.kind).toBe('carbohydrate');
    expect(explain(79, { intake: intakeWith({ carbs: 340 }) })?.causes).toEqual([]);
  });

  it('sodium fires only when enough of each day states it', () => {
    const entries: FoodEntry[] = [];
    for (let daysAgo = 16; daysAgo >= 2; daysAgo--) entries.push(entry(daysAgo, { sodiumMg: 2000, kcal: 2000 }));
    const covered = [...entries, entry(1, { sodiumMg: 4000, kcal: 2000 })];
    expect(explain(81.1, { entries: covered })?.causes).toEqual([{ kind: 'sodium', figures: { daysAgo: 1, amount: 4000, usual: 2000 } }]);
    // Yesterday's sodium is stated for only half its calories: not judged.
    const patchy = [...entries, entry(1, { sodiumMg: 4000, kcal: 1000 }), entry(1, { kcal: 1000 })];
    expect(explain(81.1, { entries: patchy })?.causes).toEqual([]);
  });

  it('alcohol yesterday is a cause either way', () => {
    expect(explain(81.1, { entries: [entry(1, { alcoholG: 28 })] })?.causes).toEqual([{ kind: 'alcohol', figures: { alcoholG: 28, daysAgo: 1 } }]);
    expect(explain(79, { entries: [entry(2, { alcoholG: 14 })] })?.causes[0]?.figures['daysAgo']).toBe(2);
  });

  it('a reading inside a cycle window names the window', () => {
    const flowDays = [{ date: today.addDays(2) }, { date: today.addDays(3) }];
    expect(explain(81, { flowDays })?.causes).toEqual([{ kind: 'cycleWindow', figures: {} }]);
    expect(explain(81, { flowDays: [{ date: today.addDays(10) }] })?.causes).toEqual([]);
  });

  it('the first days after a change of phase are named, with the day count', () => {
    const history = [targets(2500, today.addDays(-40)), targets(1900, today.addDays(-4))];
    expect(explain(79, { history })?.causes).toEqual([{ kind: 'phaseChange', figures: { daysSince: 4 } }]);
    const settled = [targets(2500, today.addDays(-40)), targets(1900, today.addDays(-12))];
    expect(explain(79, { history: settled })?.causes).toEqual([]);
  });
});

describe('when it is kept back', () => {
  const safeguards: InsightSafeguards = { adult: true, eatingDisorderHistory: false, weightHidden: false, paused: false, underEating: false, cautions: new Set() };
  it('for an adult with weight shown it is said', () => {
    expect(weightJumpWithheld(safeguards)).toBe(false);
  });
  it('under 18, with an eating-disorder history, or with weight hidden it is not', () => {
    expect(weightJumpWithheld({ ...safeguards, adult: false })).toBe(true);
    expect(weightJumpWithheld({ ...safeguards, eatingDisorderHistory: true })).toBe(true);
    expect(weightJumpWithheld({ ...safeguards, weightHidden: true })).toBe(true);
  });
});
