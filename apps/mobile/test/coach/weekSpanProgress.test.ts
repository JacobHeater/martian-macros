import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { supportedAnalysisSpans } from '../../src/engine/analysis/supportedAnalysisSpans';
import { weekSpanProgress } from '../../src/engine/analysis/weekSpanProgress';
import { weekSpanProgressText } from '../../src/format/weekSpanProgressText';

/** MM-620: while only 1d is offered, the section says what opens 7d, on the switcher's own rule. */
const today = CalendarDate.of(2026, 10, 24);
const wholeOf = (daysAgo: readonly number[]) => new Set(daysAgo.map((d) => today.addDays(-d).epochDay));

describe('what opens 7d', () => {
  it('nothing logged: nothing to say', () => {
    expect(weekSpanProgress({ firstEntryOn: undefined, wholeDays: new Set(), today })).toBeUndefined();
  });

  it('a first entry 4 days ago: 3 days to go', () => {
    const progress = weekSpanProgress({ firstEntryOn: today.addDays(-4), wholeDays: wholeOf([1, 2, 3, 4]), today });
    expect(progress).toEqual({ daysToGo: 3 });
    expect(weekSpanProgressText({ daysToGo: 3 })).toBe('7d opens a week after your first entry · 3 days to go');
    expect(weekSpanProgressText({ daysToGo: 1 })).toBe('7d opens a week after your first entry · 1 day to go');
  });

  it('a week of history but 3 of the last 7 days fully logged: 5 needed, 3 so far', () => {
    const first = today.addDays(-20);
    const wholeDays = wholeOf([1, 3, 6, 9, 10]);
    expect(supportedAnalysisSpans({ firstEntryOn: first, wholeDays, today })).toEqual([1]);
    const progress = weekSpanProgress({ firstEntryOn: first, wholeDays, today });
    expect(progress).toEqual({ fullyLogged: 3, needed: 5 });
    expect(weekSpanProgressText({ fullyLogged: 3, needed: 5 })).toBe('7d opens once 5 of the last 7 days are fully logged · 3 so far');
  });
});

describe('the switcher', () => {
  it('2w can be supported without 7d, so the switcher shows on any span beyond 1d, not on 7d alone', () => {
    // 9 of the last 14 fully logged, 4 of them in the last 7.
    const wholeDays = wholeOf([1, 2, 3, 4, 8, 9, 10, 11, 12]);
    expect(supportedAnalysisSpans({ firstEntryOn: today.addDays(-20), wholeDays, today })).toEqual([1, 14]);
  });
});
