import { describe, expect, it } from 'vitest';
import {
  type BiologicalSex,
  CalendarDate,
  CoachingPolicy,
  type GoalMode,
  Profile,
  ScreeningAnswers,
  type TrainingStatus,
  UserSetup,
} from '../../src/domain';
import {
  BodyFatEstimate,
  DailyTargets,
  LeanGainRule,
  type LeanGainStopReason,
  MaintenanceRule,
  PhaseRule,
  planPhases,
  SafetyBounds,
  StallAssessment,
  suggestedMaintenanceWeeks,
  TargetsRecord,
  WeightTrendPoint,
} from '../../src/engine';
import { goalBodyFatCheckText, phaseNextTitle, phaseRecommendationText } from '../../src/format';

/** MM-36: the phases ahead, planned from the body-fat range, never a point. */
const today = CalendarDate.of(2026, 10, 21);

const setupFor = ({
  sex = 'male',
  goal = 'fatLoss',
  screening = new ScreeningAnswers(),
  training = 'intermediate',
}: { sex?: BiologicalSex; goal?: GoalMode; screening?: ScreeningAnswers; training?: TrainingStatus } = {}) =>
  new UserSetup({
    profile: new Profile({ sex, birthDate: CalendarDate.of(1990, 1, 1), heightCm: 180 }),
    screening,
    trainingStatus: training,
    trainingDaysPerWeek: 3,
    goalMode: goal,
    onboardedOn: today.addDays(-400),
  });

const rateOf = (mode: GoalMode) => (mode === 'fatLoss' ? -0.0075 : mode === 'leanGain' ? 0.0025 : mode === 'recomp' ? -0.0025 : 0);

/** Targets in `mode` from `daysAgo`. */
const record = (daysAgo: number, mode: GoalMode) =>
  new TargetsRecord({
    effectiveFrom: today.addDays(-daysAgo),
    mode,
    tdeeKcal: 2700,
    tdeeSigmaKcal: 150,
    tdeeStatus: 'updated',
    targets: new DailyTargets({ kcal: 2300, proteinG: 170, fatG: 70, carbsG: 230, weeklyRateFraction: rateOf(mode) }),
  });

/** The coach's view: body fat as an estimate with its deviation, and the trend's pace today. */
const snapshotFor = (
  setup: UserSetup,
  { percent, sigma = 4, kgPerWeek = -0.5, sdPerWeek = 0.05, weightKg = 80 }: {
    percent: number;
    sigma?: number;
    kgPerWeek?: number;
    sdPerWeek?: number;
    weightKg?: number;
  },
) => ({
  policy: CoachingPolicy.derive({ profile: setup.profile, screening: setup.screening, today, weightKg }),
  trend: [
    new WeightTrendPoint({
      date: today,
      levelKg: weightKg,
      slopeKgPerDay: kgPerWeek / 7,
      waterKg: 0,
      levelVariance: 0.04,
      slopeVariance: (sdPerWeek / 7) ** 2,
      observed: true,
      rejected: false,
    }),
  ],
  trendWeightKg: weightKg,
  bodyFat: new BodyFatEstimate({ percent, sigmaPercent: sigma }),
  bodyFatBasis: 'formula' as const,
  deficitRestartOn: undefined,
});

