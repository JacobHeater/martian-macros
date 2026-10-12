import { expect, it } from 'vitest';
import { CalendarDate, FiberDay, fiberGuideG, FoodEntry } from '../../src/domain';
import { expectClose } from '../support/expectClose';

/** MM-126: a fiber guide that is shown only when the data supports it. */
const day = CalendarDate.of(2026, 10, 5);

const entry = (kcal: number, fiber?: number) =>
  new FoodEntry({
    id: 0,
    date: day,
    meal: 'lunch',
    name: 'x',
    kcal,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    source: 'weighed',
    fiberG: fiber,
  });

it('the guide is 14 g per 1,000 kcal', () => {
  expectClose(fiberGuideG({ kcalTarget: 2400, sex: 'male' }), 33.6, 1e-9);
});

it('the minimum holds at low calories', () => {
  expect(fiberGuideG({ kcalTarget: 1300, sex: 'female' })).toBe(21);
  expect(fiberGuideG({ kcalTarget: 1300, sex: 'male' })).toBe(25);
});

it('enough data: 85% of calories carry a fiber value', () => {
  const d = FiberDay.of([entry(850, 20), entry(150)]);
  expectClose(d.coveredShare, 0.85, 1e-9);
  expect(d.enough).toBe(true);
  expect(d.totalG).toBe(20);
});

it('not enough data: 40% of calories were typed', () => {
  const d = FiberDay.of([entry(600, 12), entry(400)]);
  expect(d.enough).toBe(false);
});

it('an empty day has no coverage', () => {
  expect(FiberDay.of([]).enough).toBe(false);
});
