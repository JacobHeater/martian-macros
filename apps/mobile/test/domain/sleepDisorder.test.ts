import { expect, it } from 'vitest';
import { CalendarDate, CoachingPolicy, Profile, ScreeningAnswers } from '../../src/domain';
import { BodyFatEstimate, computeTargets, TargetInputs } from '../../src/engine';

/**
 * MM-251: a diagnosed sleep disorder is asked about and answered with a
 * caution and a clinician pointer, and nothing else: no target, pace, floor
 * or protein figure differs from the same person answering no.
 */
const today = CalendarDate.of(2026, 10, 20);
const profile = new Profile({ sex: 'female', birthDate: CalendarDate.of(1988, 5, 2), heightCm: 165 });

const policyWith = (sleepDisorder: boolean) =>
  CoachingPolicy.derive({ profile, screening: new ScreeningAnswers({ sleepDisorder }), today, weightKg: 70 });

it('the answer is kept and raises the caution', () => {
  const answers = new ScreeningAnswers({ sleepDisorder: true });
  expect(answers.sleepDisorder).toBe(true);
  expect(answers.equals(new ScreeningAnswers())).toBe(false);
  expect(new ScreeningAnswers().sleepDisorder).toBe(false);
  expect(policyWith(true).cautions.has('sleepDisorder')).toBe(true);
  expect(policyWith(false).cautions.has('sleepDisorder')).toBe(false);
});

it('refer-only: the policy and the targets are the same as for a person answering no', () => {
  const yes = policyWith(true);
  const no = policyWith(false);
  expect([...yes.allowedModes]).toEqual([...no.allowedModes]);
  expect(yes.maxWeeklyLossFraction).toBe(no.maxWeeklyLossFraction);
  expect(yes.proteinCapGPerKg).toBe(no.proteinCapGPerKg);
  expect(yes.minimumProteinGPerKgReferenceWeight).toBe(no.minimumProteinGPerKgReferenceWeight);
  expect(yes.maintenanceOffsetKcal).toBe(no.maintenanceOffsetKcal);
  expect(yes.targetsAllowed).toBe(no.targetsAllowed);
  const targetsFor = (policy: CoachingPolicy) =>
    computeTargets(
      new TargetInputs({
        sex: 'female',
        heightCm: 165,
        trendWeightKg: 70,
        bodyFat: new BodyFatEstimate({ percent: 30, sigmaPercent: 4 }),
        mode: 'fatLoss',
        trainingStatus: 'novice',
        policy,
        tdeeKcal: 2200,
        bmrKcal: 1400,
      }),
    );
  const [withIt, without] = [targetsFor(yes), targetsFor(no)];
  expect(withIt.kcal).toBe(without.kcal);
  expect(withIt.proteinG).toBe(without.proteinG);
  expect(withIt.proteinMinimumG).toBe(without.proteinMinimumG);
  expect(withIt.fatG).toBe(without.fatG);
  expect(withIt.weeklyRateFraction).toBe(without.weeklyRateFraction);
  expect([...withIt.flags]).toEqual([...without.flags]);
});