describe('the next phase', () => {
  it('a man cut to 12% is recommended maintenance, then a lean gain, with the reason', () => {
    const setup = setupFor();
    const plan = planPhases({ setup, snapshot: snapshotFor(setup, { percent: 12 }), history: [record(70, 'fatLoss')], today });
    expect(plan?.mode).toBe('fatLoss');
    expect(plan?.weeks).toBe(10);
    expect(plan?.recommendation).toEqual({
      reason: 'goalReached',
      next: 'maintenance',
      nextWeeks: suggestedMaintenanceWeeks(10),
      then: 'leanGain',
    });
    const recommendation = plan?.recommendation;
    if (recommendation === undefined) throw new Error('no recommendation');
    expect(phaseNextTitle(recommendation)).toBe('Next: Maintenance, then Lean gain');
    const why = phaseRecommendationText(recommendation, plan?.linePercent);
    expect(why).toMatch(/^The lower end of your body-fat range has reached 15%/);
    expect(why).toContain('then a lean gain');
    expect(why).toMatch(/Nothing changes until you choose\.$/);
  });

  it('reads the range, not the point: the same estimate ends the cut only when it is plausibly at the goal', () => {
    const setup = setupFor();
    const at = (sigma: number) =>
      planPhases({ setup, snapshot: snapshotFor(setup, { percent: 17, sigma }), history: [record(70, 'fatLoss')], today });
    // 17 less a quarter's deviations: 16.3 with 1 point, 14.3 with 4.
    expect(at(1)?.recommendation).toBeUndefined();
    expect(at(4)?.recommendation?.reason).toBe('goalReached');
  });

  it('a cut ends at sixteen weeks in a deficit, and another cut follows the hold when the goal is not reached', () => {
    const setup = setupFor();
    const at = (daysAgo: number) =>
      planPhases({ setup, snapshot: snapshotFor(setup, { percent: 25 }), history: [record(daysAgo, 'fatLoss')], today });
    expect(at(PhaseRule.longestCutWeeks * 7 - 1)?.recommendation).toBeUndefined();
    expect(at(PhaseRule.longestCutWeeks * 7)?.recommendation).toEqual({
      reason: 'longestCut',
      next: 'maintenance',
      nextWeeks: suggestedMaintenanceWeeks(PhaseRule.longestCutWeeks),
      then: 'fatLoss',
    });
  });

  it('a cut ends when it has stalled at the calorie floor, not when the loop can still lower the target', () => {
    const setup = setupFor();
    const stalled = (atFloor: boolean) =>
      planPhases({
        setup,
        snapshot: snapshotFor(setup, { percent: 25 }),
        history: [record(56, 'fatLoss')],
        stall: new StallAssessment({ status: 'stalled', windowDays: 28, diagnosis: 'estimate', atFloor }),
        today,
      });
    expect(stalled(true)?.recommendation?.reason).toBe('stalledAtFloor');
    expect(stalled(false)?.recommendation).toBeUndefined();
  });

  it('a lean gain ends when MM-129’s review says so, for its body-fat line, its waist or its weeks, and not otherwise', () => {
    const setup = setupFor({ goal: 'leanGain' });
    const gain = (leanGainStop: LeanGainStopReason | undefined, percent = 15) =>
      planPhases({
        setup,
        snapshot: snapshotFor(setup, { percent, kgPerWeek: 0.25 }),
        history: [record(70, 'leanGain')],
        leanGainStop,
        today,
      });
    expect(gain('bodyFat')?.recommendation).toEqual({
      reason: 'gainLine',
      next: 'maintenance',
      nextWeeks: MaintenanceRule.minimumMaintenanceWeeks,
      then: 'fatLoss',
    });
    expect(gain('waist')?.recommendation?.reason).toBe('gainWaist');
    expect(gain('weeks')?.recommendation?.reason).toBe('longestGain');
    // One owner of when: an estimate past the line that the review has not called is not an end here either.
    expect(gain(undefined, 22)?.recommendation).toBeUndefined();
  });

  it('a gain’s end is said once on the Coach: the plan’s words give only what follows', () => {
    const recommendation = { reason: 'gainWaist', next: 'maintenance', nextWeeks: 2, then: 'fatLoss' } as const;
    const words = phaseRecommendationText(recommendation, 20);
    expect(words).toBe('About 2 weeks at maintenance first. Nothing changes until you choose.');
    expect(words).not.toMatch(/end|waist|body fat/i);
  });

  it('maintenance after a cut runs the weeks MM-130 suggests, then the range decides what follows', () => {
    const setup = setupFor({ goal: 'maintenance' });
    const hold = (percent: number, daysAgo: number) =>
      planPhases({
        setup,
        snapshot: snapshotFor(setup, { percent, kgPerWeek: 0 }),
        history: [record(daysAgo + 16 * 7, 'fatLoss'), record(daysAgo, 'maintenance')],
        today,
      });
    const weeks = suggestedMaintenanceWeeks(16);
    const early = hold(22, weeks * 7 - 7);
    expect(early?.recommendation).toBeUndefined();
    expect(early?.projectedEndReason).toBe('holdDone');
    expect(early?.projectedEndOn).toEqual(today.addDays(7));
    expect(hold(22, weeks * 7)?.recommendation).toEqual({ reason: 'holdDone', next: 'fatLoss', nextWeeks: undefined, then: undefined });
    expect(hold(14, weeks * 7)?.recommendation?.next).toBe('leanGain');
  });

  it('maintenance chosen for itself, and recomp, show only how long they have run', () => {
    const maintaining = setupFor({ goal: 'maintenance' });
    const held = planPhases({
      setup: maintaining,
      snapshot: snapshotFor(maintaining, { percent: 22, kgPerWeek: 0 }),
      history: [record(200, 'maintenance')],
      today,
    });
    expect(held).toMatchObject({ weeks: 28, projectedEndOn: undefined, recommendation: undefined });
    const recomp = setupFor({ goal: 'recomp' });
    expect(
      planPhases({ setup: recomp, snapshot: snapshotFor(recomp, { percent: 12 }), history: [record(70, 'recomp')], today }),
    ).toMatchObject({ weeks: 10, projectedEndOn: undefined, recommendation: undefined });
  });

  it('a goal changed today starts its phase today', () => {
    const setup = setupFor({ goal: 'maintenance' });
    const plan = planPhases({ setup, snapshot: snapshotFor(setup, { percent: 22 }), history: [record(70, 'fatLoss')], today });
    expect(plan).toMatchObject({ mode: 'maintenance', startedOn: today, weeks: 0 });
  });

  it('nothing to plan before any targets', () => {
    const setup = setupFor();
    expect(planPhases({ setup, snapshot: snapshotFor(setup, { percent: 22 }), history: [], today })).toBeUndefined();
  });
});

