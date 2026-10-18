import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { WaistObservation } from '../../src/domain/WaistObservation';
import { WaterEntry } from '../../src/domain/water/WaterEntry';
import type { WaterGoal } from '../../src/domain/water/WaterGoal';
import { waistWithinNoiseInsights } from '../../src/engine/waistWithinNoiseInsights';
import { waterFewDaysInsights } from '../../src/engine/waterFewDaysInsights';

const today = CalendarDate.of(2026, 10, 18);

describe('waistWithinNoiseInsights (MM-367)', () => {
  const triple = (daysAgo: number, cm: number) =>
    new WaistObservation({ date: today.addDays(-daysAgo), waistCm: cm, readings: [cm - 0.2, cm, cm + 0.3] });
  const single = (daysAgo: number, cm: number) => new WaistObservation({ date: today.addDays(-daysAgo), waistCm: cm, readings: [cm] });

  it('says so when a reading moved by the noise or more but the smoothed answer is no clear change', () => {
    const waist = [triple(28, 92.0), triple(21, 92.2), triple(14, 91.8), triple(7, 92.0), single(0, 93.0)];
    const [insight, ...rest] = waistWithinNoiseInsights({ waist });
    expect(rest).toEqual([]);
    expect(insight?.kind).toBe('waistWithinNoise');
    expect(insight?.anchor).toEqual({ kind: 'waist', id: `${today.epochDay}` });
    expect(insight?.subject).toBe('waist');
    expect(insight?.figures).toMatchObject({ latestCm: 93.0, previousCm: 92.0, days: 28 });
    // A single reading at one end: 1.4 × 1.0 × 1.5.
    expect(insight?.figures['thresholdCm']).toBeCloseTo(2.1, 5);
  });

  it('says nothing for a reading much like the last one', () => {
    const waist = [triple(28, 92.0), triple(21, 92.2), triple(14, 91.8), triple(7, 92.0), triple(0, 92.3)];
    expect(waistWithinNoiseInsights({ waist })).toEqual([]);
  });

  it('says nothing when the shared answer is a change', () => {
    const waist = [triple(28, 95.0), triple(21, 94.8), triple(14, 93.0), triple(7, 92.6), triple(0, 91.5)];
    expect(waistWithinNoiseInsights({ waist })).toEqual([]);
  });

  it('says nothing with too little history', () => {
    expect(waistWithinNoiseInsights({ waist: [triple(7, 92.0), triple(0, 93.2)] })).toEqual([]);
    expect(waistWithinNoiseInsights({ waist: [triple(0, 93.2)] })).toEqual([]);
  });
});

describe('waterFewDaysInsights (MM-367)', () => {
  const suggested: WaterGoal = { ml: 2500, suggested: true, suggestedMl: 2500 };
  const onboardedOn = today.addDays(-60);
  const drink = (daysAgo: number) =>
    new WaterEntry({ id: daysAgo, date: today.addDays(-daysAgo), ml: 500, at: new Date(2026, 9, 18 - daysAgo, 9) });
  const say = (entries: WaterEntry[], goal: WaterGoal | undefined = suggested, since = onboardedOn) =>
    waterFewDaysInsights({ entries, goal, onboardedOn: since, today });
  const sayWith = (entries: WaterEntry[], goal: WaterGoal | undefined) => waterFewDaysInsights({ entries, goal, onboardedOn, today });

  it('says so with water on fewer than half of the 14 complete days before today', () => {
    const [insight, ...rest] = say([0, 2, 5, 9, 12].map(drink));
    expect(rest).toEqual([]);
    expect(insight?.kind).toBe('waterFewDays');
    expect(insight?.anchor).toEqual({ kind: 'water', id: `${today.epochDay}` });
    // Today is not counted: a morning with no water yet is not a day without water.
    expect(insight?.figures).toMatchObject({ daysWithWater: 4, windowDays: 14, goalMl: 2500, suggested: 1 });
  });

  it('says nothing at half the days or more', () => {
    expect(say([1, 2, 3, 4, 5, 6, 7].map(drink))).toEqual([]);
  });

  it('says nothing for a person who has not logged water in the two months before', () => {
    expect(say([])).toEqual([]);
    expect(say([drink(90)])).toEqual([]);
    expect(say([drink(40)])).toHaveLength(1);
  });

  it('says nothing in the first two weeks after setup', () => {
    expect(say([drink(2)], suggested, today.addDays(-10))).toEqual([]);
  });

  it('says nothing without a goal, or with a goal the person set while the suggestion is withheld', () => {
    expect(sayWith([drink(2)], undefined)).toEqual([]);
    expect(say([drink(2)], { ml: 1500, suggested: false, suggestedMl: undefined })).toEqual([]);
    // A goal of the person's own beside a suggestion still counts.
    expect(say([drink(2)], { ml: 3000, suggested: false, suggestedMl: 2500 })).toHaveLength(1);
  });
});
