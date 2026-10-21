import { expect, it } from 'vitest';
import { CalendarDate, type DayCompleteness, IntakeDay } from '../../src/domain';
import { findUnderEating, underEatingNoticeDue } from '../../src/engine';
import { upTo } from '../support/upTo';

/**
 * MM-114: notice sustained intake far below the floor; never a single day,
 * never days the user marked partial.
 */
const through = CalendarDate.of(2026, 3, 14);

const days = (count: number, kcal: number, completeness: DayCompleteness = 'complete') =>
  upTo(count).map(
    (i) => new IntakeDay({ date: through.addDays(-i), kcal, proteinG: 80, carbsG: 100, fatG: 30, completeness }),
  );

const find = (intake: readonly IntakeDay[], floor = 1500) =>
  findUnderEating({ through, intake, floorKcal: floor });

const shift = (by: number) => (d: IntakeDay) =>
  new IntakeDay({
    date: d.date.addDays(-by),
    kcal: d.kcal,
    proteinG: d.proteinG,
    carbsG: d.carbsG,
    fatG: d.fatG,
    completeness: d.completeness,
  });

it('sustained low intake is found, with both figures', () => {
  const f = find(days(9, 1050));
  expect(f?.averageKcal).toBe(1050);
  expect(f?.floorKcal).toBe(1500);
  expect(f?.days).toBe(9);
  expect(f?.lowDays).toHaveLength(9);
});

it('days marked partial never count', () => {
  expect(find(days(9, 1050, 'partial'))).toBeUndefined();
});

it('too few days is not a pattern', () => {
  expect(find(days(4, 1000))).toBeUndefined();
  expect(find(days(6, 1000))).toBeUndefined();
  expect(find(days(7, 1000))).toBeDefined();
});

it('slightly under the floor is not noticed', () => {
  expect(find(days(9, 1420))).toBeUndefined();
  expect(find(days(9, 1350)), 'exactly 10% below').toBeUndefined();
  expect(find(days(9, 1349))).toBeDefined();
});

it('days older than two weeks are not counted', () => {
  const old = upTo(10).map(
    (i) =>
      new IntakeDay({
        date: through.addDays(-(i + 14)),
        kcal: 900,
        proteinG: 60,
        carbsG: 90,
        fatG: 30,
        completeness: 'complete',
      }),
  );
  expect(find(old)).toBeUndefined();
});

it('it clears when the average rises', () => {
  expect(find([...days(5, 1050), ...days(9, 2100).map(shift(5))])).toBeUndefined();
});

it('dismissed, it stays quiet for 14 days', () => {
  const dismissed = CalendarDate.of(2026, 3, 1);
  expect(underEatingNoticeDue({ today: dismissed.addDays(5), dismissedOn: dismissed })).toBe(false);
  expect(underEatingNoticeDue({ today: dismissed.addDays(14), dismissedOn: dismissed })).toBe(true);
  expect(underEatingNoticeDue({ today: dismissed, dismissedOn: undefined })).toBe(true);
});

// MM-113: on a weight-loss medication, five whole days are enough; without the answer, seven.
it('on a weight-loss medication, five whole days are a pattern', () => {
  const onMedication = (intake: readonly IntakeDay[]) =>
    findUnderEating({ through, intake, floorKcal: 1500, weightLossMedication: true });
  expect(onMedication(days(4, 1000))).toBeUndefined();
  expect(onMedication(days(5, 1000))?.days).toBe(5);
  expect(onMedication(days(5, 1350)), 'exactly 10% below').toBeUndefined();
  expect(onMedication(days(5, 1000, 'partial'))).toBeUndefined();
  expect(find(days(5, 1000)), 'not ticked').toBeUndefined();
  expect(findUnderEating({ through, intake: days(6, 1000), floorKcal: 1500, weightLossMedication: false })).toBeUndefined();
});
