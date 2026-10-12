import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { WeightObservation } from '../../src/domain/WeightObservation';
import type { DayWeighIn } from '../../src/healthIngest/DayWeighIn';
import { DemoConfiguration } from '../../src/state/DemoConfiguration';
import { mergeWeighIns } from '../../src/state/mergeWeighIns';
import { StateError } from '../../src/lang/StateError';

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

describe('demo configuration', () => {
  it('normal dev/prod configurations never select demo storage', () => {
    for (const environment of ['dev', 'prod']) {
      for (const isAndroid of [false, true]) {
        const config = new DemoConfiguration({ demoApp: false, isAndroid, environment, seed: false });
        expect(config.isDemo).toBe(false);
        expect(config.databaseName).toBe('martian_macros');
        expect(config.seed).toBe(false);
      }
    }
  });

  it('demo storage is distinct and guarded by Android identity and dev env', () => {
    const config = new DemoConfiguration({ demoApp: true, isAndroid: true, environment: 'dev', seed: true });
    expect(config.databaseName).toBe('martian_macros_demo');
    const refused: readonly (readonly [boolean, boolean, string, boolean])[] = [
      [false, true, 'dev', true],
      [false, true, 'prod', true],
      [true, true, 'prod', true],
      [true, true, 'prod', false],
      [true, false, 'dev', true],
    ];
    for (const [demoApp, isAndroid, environment, seed] of refused) {
      expect(() => new DemoConfiguration({ demoApp, isAndroid, environment, seed })).toThrow(StateError);
    }
  });
});
