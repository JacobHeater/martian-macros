import { describe, expect, it } from 'vitest';
import { CalendarDate, CoachingPolicy, Profile, ScreeningAnswers, UserSetup } from '../../src/domain';
import {
  assessStall,
  BodyFatEstimate,
  CoachConfidence,
  CoachSnapshot,
  DailyTargets,
  energyDensityForSlope,
  findInsights,
  type Insight,
  TargetsRecord,
  TdeeEstimator,
  WeightTrendModel,
} from '../../src/engine';
import { Fmt } from '../../src/format/Fmt';
import { insightText } from '../../src/format/insightText';
import { simulate } from './support/simulate';
import { SyntheticUser } from './support/SyntheticUser';

/**
 * MM-141 (forbidden subjects) and MM-140 (the estimate was high), through
 * the closed-loop simulator rather than constructed snapshots.
 */
const estimator = new TdeeEstimator();
const trendModel = new WeightTrendModel();
const fmt = new Fmt('metric');

/** Words no insight may contain, from MM-108 and MM-92. */
const banned = [
  'great',
  'well done',
  'good job',
  'cheat',
  'guilt',
  'clean',
  'junk',
  'honest',
  'accurate',
  'lowest weight',
  'new low',
  'other people',
  'most people',
  'average person',
  'you will reach',
  'you should',
  'you must',
  'burn',
  'plateau',
];

const record = (start: CalendarDate, { kcal, tdee, rate = -0.005 }: { kcal: number; tdee: number; rate?: number }) =>
  new TargetsRecord({
    effectiveFrom: start,
    mode: 'fatLoss',
    tdeeKcal: tdee,
    tdeeSigmaKcal: 200,
    tdeeStatus: 'updated',
    targets: new DailyTargets({ kcal, proteinG: 160, proteinMinimumG: 130, fatG: 70, carbsG: 220, weeklyRateFraction: rate }),
  });

const setup = (today: CalendarDate) =>
  new UserSetup({
    profile: new Profile({ sex: 'male', birthDate: CalendarDate.of(1990, 1, 1), heightCm: 178 }),
    screening: new ScreeningAnswers(),
    trainingStatus: 'intermediate',
    trainingDaysPerWeek: 3,
    goalMode: 'fatLoss',
    onboardedOn: today.addDays(-90),
  });

/** Runs `user` for `days` at `loggedKcal` with the targets `history`, and returns the coach's snapshot and the day after. */
function live(user: SyntheticUser, { days, loggedKcal, history }: { days: number; loggedKcal: number; history: TargetsRecord[] }) {
  const logs = simulate(user, { days, loggedKcal });
  const today = user.today;
  const asOf = today.addDays(-1);
  const trend = trendModel.smooth(logs.weights, { through: asOf });
  const estimate = estimator.estimate({
    asOf,
    intake: logs.intake,
    trend,
    prior: { kcal: 2500, sigmaKcal: 375 },
    bmrKcal: 1800,
    energyDensityForSlope: (slope) =>
      energyDensityForSlope({ slopeKgPerDay: slope, fatMassKg: user.fatMassKg, resistanceTrained: true }),
  });
  const trendWeightKg = trend[trend.length - 1]?.levelKg ?? user.weightKg;
  const who = setup(today);
  const snapshot = new CoachSnapshot({
    policy: CoachingPolicy.derive({ profile: who.profile, screening: who.screening, today }),
    trend,
    trendWeightKg,
    bodyFat: new BodyFatEstimate({ percent: 25, sigmaPercent: 2 }),
    bmrKcal: 1800,
    calorieFloorKcal: 1800,
    tdee: estimate,
    confidence: new CoachConfidence({
      level: 'fair',
      estimate: 'good',
      foodLog: 'good',
      weighIns: 'good',
      stability: 'fair',
      nextStep: 'keepLogging',
      usableFoodDays: 28,
      weighInDays: 28,
    }),
    recommendation: { mode: 'fatLoss', reason: 'cutFirst' },
    lastCreatineEventOn: undefined,
  });
  const stall = assessStall({ setup: who, snapshot, history, intake: logs.intake, weights: logs.weights, today });
  const insights = findInsights({ through: asOf, intake: logs.intake, weights: logs.weights, history, stall, trend });
  return { logs, today, snapshot, stall, insights };
}

describe('every rule against simulated people', () => {
  const start = CalendarDate.of(2026, 1, 5);
  const people = [
    { name: 'steady', seed: 1 },
    { name: 'skips weigh-ins', seed: 2, skipWeighInProbability: 0.6 },
    { name: 'partial days', seed: 3, partialLogProbability: 0.5 },
    { name: 'skips logging', seed: 4, skipLogProbability: 0.3 },
    { name: 'under-reports', seed: 5, underReportFraction: 0.25 },
    { name: 'noisy', seed: 6, entrySigma: 0.3, waterSigmaKg: 1.2 },
  ];
  const everyInsight: Insight[] = [];

  it.each(people)('$name: no insight carries a banned word', (person) => {
    const { name: _name, ...init } = person;
    const user = new SyntheticUser({ start, baseTdeeKcal: 2500, ...init });
    const history = [record(start, { kcal: 2200, tdee: 2800 })];
    const { insights, stall } = live(user, { days: 42, loggedKcal: 2200, history });
    expect(stall.status === 'notAssessed' ? stall.notAssessedReason : stall.status).toBeDefined();
    everyInsight.push(...insights);
    for (const insight of insights) {
      const [title, body, evidence] = insightText(insight, fmt);
      const all = [title, body, ...evidence.map(([label, value]) => `${label} ${value}`)].join(' ').toLowerCase();
      for (const word of banned) expect(all, `${word} in ${insight.rule} for ${person.name}`).not.toContain(word);
      expect(insight.basisDays, 'never about one day').toBeGreaterThanOrEqual(7);
    }
  });

  it('the simulated people exercise more than one rule', () => {
    expect(new Set(everyInsight.map((i) => i.rule)).size).toBeGreaterThanOrEqual(2);
  });
});

describe('the estimate was high (MM-140), through the simulator', () => {
  const start = CalendarDate.of(2026, 1, 5);

  it('an accurate logger eating at target with expenditure 300 kcal below the estimate is told so, with the coming change', () => {
    // The targets were built on an expenditure of 2,500; the true figure is
    // 2,200, so eating the 2,200 target exactly holds weight.
    const user = new SyntheticUser({ seed: 11, start, baseTdeeKcal: 2200, waterSigmaKg: 0.3, adherenceSigmaKcal: 50, entrySigma: 0.05 });
    const history = [record(start, { kcal: 2200, tdee: 2500 })];
    const { stall } = live(user, { days: 35, loggedKcal: 2200, history });
    expect(stall.status).toBe('stalled');
    expect(stall.diagnosis).toBe('estimate');
    // One check-in moves the target by at most the weekly limit.
    expect(stall.expectedChangeKcal).toBe(-100);
    expect(stall.atFloor).toBe(false);
  });

  it('losing at the intended pace is no stall', () => {
    const user = new SyntheticUser({ seed: 12, start, baseTdeeKcal: 2800, waterSigmaKg: 0.3, adherenceSigmaKcal: 50, entrySigma: 0.05 });
    const history = [record(start, { kcal: 2200, tdee: 2800, rate: -0.005 })];
    const { stall } = live(user, { days: 35, loggedKcal: 2200, history });
    expect(stall.status).toBe('noStall');
  });
});
