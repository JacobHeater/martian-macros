import { expect, it } from 'vitest';
import type { TrainingBrief } from '../../src/engine/analysis/TrainingBrief';
import { trainingBriefText } from '../../src/format/coach/trainingBriefText';
import { coachBannedWords } from '../support/coachBannedWords';

/** MM-681: the training end of the brief, in the coach's voice: the number, then the order. */
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

it('holds the person to the sessions set, the cardio floor and the steps floor, with the shortfalls as orders', () => {
  const text = trainingBriefText(brief());
  expect(text).toBe(
    'Lifting: 1 of the 4 sessions you set this week; 3 to go. ' +
      'Cardio 1 h 36 min against the 2 h 30 min floor: 54 min more on the watch this week. ' +
      'Steps about 6,100 a day against 8,000: 1,900 more a day.',
  );
  expect(text).not.toContain('!');
  clean(text);
});

it('a covered week, floors met, and a week or more without lifting', () => {
  expect(trainingBriefText(brief({ sessionsThisWeek: 4, cardioMinutes: 160, stepsPerDay: 8400 }))).toBe(
    'Lifting: 4 of the 4 sessions you set this week; the week is covered. Cardio 2 h 40 min, over the floor. Steps about 8,400 a day, over the floor.',
  );
  expect(trainingBriefText(brief({ sessionsThisWeek: 0, daysSinceSession: 12 }))).toMatch(/^No lifting in 12 days\. 4 sessions a week is what you set; book the first one\./);
  expect(trainingBriefText(brief({ sessionsThisWeek: 0, daysSinceSession: undefined }))).toMatch(/^No lifting logged yet\./);
});

it('on maintenance only the lifting is said; without a watch on a cut, that nothing is being counted', () => {
  expect(trainingBriefText(brief({ goal: 'maintenance', cardioHeld: false }))).toBe('Lifting: 1 of the 4 sessions you set this week; 3 to go.');
  expect(trainingBriefText(brief({ wearableInUse: false, cardioMinutes: 0, stepsPerDay: undefined, stepsDays: 0 }))).toBe(
    'Lifting: 1 of the 4 sessions you set this week; 3 to go. No watch connected: cardio and steps are not being counted. Connect one in Settings › Health.',
  );
  expect(trainingBriefText(brief({ stepsPerDay: undefined, stepsDays: 0 }))).toContain('No steps counted this week against the 8,000 floor.');
});