describe('a projected end', () => {
  it('a steady cut toward its goal shows about when the lower end of the range reaches it', () => {
    const setup = setupFor();
    const plan = planPhases({ setup, snapshot: snapshotFor(setup, { percent: 20 }), history: [record(14, 'fatLoss')], today });
    // 80 kg, the lower end at 17.3%: about 2.9 kg to lose at 0.5 kg a week, part of it lean (the partition).
    expect(plan?.projectedEndReason).toBe('goalReached');
    expect(plan?.projectedEndOn).toEqual(today.addDays(41));
    expect(plan?.linePercent).toBe(PhaseRule.cutGoalPercent('male'));
  });

  it('a pace that is not steady projects only the longest cut', () => {
    const setup = setupFor();
    const plan = planPhases({
      setup,
      snapshot: snapshotFor(setup, { percent: 20, kgPerWeek: -0.1, sdPerWeek: 0.2 }),
      history: [record(14, 'fatLoss')],
      today,
    });
    expect(plan?.projectedEndReason).toBe('longestCut');
    expect(plan?.projectedEndOn).toEqual(today.addDays(PhaseRule.longestCutWeeks * 7 - 14));
  });

  it('a gain ends at whichever comes first, the upper end of the range at its line at this pace or twenty-six weeks', () => {
    const setup = setupFor({ goal: 'leanGain' });
    const at = (kgPerWeek: number) =>
      planPhases({ setup, snapshot: snapshotFor(setup, { percent: 15, kgPerWeek }), history: [record(70, 'leanGain')], today });
    // 80 kg, the upper end at 17.7%: about 4.9 kg to 20%, part of it lean (the partition), as MM-129 reads the line.
    expect(at(0.25)).toMatchObject({ projectedEndReason: 'longestGain', projectedEndOn: today.addDays(LeanGainRule.stopWeeks * 7 - 70) });
    expect(at(0.5)).toMatchObject({ projectedEndReason: 'gainLine', projectedEndOn: today.addDays(69) });
  });
});

describe('a goal body fat', () => {
  it('a woman’s goal of 14% is refused, with the reason, and the plan keeps its own line', () => {
    expect(SafetyBounds.checkGoalBodyFat('female', 14)).toBe('rejected');
    expect(goalBodyFatCheckText('female', 14)).toBe('14% is under 16%, the lowest goal body fat the app plans toward for women.');
    const setup = setupFor({ sex: 'female' });
    const plan = (percent: number) =>
      planPhases({
        setup,
        snapshot: snapshotFor(setup, { percent: 30, sigma: 1 }),
        history: [record(14, 'fatLoss')],
        goal: { percent, setOn: today },
        today,
      });
    expect(plan(14)?.linePercent).toBe(PhaseRule.cutGoalPercent('female'));
    expect(plan(20)?.linePercent).toBe(20);
  });

  it('a goal under the soft floor is accepted with a warning, and its hold is time-limited', () => {
    expect(goalBodyFatCheckText('male', 9)).toContain(`${PhaseRule.lowGoalHoldWeeks} weeks at most`);
    expect(goalBodyFatCheckText('male', 12)).toBeUndefined();
    const setup = setupFor();
    const plan = planPhases({
      setup,
      snapshot: snapshotFor(setup, { percent: 10, sigma: 2 }),
      history: [record(20 * 7, 'fatLoss')],
      goal: { percent: 9, setOn: today.addDays(-60) },
      today,
    });
    expect(suggestedMaintenanceWeeks(20)).toBeGreaterThan(PhaseRule.lowGoalHoldWeeks);
    expect(plan?.recommendation).toEqual({ reason: 'goalReached', next: 'maintenance', nextWeeks: PhaseRule.lowGoalHoldWeeks, then: 'leanGain' });
  });
});

describe('safeguards', () => {
  it('with an eating-disorder history the phase and its length show, and nothing is projected or recommended from body fat', () => {
    const setup = setupFor({ goal: 'leanGain', screening: new ScreeningAnswers({ eatingDisorderHistory: true }) });
    const plan = planPhases({ setup, snapshot: snapshotFor(setup, { percent: 19, kgPerWeek: 0.25 }), history: [record(70, 'leanGain')], today });
    expect(plan).toEqual({
      mode: 'leanGain',
      startedOn: today.addDays(-70),
      weeks: 10,
      linePercent: undefined,
      projectedEndOn: undefined,
      projectedEndReason: undefined,
      recommendation: undefined,
    });
  });

  it('a goal the policy does not offer is never recommended', () => {
    const setup = setupFor({ sex: 'female', goal: 'maintenance', screening: new ScreeningAnswers({ pregnant: true }) });
    const plan = planPhases({
      setup,
      snapshot: snapshotFor(setup, { percent: 32, kgPerWeek: 0 }),
      history: [record(30 + 16 * 7, 'fatLoss'), record(30, 'maintenance')],
      today,
    });
    expect(plan?.recommendation).toBeUndefined();
  });
});
