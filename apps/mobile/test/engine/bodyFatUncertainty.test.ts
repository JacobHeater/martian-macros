import { describe, expect, it } from 'vitest';
import { CalendarDate, CoachingPolicy, Profile, ScreeningAnswers, UserSetup } from '../../src/domain';
import {
  analyze,
  bodyFatClearlyAbove,
  BodyFatEstimate,
  cautiousBodyFatPercent,
  CoachSnapshot,
  computeTargets,
  DailyTargets,
  nextTargets,
  safetyBodyFatPercent,
  SafetyBounds,
  TargetInputs,
  TargetsRecord,
} from '../../src/engine';
import { expectClose } from '../support/expectClose';
import { upTo } from '../support/upTo';

/** MM-132: body-fat thresholds applied to a number nobody knows. */
const start = CalendarDate.of(2026, 1, 1);

const man = () => new Profile({ sex: 'male', birthDate: CalendarDate.of(1990, 1, 1), heightCm: 180 });

const policy = () => CoachingPolicy.derive({ profile: man(), screening: new ScreeningAnswers(), today: start });

/** A man on fat loss asking for the fastest pace, so the limit decides. */
const targetsFor = (estimate: BodyFatEstimate, safety?: number) =>
  computeTargets(
    new TargetInputs({
      sex: 'male',
      heightCm: 180,
      trendWeightKg: 90,
      bodyFat: estimate,
      mode: 'fatLoss',
      trainingStatus: 'intermediate',
      policy: policy(),
      tdeeKcal: 3000,
      bmrKcal: 1900,
      requestedLossFraction: 0.01,
      safetyBodyFatPercent: safety,
    }),
  );

const formula = (percent: number) => new BodyFatEstimate({ percent, sigmaPercent: 5 });

it('plausibly lean: a formula estimate of 18% gets the lean limits', () => {
  const t = targetsFor(formula(18));
  expectClose(t.weeklyRateFraction, -0.007, 1e-12);
  // At least what the lean rule gives at 15%.
  const atFifteen = SafetyBounds.proteinTargetsG({
    sex: 'male',
    weightKg: 90,
    heightCm: 180,
    bodyFatPercent: 15,
    inDeficit: true,
    lifting: true,
    policy: policy(),
  });
  expect(t.proteinG).toBeGreaterThanOrEqual(atFifteen.targetG);
  // The energy-availability floor applies: 30 kcal per kg of fat-free mass.
  const floor = SafetyBounds.calorieFloorKcal({
    sex: 'male',
    bmrKcal: 1900,
    bodyFatPercent: cautiousBodyFatPercent(formula(18)),
    fatFreeMassUpperKg: formula(18).fatFreeMassUpperKg(90),
    trainingKcalPerDay: 0,
  });
  expect(floor).toBeGreaterThan(1900);
  expect(t.kcal).toBeGreaterThanOrEqual(floor - 1e-9);
});

it('clearly not lean: 26% gets the ordinary limit', () => {
  expectClose(targetsFor(formula(26)).weeklyRateFraction, -0.01, 1e-12);
});

it('a better measurement relaxes it', () => {
  const measured = new BodyFatEstimate({ percent: 18, sigmaPercent: 2 });
  expectClose(targetsFor(measured).weeklyRateFraction, -0.01, 1e-12);
});

it('the threshold is a quarter chance of being on the strict side', () => {
  // At 15% the strict side applies up to about 18.4% with a 5-point sigma.
  expect(cautiousBodyFatPercent(formula(18.3))).toBeLessThan(15);
  expect(cautiousBodyFatPercent(formula(18.5))).toBeGreaterThan(15);
});

it('no flipping: an estimate moving 18.0, 18.6, 18.2, 18.9 gives the same limit each time', () => {
  let previous: number | undefined;
  const rates: number[] = [];
  for (const percent of [18.0, 18.6, 18.2, 18.9]) {
    const safety = safetyBodyFatPercent(formula(percent), { previous });
    previous = safety;
    rates.push(targetsFor(formula(percent), safety).weeklyRateFraction);
  }
  expect(new Set(rates).size).toBe(1);
  expectClose(rates[0], -0.007, 1e-12);
});

it('without memory the same sequence would flip', () => {
  // The reason the hold exists.
  const rates = new Set([18.0, 18.6, 18.2, 18.9].map((p) => targetsFor(formula(p)).weeklyRateFraction));
  expect(rates.size).toBe(2);
});

it('a real change of more than two points does move it', () => {
  const held = safetyBodyFatPercent(formula(18), { previous: 14.6 });
  expect(held).toBe(14.6);
  const moved = safetyBodyFatPercent(formula(22), { previous: 14.6 });
  expectClose(moved, 22 - 0.6745 * 5, 1e-9);
});

