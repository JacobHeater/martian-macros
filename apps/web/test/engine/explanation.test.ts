import { expect, it } from 'vitest';
import { CalendarDate, CoachingPolicy, type GoalMode, Profile, ScreeningAnswers } from '../../src/domain';
import {
  BodyFatEstimate,
  computeTargets,
  computeTargetsTraced,
  type DailyTargets,
  explainTargets,
  type ExplanationLine,
  type ExplanationReason,
  TargetInputs,
  TargetsExplanation,
  TargetsRecord,
  TdeeEstimate,
} from '../../src/engine';
import { expectClose } from '../support/expectClose';
import { runCoachLoop } from './support/runCoachLoop';
import { SyntheticUser } from './support/SyntheticUser';

/** MM-138: every change comes with an account that adds up. */
const profile = new Profile({ sex: 'male', birthDate: CalendarDate.of(1994, 3, 1), heightCm: 180 });
const start = CalendarDate.of(2026, 1, 1);

const policy = () => CoachingPolicy.derive({ profile, screening: new ScreeningAnswers(), today: start });

const inputs = ({
  tdee,
  mode = 'fatLoss',
  previous,
  bmr = 1900,
}: {
  tdee: number;
  mode?: GoalMode;
  previous?: DailyTargets;
  bmr?: number;
}) =>
  new TargetInputs({
    sex: 'male',
    heightCm: 180,
    trendWeightKg: 90,
    bodyFat: new BodyFatEstimate({ percent: 25, sigmaPercent: 5 }),
    mode,
    trainingStatus: 'intermediate',
    policy: policy(),
    tdeeKcal: tdee,
    bmrKcal: bmr,
    previous,
  });

const recordOf = (t: DailyTargets, tdee: number) =>
  new TargetsRecord({
    effectiveFrom: start,
    mode: 'fatLoss',
    tdeeKcal: tdee,
    tdeeSigmaKcal: 250,
    tdeeStatus: 'updated',
    targets: t,
  });

const estimate = (kcal: number) =>
  new TdeeEstimate({
    kcal,
    sigmaKcal: 250,
    status: 'updated',
    usableIntakeDays: 12,
    excludedPartialDays: 2,
    weighIns: 11,
  });

function explain({ tdeeBefore, tdeeNow, bmr = 1900 }: { tdeeBefore: number; tdeeNow: number; bmr?: number }): {
  explanation: TargetsExplanation;
  change: number;
} {
  const before = computeTargets(inputs({ tdee: tdeeBefore, bmr }));
  const traced = computeTargetsTraced(inputs({ tdee: tdeeNow, previous: before, bmr }));
  const explanation = explainTargets({
    trigger: 'checkIn',
    previous: recordOf(before, tdeeBefore),
    targets: traced.targets,
    trace: traced.trace,
    tdee: estimate(tdeeNow),
  });
  return { explanation, change: traced.targets.kcal - before.kcal };
}

const lineKcal = (e: TargetsExplanation, r: ExplanationReason) =>
  e.lines.filter((l) => l.reason === r).reduce((sum, l) => sum + l.kcal, 0);

const fields = (l: ExplanationLine) => [l.reason, l.kcal, l.from, l.to];

it('an ordinary change: the estimate fell and the step limit held back the rest', () => {
  const r = explain({ tdeeBefore: 2950, tdeeNow: 2650 });
  const e = r.explanation;
  expectClose(r.change, -100, 1e-9);
  expectClose(lineKcal(e, 'expenditureEstimate'), -300, 1e-9);
  // The step limit gave back what it held (a positive line).
  expect(lineKcal(e, 'stepLimit')).toBeGreaterThan(0);
  expectClose(e.linesTotal, r.change, 1e-9);
  expectClose((e.previousKcal as number) + (e.change as number), e.newKcal, 1e-9);
  expect(e.usableIntakeDays).toBe(12);
  expect(e.excludedPartialDays).toBe(2);
  expect(e.weighIns).toBe(11);
});

