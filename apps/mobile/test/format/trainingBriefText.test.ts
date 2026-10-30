import { expect, it } from 'vitest';
import type { TrainingBrief } from '../../src/engine/analysis/TrainingBrief';
import { trainingBriefText } from '../../src/format/coach/trainingBriefText';
import { coachBannedWords } from '../support/coachBannedWords';

/** MM-681: the training end of the brief, in the coach's voice; since MM-711 one line, one order, lifting first. */
const brief = (over: Partial<TrainingBrief> = {}): TrainingBrief => ({
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
  ...over,
});
const clean = (text: string) => expect(coachBannedWords.filter(([, pattern]) => pattern.test(text)).map(([name]) => name)).toEqual([]);

it('one line, one order, at most one number, lifting first (MM-711)', () => {
  const text = trainingBriefText(brief());
  expect(text).toBe('One of the four lifts you set is in: three to go this week.');
  expect(text).not.toContain('!');
  clean(text);
  expect(trainingBriefText(brief({ sessionsThisWeek: 0, daysSinceSession: 12 }))).toBe('No lift in 12 days: book one tonight.');
  expect(trainingBriefText(brief({ sessionsThisWeek: 0, daysSinceSession: undefined }))).toBe('Zero lifts of the four you set this week: book one tonight.');
  expect(trainingBriefText(brief({ sessionsThisWeek: 0, sessionsTarget: 3, daysSinceSession: 3 }))).toBe('Zero lifts of the three you set this week: book one tonight.');
});

it('lifting covered, the cardio floor, then the steps floor; all covered, one sentence', () => {
  expect(trainingBriefText(brief({ sessionsThisWeek: 4 }))).toBe('Lifting is covered; cardio is 54 min short of the floor this week: get it on the watch.');
  expect(trainingBriefText(brief({ sessionsThisWeek: 4, cardioMinutes: 160 }))).toBe('Lifting and cardio are covered; steps are 1,900 a day under the floor: walk more.');
  expect(trainingBriefText(brief({ sessionsThisWeek: 4, cardioMinutes: 160, stepsPerDay: 8400 }))).toBe('Training is covered this week: lifting, cardio and steps.');
  expect(trainingBriefText(brief({ sessionsThisWeek: 4, cardioMinutes: 160, stepsPerDay: undefined, stepsDays: 0 }))).toBe('Lifting and cardio are covered; no steps were counted this week.');
});

it('on maintenance only the lifting is held; without a watch on a cut, that nothing is being counted', () => {
  expect(trainingBriefText(brief({ goal: 'maintenance', cardioHeld: false, sessionsThisWeek: 4 }))).toBe('Lifting is covered this week.');
  expect(trainingBriefText(brief({ goal: 'maintenance', cardioHeld: false }))).toBe('One of the four lifts you set is in: three to go this week.');
  expect(trainingBriefText(brief({ sessionsThisWeek: 4, wearableInUse: false, cardioMinutes: 0, stepsPerDay: undefined, stepsDays: 0 }))).toBe(
    'Lifting is covered; no watch is connected, so cardio and steps are not being counted.',
  );
});
