import { describe, expect, it } from 'vitest';
import { analyseFoodSpan } from '../../src/engine/analysis/food/analyseFoodSpan';
import { food, inputOf, ownersFatWeek, today, yesterday } from './support/foodAnalysis';

/** MM-621: 7d reads every day logged in the last 7, today included, partial or not, from a single day up. */
describe('7d reads every logged day', () => {
  it('two days logged: the longer spans need 5 judged days and say nothing; 7d reads the two', () => {
    const twoDays = ownersFatWeek().slice(-2);
    expect(analyseFoodSpan(inputOf(twoDays), 7, yesterday).filter((f) => f.kind === 'fix')).toEqual([]);
    expect(analyseFoodSpan(inputOf(twoDays), 7, today, { everyLoggedDay: true }).some((f) => f.kind === 'fix')).toBe(true);
  });

  it('days marked partial and a part-logged today are read, not counted against the week as partial days', () => {
    const week = ownersFatWeek()
      .slice(-6)
      .map((d, i) => (i >= 3 ? { ...d, completeness: 'partial' as const } : d));
    const days = [...week, { date: today, entries: [food(today, 'breakfast', 'Peanut butter', 400, 14, 34)] }];
    const asBefore = analyseFoodSpan(inputOf(days), 7, yesterday);
    expect(asBefore.some((f) => f.signal === 'partialDays')).toBe(true);
    const found = analyseFoodSpan(inputOf(days), 7, today, { everyLoggedDay: true });
    expect(found.some((f) => f.signal === 'partialDays')).toBe(false);
    expect(found.some((f) => f.kind === 'fix')).toBe(true);
  });
});
