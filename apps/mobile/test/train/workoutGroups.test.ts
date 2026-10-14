import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Workout } from '../../src/domain/training/Workout';
import { trainedDays } from '../../src/train/trainedDays';
import { workoutGroups } from '../../src/train/workoutGroups';

/** MM-258: workouts grouped by this week, last week, then month; the week's strip marks trained days. */
const today = CalendarDate.of(2026, 10, 13);
const finished = (id: number, daysAgo: number) => {
  const date = today.addDays(-daysAgo);
  const startedAt = new Date(date.year, date.month - 1, date.day, 7);
  return new Workout({ id, date, startedAt, endedAt: new Date(startedAt.getTime() + 50 * 60000), pausedAt: undefined, setStartedAt: undefined });
};

describe('workoutGroups', () => {
  it('puts the last seven days first, the seven before next, then months, newest first', () => {
    const groups = workoutGroups([finished(1, 40), finished(2, 2), finished(3, 9), finished(4, 0), finished(5, 70), finished(6, 20)], today);
    expect(groups.map((g) => [g.title, g.workouts.map((w) => w.id)])).toEqual([
      ['This week', [4, 2]],
      ['Last week', [3]],
      ['September 2026', [6, 1]],
      ['August 2026', [5]],
    ]);
  });

  it('leaves out a week with nothing in it', () => {
    expect(workoutGroups([finished(1, 20)], today).map((g) => g.title)).toEqual(['September 2026']);
    expect(workoutGroups([], today)).toEqual([]);
  });
});

describe('trainedDays', () => {
  it('marks the days with a finished workout and leaves one in progress out', () => {
    const open = new Workout({ id: 9, date: today, startedAt: new Date(), endedAt: undefined, pausedAt: undefined, setStartedAt: undefined });
    const days = trainedDays([finished(1, 1), finished(2, 6), finished(3, 8), open], today);
    expect(days.map((d) => d.mark)).toEqual(['full', 'none', 'none', 'none', 'none', 'full', 'none']);
    expect(days[5]?.label).toBe('Yesterday: trained');
    expect(days[6]?.label).toBe('Today: no workout');
  });
});
