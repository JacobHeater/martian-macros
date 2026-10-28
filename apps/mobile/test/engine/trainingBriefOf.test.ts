import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { CardioSession } from '../../src/domain/training/CardioSession';
import type { StepsDay } from '../../src/domain/training/StepsDay';
import { trainingBriefOf } from '../../src/engine/analysis/trainingBriefOf';
import { liftSession } from './support/liftSession';
import { trainingInput } from './support/trainingInput';

/** MM-681: the training part of the coach's brief: the week's lifting, cardio and steps against what the person is held to. */
const today = CalendarDate.of(2026, 10, 23);
const minuteMs = 60 * 1000;
const squat = ['back-squat', 3, 5, 100] as const;
const session = (daysAgo: number, minutes: number) => {
  const date = today.addDays(-daysAgo);
  const start = new Date(date.year, date.month - 1, date.day, 7, 5);
  return new CardioSession({ platformId: `walk-${daysAgo}`, sourceName: 'Watch', activity: 'walking', start, end: new Date(start.getTime() + minutes * minuteMs) });
};
const steps = (count: number, days: number): StepsDay[] => Array.from({ length: days }, (_, i) => ({ date: today.addDays(-i), steps: count }));

it('counts the week through today: sessions with a hard set against the days set, cardio and steps against the floors', () => {
  const input = trainingInput(today, {
    goal: 'fatLoss',
    workouts: [liftSession(today.addDays(-2), [squat]), liftSession(today.addDays(-9), [squat])],
    cardio: [session(1, 30), session(3, 36), session(6, 30), session(9, 60)],
    steps: steps(6100, 7),
  });
  const brief = trainingBriefOf(input, today);
  expect(brief).toEqual({
    goal: 'fatLoss',
    cardioHeld: true,
    sessionsThisWeek: 1,
    sessionsTarget: 4,
    daysSinceSession: 2,
    wearableInUse: true,
    cardioMinutes: 96,
    cardioFloorMinutes: 150,
    stepsPerDay: 6100,
    stepsDays: 7,
    stepsFloor: 8000,
  });
});

it("the person's own floors, no lift ever, no wearable, and maintenance holding lifting only", () => {
  const own = trainingBriefOf(trainingInput(today, { goal: 'recomp', cardioFloors: { stepsPerDay: 10000, minutesPerWeek: 120 }, steps: steps(9000, 3) }), today);
  expect(own).toMatchObject({ cardioHeld: true, sessionsThisWeek: 0, daysSinceSession: undefined, wearableInUse: true, stepsPerDay: 9000, stepsDays: 3, stepsFloor: 10000, cardioFloorMinutes: 120 });
  const bare = trainingBriefOf(trainingInput(today, { goal: 'fatLoss' }), today);
  expect(bare).toMatchObject({ wearableInUse: false, cardioMinutes: 0, stepsPerDay: undefined, stepsDays: 0 });
  const maintenance = trainingBriefOf(trainingInput(today, { goal: 'maintenance', workouts: [liftSession(today.addDays(-10), [squat])] }), today);
  expect(maintenance).toMatchObject({ cardioHeld: false, sessionsThisWeek: 0, daysSinceSession: 10 });
});

it('says nothing of training under an eating-disorder history or the under-eating finding', () => {
  expect(trainingBriefOf(trainingInput(today, { goal: 'fatLoss', safeguards: { eatingDisorderHistory: true, underEating: false } }), today)).toBeUndefined();
  expect(trainingBriefOf(trainingInput(today, { goal: 'fatLoss', safeguards: { eatingDisorderHistory: false, underEating: true } }), today)).toBeUndefined();
});
