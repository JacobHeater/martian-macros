import { expect, it } from 'vitest';
import {
  CalendarDate,
  IntakeDay,
  Pause,
  Profile,
  ScreeningAnswers,
  UserSetup,
  type WeightObservation,
} from '../../src/domain';
import { analyze, CoachSnapshot, nextTargets, recalculationWithheld } from '../../src/engine';
import type { TargetFlag } from '../../src/engine/TargetFlag';
import { targetsFrom } from '../support/targetsFrom';
import { SyntheticUser } from './support/SyntheticUser';

/** MM-559: targets worked out again now, from the latest weigh-in, when the person asks. */
const start = CalendarDate.of(2026, 1, 1);
const today = start.addDays(35);

const setup = new UserSetup({
  profile: new Profile({ sex: 'male', birthDate: CalendarDate.of(1994, 3, 1), heightCm: 180 }),
  screening: new ScreeningAnswers(),
  trainingStatus: 'intermediate',
  trainingDaysPerWeek: 3,
  goalMode: 'fatLoss',
  onboardedOn: start,
});

/** A man eating a moderate deficit for five weeks, weighing in most days. */
function snapshot(): CoachSnapshot {
  const user = new SyntheticUser({ seed: 4, start, baseTdeeKcal: 2800, startWeightKg: 85, bodyFatPercent: 22 });
  const weights: WeightObservation[] = [];
  const intake: IntakeDay[] = [];
  for (let d = 0; d < 35; d++) {
    const day = user.liveDay(2300);
    if (day.weight !== undefined) weights.push(day.weight);
    if (day.intake !== undefined) intake.push(day.intake);
  }
  const result = analyze({ setup, weights, intake, today });
  expect(result).toBeDefined();
  return result as CoachSnapshot;
}

const recalculate = (history: ReturnType<typeof targetsFrom>[]) =>
  nextTargets({ setup, snapshot: snapshot(), history, today, recalculate: true });

it('recalculates at once, between check-ins, without the weekly step limit', () => {
  // Targets three days old and far under what today's figures give: no check-in is due.
  const history = [targetsFrom(today.addDays(-3), { kcal: 1500, tdeeKcal: 2800 })];
  expect(nextTargets({ setup, snapshot: snapshot(), history, today })).toBeUndefined();
  const next = recalculate(history);
  expect(next).toBeDefined();
  expect(next?.effectiveFrom).toBe(today);
  // The weekly step is 100 kcal; a recalculation moves the whole way.
  expect((next?.targets.kcal ?? 0) - 1500).toBeGreaterThan(100);
  expect(next?.targets.flags.has('rateLimited')).toBe(false);
  expect(next?.explanation?.lines.some((line) => line.reason === 'recalculation')).toBe(true);
  expect(next?.explanation?.lines.some((line) => line.reason === 'stepLimit')).toBe(false);
});

it('never takes back a safety raise', () => {
  const raised = new Set<TargetFlag>(['raisedForSafePace']);
  const history = [targetsFrom(today.addDays(-3), { kcal: 3200, tdeeKcal: 2800, flags: raised })];
  const next = recalculate(history);
  expect(next?.targets.kcal).toBeGreaterThanOrEqual(3200);
  expect(next?.targets.flags.has('heldAfterSafetyRaise')).toBe(true);
});

it('leaves a day that already has new targets, a running break and the first step out of a deficit as they are', () => {
  expect(recalculate([targetsFrom(today, { kcal: 1500 })])).toBeUndefined();
  const onBreak = new Set<TargetFlag>(['requestedBreak']);
  expect(recalculate([targetsFrom(today.addDays(-3), { kcal: 2700, weeklyRateFraction: 0, flags: onBreak })])).toBeUndefined();
  const easing = new Set<TargetFlag>(['easingIn']);
  expect(
    recalculate([targetsFrom(today.addDays(-3), { kcal: 2400, weeklyRateFraction: 0, mode: 'maintenance', flags: easing })]),
  ).toBeUndefined();
});

const weighedOn = (...daysAgo: number[]): WeightObservation[] =>
  daysAgo.map((d) => ({ date: today.addDays(-d), weightKg: 84 }));

it('needs a weigh-in from the last seven days', () => {
  const history = [targetsFrom(today.addDays(-3))];
  expect(recalculationWithheld({ weights: weighedOn(30, 7), history, pauses: [], today })).toBe('noRecentWeighIn');
  expect(recalculationWithheld({ weights: [], history, pauses: [], today })).toBe('noRecentWeighIn');
  expect(recalculationWithheld({ weights: weighedOn(30, 6), history, pauses: [], today })).toBeUndefined();
  expect(recalculationWithheld({ weights: weighedOn(0), history, pauses: [], today })).toBeUndefined();
});

it('says why it is off during a pause, a break, the first step out of a deficit, and on a day targets changed', () => {
  const weights = weighedOn(0);
  const history = [targetsFrom(today.addDays(-3))];
  const pause = new Pause({ from: today.addDays(-1), to: today.addDays(3), reason: 'travel' });
  expect(recalculationWithheld({ weights, history, pauses: [pause], today })).toBe('paused');
  // A pause outranks a missing weigh-in: weighing in would not turn it on.
  expect(recalculationWithheld({ weights: [], history, pauses: [pause], today })).toBe('paused');
  const onBreak = [targetsFrom(today.addDays(-3), { weeklyRateFraction: 0, flags: new Set<TargetFlag>(['dietBreak']) })];
  expect(recalculationWithheld({ weights, history: onBreak, pauses: [], today })).toBe('onBreak');
  const easing = [targetsFrom(today.addDays(-3), { weeklyRateFraction: 0, mode: 'maintenance', flags: new Set<TargetFlag>(['easingIn']) })];
  expect(recalculationWithheld({ weights, history: easing, pauses: [], today })).toBe('easingIn');
  expect(recalculationWithheld({ weights, history: [targetsFrom(today)], pauses: [], today })).toBe('issuedToday');
});
