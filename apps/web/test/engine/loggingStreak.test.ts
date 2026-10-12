import { describe, expect, it } from 'vitest';
import { CalendarDate, IntakeDay, Pause } from '../../src/domain';
import { loggingStreakOf } from '../../src/engine';

/**
 * MM-92: a logging streak that forgives one missed day and rewards nothing
 * but the work.
 */
const today = CalendarDate.of(2026, 10, 14);

const day = (daysAgo: number, kcal = 2200) =>
  new IntakeDay({
    date: today.addDays(-daysAgo),
    kcal,
    proteinG: 150,
    carbsG: 220,
    fatG: 70,
    completeness: 'complete',
  });

const streak = (
  loggedDaysAgo: readonly number[],
  { pauses = [], kcal = {} }: { pauses?: Pause[]; kcal?: Record<number, number> } = {},
) =>
  loggingStreakOf({
    today,
    intake: loggedDaysAgo.map((d) => day(d, kcal[d] ?? 2200)),
    pauses,
  });

it('nothing logged is no streak', () => {
  expect(streak([]).days).toBe(0);
});

it('whole days in a row count', () => {
  expect(streak([1, 2, 3, 4, 5]).days).toBe(5);
});

it('today counts once it is whole, and is never a miss before', () => {
  expect(streak([0, 1, 2]).days).toBe(3);
  expect(streak([1, 2, 3]).days, 'today not logged yet').toBe(3);
});

it('six complete days, one missed, then another continues', () => {
  const s = streak([1, 2, 3, 4, 5, 6, 8]);
  expect(s.days).toBe(7);
  expect(s.forgivenOn).toBe(today.addDays(-7));
});

it('a second miss within a week breaks it', () => {
  // Complete 1, 2, 4 and 6; missed 3 and 5. The streak ends at the second
  // miss, keeping what came before it: days 1, 2 and 4.
  expect(streak([1, 2, 4, 6]).days).toBe(3);
});

it('two misses a full week apart are two different weeks', () => {
  // Missed days 7 and 14, seven days apart: both are forgiven.
  const s = streak([1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 15]);
  expect(s.days).toBe(13);
});

it('two missed days running break it at once', () => {
  expect(streak([3, 4, 5]).days).toBe(0);
});

it('a missed day just before the latest log is forgiven', () => {
  const s = streak([2, 3, 4]);
  expect(s.days).toBe(3);
  expect(s.forgivenOn).toBe(today.addDays(-1));
});

it('days before the first log are not misses', () => {
  expect(streak([1, 2, 3]).forgivenOn).toBeUndefined();
});

it('eating under target earns nothing extra: a day is a day', () => {
  const low = streak([1, 2, 3], { kcal: { 1: 1700, 2: 2200, 3: 2200 } });
  const high = streak([1, 2, 3], { kcal: { 1: 2800, 2: 2200, 3: 2200 } });
  expect(low.days).toBe(3);
  expect(high.days).toBe(3);
});

it('a partial day is not a whole day', () => {
  const s = loggingStreakOf({
    today,
    intake: [
      day(1),
      new IntakeDay({
        date: today.addDays(-2),
        kcal: 500,
        proteinG: 20,
        carbsG: 50,
        fatG: 10,
        completeness: 'partial',
      }),
      day(3),
      day(4),
    ],
  });
  expect(s.days).toBe(3);
  expect(s.forgivenOn).toBe(today.addDays(-2));
});

describe('a pause', () => {
  const pause = new Pause({ from: today.addDays(-9), to: today.addDays(-3), reason: 'travel' });

  it('neither counts nor breaks the streak', () => {
    const s = streak([1, 2, 10, 11, 12], { pauses: [pause] });
    expect(s.days).toBe(5);
    expect(s.forgivenOn).toBeUndefined();
  });

  it('without it the same log would be broken', () => {
    expect(streak([1, 2, 10, 11, 12]).days).toBe(2);
  });

  it('does not use up the forgiven day', () => {
    // Missed day 3 is paused; day 10 is a real miss and is forgiven.
    const s = streak([1, 2, 11, 12], { pauses: [pause] });
    expect(s.days).toBe(4);
    expect(s.forgivenOn).toBe(today.addDays(-10));
  });
});