it('the fastest pace needs the user to be clearly above its line', () => {
  expect(bodyFatClearlyAbove(formula(27), 25)).toBe(false);
  expect(bodyFatClearlyAbove(formula(29), 25)).toBe(true);
  expect(
    bodyFatClearlyAbove(new BodyFatEstimate({ percent: 27, sigmaPercent: 2 }), 25),
    'a better measurement is enough',
  ).toBe(true);
});

describe('a correction in Settings', () => {
  const setup = () =>
    new UserSetup({
      profile: man(),
      screening: new ScreeningAnswers(),
      trainingStatus: 'intermediate',
      trainingDaysPerWeek: 3,
      goalMode: 'fatLoss',
      onboardedOn: start.addDays(-30),
    });

  const lastRecord = (safety: number) =>
    new TargetsRecord({
      effectiveFrom: start.addDays(28),
      mode: 'fatLoss',
      tdeeKcal: 2900,
      tdeeSigmaKcal: 250,
      tdeeStatus: 'updated',
      safetyBodyFatPercent: safety,
      targets: new DailyTargets({ kcal: 2400, proteinG: 180, fatG: 70, carbsG: 280, weeklyRateFraction: -0.0075 }),
    });

  function snapshotWith(estimate: BodyFatEstimate): CoachSnapshot {
    const weights = upTo(30).map((d) => ({ date: start.addDays(d), weightKg: 90 }));
    const base = analyze({ setup: setup(), weights, intake: [], today: start.addDays(30) }) as CoachSnapshot;
    return new CoachSnapshot({
      policy: base.policy,
      trend: base.trend,
      trendWeightKg: base.trendWeightKg,
      bodyFat: estimate,
      bmrKcal: base.bmrKcal,
      calorieFloorKcal: base.calorieFloorKcal,
      tdee: base.tdee,
      confidence: base.confidence,
      recommendation: base.recommendation,
    });
  }

  it('toward leaner applies at once, before the check-in is due', () => {
    // Two days after the last targets; safety was 24 (a fatter estimate).
    const next = nextTargets({
      setup: setup(),
      snapshot: snapshotWith(new BodyFatEstimate({ percent: 15, sigmaPercent: 4 })),
      history: [lastRecord(24)],
      today: start.addDays(30),
    });
    expect(next).toBeDefined();
    expectClose(next?.safetyBodyFatPercent, 15 - 0.6745 * 4, 1e-9);
    expectClose(next?.targets.weeklyRateFraction, -0.007, 1e-12);
  });

  it('toward fatter waits for the check-in', () => {
    const next = nextTargets({
      setup: setup(),
      snapshot: snapshotWith(new BodyFatEstimate({ percent: 30, sigmaPercent: 4 })),
      history: [lastRecord(12)],
      today: start.addDays(30),
    });
    expect(next).toBeUndefined();
  });

  it('a small change does nothing', () => {
    const next = nextTargets({
      setup: setup(),
      snapshot: snapshotWith(new BodyFatEstimate({ percent: 21, sigmaPercent: 4 })),
      history: [lastRecord(18.5)],
      today: start.addDays(30),
    });
    expect(next).toBeUndefined();
  });
});

it('the check-in stores the figure it used', () => {
  const weights = upTo(3).map((d) => ({ date: start.addDays(d), weightKg: 90 }));
  const s = new UserSetup({
    profile: man(),
    screening: new ScreeningAnswers(),
    trainingStatus: 'intermediate',
    trainingDaysPerWeek: 3,
    goalMode: 'fatLoss',
    onboardedOn: start,
  });
  const snapshot = analyze({ setup: s, weights, intake: [], today: start.addDays(3) }) as CoachSnapshot;
  const first = nextTargets({ setup: s, snapshot, history: [], today: start.addDays(3) });
  expectClose(first?.safetyBodyFatPercent, cautiousBodyFatPercent(snapshot.bodyFat), 1e-9);
});

it('a measured body fat has a 4-point uncertainty, a formula one 5', () => {
  const weights = [{ date: start, weightKg: 90 }];
  const withBodyFat = (bf: number | undefined) =>
    new UserSetup({
      profile: man(),
      screening: new ScreeningAnswers(),
      trainingStatus: 'intermediate',
      trainingDaysPerWeek: 3,
      goalMode: 'fatLoss',
      onboardedOn: start,
      bodyFatPercent: bf,
    });
  const snap = (bf: number | undefined) =>
    analyze({ setup: withBodyFat(bf), weights, intake: [], today: start }) as CoachSnapshot;
  expect(snap(undefined).bodyFat.sigmaPercent).toBe(5);
  expect(snap(20).bodyFat.sigmaPercent).toBe(4);
});
