import { expect, it } from 'vitest';
import { DailyTargets } from '../../src/engine/DailyTargets';
import { displayTargets } from '../../src/format/displayTargets';

/** MM-123: targets as the screens show them, rounded to what food can be measured to. */
const computed = new DailyTargets({
  kcal: 2473,
  proteinG: 172,
  proteinMinimumG: 128,
  fatG: 68,
  carbsG: 231,
  weeklyRateFraction: -0.005,
  flags: new Set(['rateLimited']),
});

it('calories to the nearest 25 and grams to the nearest 5', () => {
  const shown = displayTargets(computed);
  expect(shown.kcal).toBe(2475);
  expect(shown.proteinG).toBe(170);
  expect(shown.proteinMinimumG).toBe(130);
  expect(shown.fatG).toBe(70);
  expect(shown.carbsG).toBe(230);
});

it('the pace and the flags come through unchanged', () => {
  const shown = displayTargets(computed);
  expect(shown.weeklyRateFraction).toBe(-0.005);
  expect([...shown.flags]).toEqual(['rateLimited']);
});

it('the stored targets are left exact', () => {
  displayTargets(computed);
  expect(computed.kcal).toBe(2473);
});

it('with exact targets on, nothing is rounded', () => {
  expect(displayTargets(computed, { exact: true })).toBe(computed);
});

it('halves round away from zero, and a missing minimum stays missing', () => {
  const shown = displayTargets(new DailyTargets({ kcal: 2412.5, proteinG: 162.5, fatG: 70, carbsG: 250, weeklyRateFraction: 0 }));
  expect(shown.kcal).toBe(2425);
  expect(shown.proteinG).toBe(165);
  expect(shown.proteinMinimumG).toBeUndefined();
});
