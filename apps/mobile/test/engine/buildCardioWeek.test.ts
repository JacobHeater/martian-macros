import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { CardioSession } from '../../src/domain/training/CardioSession';
import type { StepsDay } from '../../src/domain/training/StepsDay';
import { buildCardioWeek } from '../../src/engine/buildCardioWeek';

/** MM-677: cardio over the last seven days beside the seven before, against the floors. */
const today = CalendarDate.of(2026, 10, 5);
const minuteMs = 60 * 1000;

const session = (daysAgo: number, activity: CardioSession['activity'], minutes: number, platformId = `${activity}-${daysAgo}`) => {
  const date = today.addDays(-daysAgo);
  const start = new Date(date.year, date.month - 1, date.day, 7, 5);
  return new CardioSession({ platformId, sourceName: 'Watch', activity, start, end: new Date(start.getTime() + minutes * minuteMs) });
};
const steps = (daysAgo: number, count: number): StepsDay => ({ date: today.addDays(-daysAgo), steps: count });
const none = { stepsPerDay: undefined, minutesPerWeek: undefined };

it('totals the week by activity, most minutes first, and the steps a day over the days with a total', () => {
  const week = buildCardioWeek({
    sessions: [session(0, 'walking', 30), session(3, 'running', 25), session(6, 'walking', 12), session(7, 'cycling', 60)],
    steps: [steps(0, 6000), steps(1, 9000), steps(2, 9000), steps(8, 4000)],
    floors: none,
    today,
  });
  expect(week.current.minutes).toBe(67);
  expect(week.current.sessions).toBe(3);
  expect(week.current.byActivity).toEqual([
    { activity: 'walking', minutes: 42, sessions: 2 },
    { activity: 'running', minutes: 25, sessions: 1 },
  ]);
  expect(week.current.stepsPerDay).toBe(8000);
  expect(week.current.stepsDays).toBe(3);
  expect(week.stepsToday).toBe(6000);
  expect(week.previous.minutes).toBe(60);
  expect(week.previous.byActivity).toEqual([{ activity: 'cycling', minutes: 60, sessions: 1 }]);
  expect(week.previous.stepsPerDay).toBe(4000);
  expect(week.sessions.map((s) => s.platformId)).toEqual(['walking-0', 'running-3', 'walking-6']);
  expect(week.steps.map((d) => d.steps)).toEqual([9000, 9000, 6000]);
  expect(week.inUse).toBe(true);
});

it("the floors are the coach's defaults until the person sets their own (MM-678)", () => {
  expect(buildCardioWeek({ sessions: [], steps: [], floors: none, today }).floors).toEqual({ stepsPerDay: 8000, minutesPerWeek: 150 });
  expect(buildCardioWeek({ sessions: [], steps: [], floors: { stepsPerDay: 10000, minutesPerWeek: undefined }, today }).floors).toEqual({
    stepsPerDay: 10000,
    minutesPerWeek: 150,
  });
});

it('with nothing from the wearable the week is empty and not in use; a day of steps alone puts it in use', () => {
  const empty = buildCardioWeek({ sessions: [], steps: [], floors: none, today });
  expect(empty.inUse).toBe(false);
  expect(empty.current).toEqual({ minutes: 0, sessions: 0, byActivity: [], stepsPerDay: undefined, stepsDays: 0 });
  expect(empty.stepsToday).toBeUndefined();
  expect(buildCardioWeek({ sessions: [], steps: [steps(20, 5000)], floors: none, today }).inUse).toBe(true);
});
