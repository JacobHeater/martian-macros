import { describe, expect, it } from 'vitest';
import { rhythmDays } from '../../src/dashboard/rhythmDays';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { IntakeDay } from '../../src/domain/IntakeDay';

/** MM-254: the rhythm strip is the last seven days, every dot a real day. */
const today = CalendarDate.of(2026, 10, 13); // a Tuesday
const day = (daysAgo: number, kcal: number, completeness: 'complete' | 'partial' | 'unmarked') =>
  new IntakeDay({ date: today.addDays(-daysAgo), kcal, proteinG: 0, carbsG: 0, fatG: 0, completeness });

describe('rhythmDays', () => {
  it('gives seven days ending today, oldest first, with their letters', () => {
    const days = rhythmDays([], today);
    expect(days).toHaveLength(7);
    expect(days.map((d) => d.letter)).toEqual(['W', 'Th', 'F', 'Sa', 'Su', 'M', 'Tu']);
    expect(days[6]?.today).toBe(true);
    expect(days.filter((d) => d.today)).toHaveLength(1);
  });

  it('marks a complete day full, a logged but unmarked or partial day half, and nothing empty', () => {
    const days = rhythmDays([day(0, 1200, 'unmarked'), day(1, 2100, 'complete'), day(2, 900, 'partial'), day(3, 0, 'unmarked')], today);
    expect(days.map((d) => d.mark)).toEqual(['none', 'none', 'none', 'none', 'half', 'full', 'half']);
  });

  it('says each day and its state in words', () => {
    const days = rhythmDays([day(1, 2100, 'complete')], today);
    expect(days[5]?.label).toBe('Yesterday: logged and marked complete');
    expect(days[6]?.label).toBe('Today: nothing logged');
    expect(days[0]?.label).toBe('Wed, Oct 7: nothing logged');
  });
});
