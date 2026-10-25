import { describe, expect, it } from 'vitest';
import { CalendarDate, IntakeDay } from '../../src/domain';
import { styleSwitchOf } from '../../src/engine';

/** MM-605: the logging-style switch, shared by the estimator (MM-27) and the trend engine. */
const start = CalendarDate.of(2026, 9, 1);
const day = (i: number, weighedShare: number) =>
  new IntakeDay({ date: start.addDays(i), kcal: 2000, proteinG: 120, carbsG: 200, fatG: 70, weighedShare });

describe('styleSwitchOf', () => {
  it('finds the first day of the latest style, hand portions to a scale', () => {
    const days = Array.from({ length: 20 }, (_, i) => day(i, i < 10 ? 0 : 1));
    expect(styleSwitchOf(days, 0.5, 7)).toBe(start.addDays(10));
  });

  it('finds nothing under the threshold, or without enough days on each side', () => {
    expect(styleSwitchOf(Array.from({ length: 20 }, (_, i) => day(i, i < 10 ? 0 : 0.4)), 0.5, 7)).toBeUndefined();
    expect(styleSwitchOf(Array.from({ length: 20 }, (_, i) => day(i, i < 17 ? 0 : 1)), 0.5, 7)).toBeUndefined();
  });
});