it('a floor that held the target up is named, with what it would have been', () => {
  // A high floor (resting energy) against a falling expenditure.
  const r = explain({ tdeeBefore: 2300, tdeeNow: 1700, bmr: 2000 });
  const floor = r.explanation.lines.find((l) => l.reason === 'calorieFloor');
  expect(floor).toBeDefined();
  expect(floor?.kcal).toBeGreaterThan(0);
  expect(floor?.from).toBeLessThan(floor?.to as number);
  expectClose(floor?.to, r.explanation.newKcal, 1e-9);
  expectClose(r.explanation.linesTotal, r.change, 1e-9);
});

it('a goal change is named as the cause of the rest', () => {
  const before = computeTargets(inputs({ tdee: 2800 }));
  const unchanged = computeTargetsTraced(inputs({ tdee: 2800 }));
  const none = explainTargets({
    trigger: 'goalChange',
    previous: recordOf(before, 2800),
    targets: unchanged.targets,
    trace: unchanged.trace,
    tdee: estimate(2800),
  });
  expect(none.lines, 'nothing changed').toEqual([]);

  const changed = computeTargetsTraced(inputs({ tdee: 2800, mode: 'maintenance' }));
  const e = explainTargets({
    trigger: 'goalChange',
    previous: recordOf(before, 2800),
    targets: changed.targets,
    trace: changed.trace,
    tdee: estimate(2800),
  });
  expect(e.lines).toHaveLength(1);
  expect(e.lines[0]?.reason).toBe('goalChange');
  expectClose(e.linesTotal, changed.targets.kcal - before.kcal, 1e-9);
});

it('the first targets have nothing to compare with', () => {
  const traced = computeTargetsTraced(inputs({ tdee: 2800 }));
  const e = explainTargets({
    trigger: 'firstTargets',
    previous: undefined,
    targets: traced.targets,
    trace: traced.trace,
    tdee: estimate(2800),
  });
  expect(e.lines).toHaveLength(1);
  expect(e.lines[0]?.reason).toBe('firstTargets');
  expect(e.previousKcal).toBeUndefined();
  expect(e.change).toBeUndefined();
});

it('it survives being stored as text', () => {
  const r = explain({ tdeeBefore: 2950, tdeeNow: 2650 });
  const back = TargetsExplanation.decode(r.explanation.encode());
  expect(back.newKcal).toBe(r.explanation.newKcal);
  expect(back.previousKcal).toBe(r.explanation.previousKcal);
  expect(back.estimateStatus).toBe('updated');
  expect(back.weighIns).toBe(11);
  expect(back.lines.map(fields)).toEqual(r.explanation.lines.map(fields));
});

it('over a 16-week simulated run the contributions add up to every change within 5 kcal', () => {
  let changes = 0;
  let withLimits = 0;
  for (let seed = 600; seed < 612; seed++) {
    const user = new SyntheticUser({
      seed,
      start,
      baseTdeeKcal: 2600 + (seed % 4) * 200,
      startWeightKg: 88,
      bodyFatPercent: 24,
      underReportFraction: (seed % 3) * 0.05,
      skipLogProbability: 0.08,
      glycogenSwingFraction: 0.02,
    });
    const results = runCoachLoop({ user, profile, mode: 'fatLoss', weeks: 16 });
    let previous: number | undefined;
    for (const w of results) {
      const e = w.explanation;
      if (e !== undefined && e.previousKcal !== undefined) {
        changes++;
        expect(Math.abs(e.linesTotal - (e.change as number)), `seed ${seed} week ${w.week}`).toBeLessThanOrEqual(5);
        expectClose(e.previousKcal, previous as number, 1e-9);
        if (e.lines.some((l) => l.reason === 'stepLimit' || l.reason === 'calorieFloor' || l.reason === 'safetyRaise')) {
          withLimits++;
        }
      }
      if (e !== undefined) previous = e.newKcal;
      if (e === undefined && previous !== undefined) {
        expectClose(w.targets.kcal, previous, 1e-9);
      }
    }
  }
  expect(changes).toBeGreaterThan(20);
  expect(withLimits, 'the limits are exercised').toBeGreaterThan(0);
});
