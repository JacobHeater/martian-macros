import { expect, it } from 'vitest';
import { intakeStepsOf } from '../../src/domain/food/timeline/intakeStepsOf';
import { usualDayOf } from '../../src/domain/food/timeline/usualDayOf';
import { usualKcalAt } from '../../src/domain/food/timeline/usualKcalAt';
import { mealUsualMinute } from '../../src/domain/mealUsualMinute';

/** MM-571: the day's running total, step by step in the order eaten. */
it('steps run in the order eaten, add up, and join foods of one meal at one minute', () => {
  const steps = intakeStepsOf([
    { kcal: 700, meal: 'dinner', eatenAt: 19 * 60 + 15 },
    { kcal: 315, meal: 'breakfast', eatenAt: 7 * 60 + 40 },
    { kcal: 360, meal: 'breakfast', eatenAt: 7 * 60 + 40 },
    { kcal: 713, meal: 'lunch', eatenAt: 12 * 60 + 30 },
    { kcal: 500, meal: 'dinner', eatenAt: 19 * 60 + 15 },
  ]);
  expect(steps.map((s) => [s.minute, s.added, s.total, s.meal])).toEqual([
    [460, 675, 675, 'breakfast'],
    [750, 713, 1388, 'lunch'],
    [1155, 1200, 2588, 'dinner'],
  ]);
  expect(steps.every((s) => !s.approximate)).toBe(true);
});

it('a food without a time stands at its meal’s usual time, marked approximate, apart from timed foods there', () => {
  const steps = intakeStepsOf([
    { kcal: 200, meal: 'snack', eatenAt: undefined },
    { kcal: 300, meal: 'breakfast', eatenAt: undefined },
    { kcal: 100, meal: 'snack', eatenAt: mealUsualMinute('snack') },
    { kcal: 0, meal: 'lunch', eatenAt: 12 * 60 },
  ]);
  expect(steps.map((s) => [s.minute, s.added, s.approximate])).toEqual([
    [480, 300, true],
    [930, 200, true],
    [930, 100, false],
  ]);
  expect(steps.at(-1)?.total).toBe(600);
});

// MM-572: the usual day is built now, and waits openly for enough days with meal times (owner, 2026-10-22).
it('the usual day waits for 7 fully timed days, then is the median total so far every 15 minutes', () => {
  const timedDay = (lunch: number) => [
    { kcal: 500, meal: 'breakfast' as const, eatenAt: 8 * 60 },
    { kcal: lunch, meal: 'lunch' as const, eatenAt: 12 * 60 + 30 },
  ];
  const halfTimed = [
    { kcal: 500, meal: 'breakfast' as const, eatenAt: 8 * 60 },
    { kcal: 700, meal: 'lunch' as const, eatenAt: undefined },
  ];
  const waiting = usualDayOf([timedDay(600), timedDay(600), halfTimed, []]);
  expect(waiting).toEqual({ timedDays: 2, needed: 7, curve: undefined });
  expect(usualKcalAt(waiting, 600)).toBeUndefined();

  const usual = usualDayOf([600, 700, 800, 900, 1000, 1100, 1200].map(timedDay));
  expect(usual.timedDays).toBe(7);
  expect(usual.curve).toHaveLength(97);
  expect(usualKcalAt(usual, 7 * 60)).toBe(0);
  expect(usualKcalAt(usual, 9 * 60)).toBe(500);
  // The median lunch of the seven is 900.
  expect(usualKcalAt(usual, 13 * 60)).toBe(1400);
  expect(usualKcalAt(usual, 24 * 60)).toBe(1400);
});
