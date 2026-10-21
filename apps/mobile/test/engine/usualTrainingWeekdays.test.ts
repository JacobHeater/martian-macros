import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Workout } from '../../src/domain/training/Workout';
import { usualTrainingWeekdays } from '../../src/engine/usualTrainingWeekdays';

/** MM-124: "training days higher" fills the higher days from the weekdays the user usually trains on. */
const today = CalendarDate.of(2026, 10, 12); // a Monday
const workout = (daysAgo: number, id: number) => {
  const date = today.addDays(-daysAgo);
  const startedAt = new Date(date.year, date.month - 1, date.day, 18);
  return new Workout({ id, date, startedAt, endedAt: new Date(startedAt.getTime() + 3_600_000) });
};

it('takes the weekdays trained in at least two of the last four weeks, at most three, in weekday order', () => {
  // Mondays (7, 14, 21, 28 days ago), Wednesdays (5, 12), Fridays (3, 10, 17), Saturdays (2, 9) and one Sunday (1).
  const workouts = [7, 14, 21, 28, 5, 12, 3, 10, 17, 2, 9, 1].map((daysAgo, i) => workout(daysAgo, i + 1));
  expect(usualTrainingWeekdays({ workouts, today })).toEqual([1, 3, 5]);
});

it('is empty without a weekday trained twice', () => {
  expect(usualTrainingWeekdays({ workouts: [workout(3, 1), workout(40, 2), workout(47, 3)], today })).toEqual([]);
});
