import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { WeightObservation } from '../../src/domain/WeightObservation';
import type { DayWeighIn } from '../../src/healthIngest/DayWeighIn';
import { mergeWeighIns } from '../../src/state/mergeWeighIns';

/** MM-68 and MM-71: imported weigh-ins become the app's weigh-ins, and a typed value overrules them. */
describe('merging', () => {
  const today = CalendarDate.of(2026, 10, 5);

  const imported = (daysAgo: number, kg: number): DayWeighIn => {
    const date = today.addDays(-daysAgo);
    return {
      day: new Date(date.year, date.month - 1, date.day),
      kg,
      basis: 'firstMorning',
      sourceName: 'Bathroom scale',
      readings: 1,
    };
  };
  const typed = (daysAgo: number, kg: number): WeightObservation => ({ date: today.addDays(-daysAgo), weightKg: kg });
  const merged = (typedOnes: WeightObservation[], importedOnes: DayWeighIn[]) =>
    mergeWeighIns({ typed: typedOnes, imported: importedOnes, today }).map((w) => [w.date.daysUntil(today), w.weightKg]);

  it('imported days are added to typed ones, oldest first', () => {
    expect(merged([typed(3, 82.5)], [imported(1, 82.1), imported(5, 83)])).toEqual([
      [5, 83],
      [3, 82.5],
      [1, 82.1],
    ]);
  });

  it('a typed value for a day is used instead of the import', () => {
    expect(merged([typed(1, 81)], [imported(1, 82.1)])).toEqual([[1, 81]]);
  });

  it('a reading that cannot be a body weight is left out', () => {
    expect(merged([], [imported(2, 0), imported(1, 820), imported(0, 82)])).toEqual([[0, 82]]);
  });

  it('a reading dated after today is left out', () => {
    expect(merged([], [imported(-1, 82), imported(0, 82.4)])).toEqual([[0, 82.4]]);
  });

  it('with nothing imported it is what was typed', () => {
    expect(merged([typed(1, 82)], [])).toEqual([[1, 82]]);
  });
});
