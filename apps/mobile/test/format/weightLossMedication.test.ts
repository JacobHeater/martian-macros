import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain';
import type { TargetFlag, UnderEatingFinding } from '../../src/engine';
import {
  calorieAimText,
  underEatingText,
  weightLossMedicationPaceNote,
  weightLossMedicationTrainingNote,
} from '../../src/format';

/**
 * MM-113: the words for someone on a weight-loss medication. Each applies
 * only with the answer ticked; none mentions a dose or a failure.
 */
const ticked = { weightLossMedication: true };
const unticked = { weightLossMedication: false };

const finding: UnderEatingFinding = {
  averageKcal: 1000,
  floorKcal: 1500,
  days: 5,
  lowDays: [CalendarDate.of(2026, 3, 14)],
};

const raised: ReadonlySet<TargetFlag> = new Set<TargetFlag>(['raisedForSafePace']);

it('the calorie card frames the target as a level to reach', () => {
  expect(calorieAimText(ticked, 900, 1900)).toBe('900 so far, aiming for about 1,900 kcal');
  expect(calorieAimText(ticked, 1900, 1900)).toBe('1,900 so far, aiming for about 1,900 kcal');
});

it('over the target, the usual wording stays', () => {
  expect(calorieAimText(ticked, 2000, 1900)).toBeUndefined();
});

it('a too-fast loss points to the prescriber and never to a dose', () => {
  const note = weightLossMedicationPaceNote(ticked, raised);
  expect(note).toContain('prescriber');
  expect(note).not.toMatch(/dose|dosage|stop|inject/i);
  expect(weightLossMedicationPaceNote(ticked, new Set<TargetFlag>(['rateLimited']))).toBeUndefined();
});

it('with no training days, the Coach note names resistance training', () => {
  expect(weightLossMedicationTrainingNote(ticked, 0)).toBe(
    'Resistance training, with enough protein, is the best-supported way to keep muscle while losing weight on this medication.',
  );
  expect(weightLossMedicationTrainingNote(ticked, 3)).toBeUndefined();
});

it('the under-eating notice adds the prescriber lines before the support line', () => {
  const text = underEatingText(finding, { supportLine: true, weightLossMedication: true });
  const appetite = text.indexOf('Low appetite on this medication is common.');
  const fluids = text.indexOf('If you can’t keep food or fluids down, contact your prescriber promptly.');
  const support = text.indexOf('If eating has become a source of distress');
  expect(appetite).toBeGreaterThan(0);
  expect(fluids).toBeGreaterThan(appetite);
  expect(support).toBeGreaterThan(fluids);
  expect(text).not.toMatch(/fail|dose/i);
});

it('not ticked, none of it applies', () => {
  expect(calorieAimText(unticked, 900, 1900)).toBeUndefined();
  expect(weightLossMedicationPaceNote(unticked, raised)).toBeUndefined();
  expect(weightLossMedicationTrainingNote(unticked, 0)).toBeUndefined();
  expect(underEatingText(finding, { supportLine: false, weightLossMedication: false })).toBe(
    underEatingText(finding, { supportLine: false }),
  );
  expect(underEatingText(finding, { supportLine: false })).not.toContain('prescriber');
});
