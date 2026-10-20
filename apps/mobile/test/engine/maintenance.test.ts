import { describe, expect, it } from 'vitest';
import { type BiologicalSex, CalendarDate, CoachingPolicy, Profile, ScreeningAnswers, UserSetup } from '../../src/domain';
import {
  assessMaintenance,
  assessMaintenanceDrift,
  BodyFatEstimate,
  CoachConfidence,
  CoachSnapshot,
  DailyTargets,
  maintenanceAnchorOf,
  MaintenanceRule,
  maintenanceStartOn,
  nextTargets,
  suggestedMaintenanceWeeks,
  TargetsRecord,
  TdeeEstimate,
  WeightTrendPoint,
} from '../../src/engine';
import { upTo } from '../support/upTo';

/** MM-130: define maintenance, and make the end of a cut uneventful. */
const today = CalendarDate.of(2026, 6, 1);

const setupFor = ({
  goal = 'maintenance',
  anchorOn,
  correctionFrom,
}: { goal?: 'maintenance' | 'fatLoss'; anchorOn?: CalendarDate; correctionFrom?: CalendarDate } = {}) =>
  new UserSetup({
    profile: new Profile({ sex: 'male', birthDate: CalendarDate.of(1990, 1, 1), heightCm: 178 }),
    screening: new ScreeningAnswers(),
    trainingStatus: 'intermediate',
    trainingDaysPerWeek: 3,
    goalMode: goal,
    onboardedOn: today.addDays(-200),
    maintenanceAnchorOn: anchorOn,
    maintenanceCorrectionFrom: correctionFrom,
  });

const record = ({
  daysAgo,
  mode,
  kcal,
  tdee = 2700,
  rate = mode === 'fatLoss' ? -0.0075 : 0,
  flags,
}: {
  daysAgo: number;
  mode: 'maintenance' | 'fatLoss';
  kcal: number;
  tdee?: number;
  rate?: number;
  flags?: Set<'easingIn' | 'maintenanceCorrection'>;
}) =>
  new TargetsRecord({
    effectiveFrom: today.addDays(-daysAgo),
    mode,
    tdeeKcal: tdee,
    tdeeSigmaKcal: 150,
    tdeeStatus: 'updated',
    targets: new DailyTargets({ kcal, proteinG: 160, proteinMinimumG: 130, fatG: 75, carbsG: 300, weeklyRateFraction: rate, flags: flags ?? new Set() }),
  });

/** A flat trend at `levelKg` for `days` days through yesterday, with `shiftKg` added from day `shiftFrom` ago on. */
const trend = ({ days = 60, levelKg = 82, shiftKg = 0, shiftFrom = 0 }: { days?: number; levelKg?: number; shiftKg?: number; shiftFrom?: number } = {}) =>
  upTo(days).map((i) => {
    const daysAgo = days - i;
    return new WeightTrendPoint({
      date: today.addDays(-daysAgo),
      levelKg: levelKg + (daysAgo <= shiftFrom ? shiftKg : 0),
      slopeKgPerDay: 0,
      waterKg: 0,
      levelVariance: 0.04,
      slopeVariance: 0,
      observed: true,
      rejected: false,
    });
  });

function snapshot({ tdee = 2700, points = trend() }: { tdee?: number; points?: WeightTrendPoint[] } = {}): CoachSnapshot {
  const who = setupFor();
  return new CoachSnapshot({
    policy: CoachingPolicy.derive({ profile: who.profile, screening: who.screening, today }),
    trend: points,
    trendWeightKg: points[points.length - 1]?.levelKg ?? 82,
    bodyFat: new BodyFatEstimate({ percent: 22, sigmaPercent: 2 }),
    bmrKcal: 1800,
    calorieFloorKcal: 1800,
    tdee: new TdeeEstimate({ kcal: tdee, sigmaKcal: 150, status: 'updated', usableIntakeDays: 28, excludedPartialDays: 0, weighIns: 28 }),
    confidence: new CoachConfidence({
      level: 'good',
      estimate: 'good',
      foodLog: 'good',
      weighIns: 'good',
      stability: 'good',
      nextStep: 'keepLogging',
      usableFoodDays: 28,
      weighInDays: 28,
    }),
    recommendation: { mode: 'maintenance', reason: 'cutFirst' },
  });
}

/** Twelve weeks of cutting, then maintenance since `sinceDaysAgo`, the last record `lastDaysAgo` ago. */
const afterCut = ({ sinceDaysAgo, lastDaysAgo = 7 }: { sinceDaysAgo: number; lastDaysAgo?: number }) => {
  const history = [record({ daysAgo: sinceDaysAgo + 84, mode: 'fatLoss', kcal: 2100 }), record({ daysAgo: sinceDaysAgo, mode: 'maintenance', kcal: 2700 })];
  if (lastDaysAgo < sinceDaysAgo) history.push(record({ daysAgo: lastDaysAgo, mode: 'maintenance', kcal: 2700 }));
  return history;
};

describe('where maintenance stands', () => {
  it('maintenance began with the first of the trailing maintenance records, after a cut of so many weeks', () => {
    const history = afterCut({ sinceDaysAgo: 20 });
    expect(maintenanceStartOn(history, today)).toBe(today.addDays(-20));
    const status = assessMaintenance({ setup: setupFor(), history, trend: trend(), today });
    expect(status?.fromDeficitWeeks).toBe(12);
    expect(maintenanceStartOn([record({ daysAgo: 10, mode: 'fatLoss', kcal: 2100 })], today)).toBeUndefined();
  });

  it('the anchor is the trend weight 14 days in, not the weight on the day', () => {
    // The scale came up a kilogram as the water returned, over the first ten days.
    const points = trend({ levelKg: 81, shiftKg: 1, shiftFrom: 20 });
    const history = afterCut({ sinceDaysAgo: 30 });
    const anchor = maintenanceAnchorOf({ history, trend: points, today });
    expect(anchor?.on).toBe(today.addDays(-30 + MaintenanceRule.anchorAfterDays));
    expect(anchor?.weightKg).toBe(82);
    expect(anchor?.halfWidthKg).toBeCloseTo(82 * 0.015, 9);
    expect(maintenanceAnchorOf({ history: afterCut({ sinceDaysAgo: 10 }), trend: points, today }), 'too soon').toBeUndefined();
  });

  it('an accepted new weight moves the anchor to that day', () => {
    const points = trend({ levelKg: 82, shiftKg: 2, shiftFrom: 20 });
    const history = afterCut({ sinceDaysAgo: 60 });
    const anchor = maintenanceAnchorOf({ history, trend: points, today, acceptedOn: today.addDays(-5) });
    expect(anchor?.weightKg).toBe(84);
    expect(anchor?.on).toBe(today.addDays(-5));
  });

  it('drift: in the band, drifting, and out after 14 days on one side', () => {
    const anchor = { weightKg: 82, on: today.addDays(-30), halfWidthKg: 1.23 };
    expect(assessMaintenanceDrift({ anchor, trend: trend({ shiftKg: 1, shiftFrom: 20 }), today })?.status).toBe('inBand');
    const drifting = assessMaintenanceDrift({ anchor, trend: trend({ shiftKg: 1.5, shiftFrom: 5 }), today });
    expect(drifting?.status).toBe('drifting');
    expect(drifting?.daysOutside).toBe(5);
    const out = assessMaintenanceDrift({ anchor, trend: trend({ shiftKg: 1.5, shiftFrom: 14 }), today });
    expect(out?.status).toBe('out');
    expect(out?.daysOutside).toBe(14);
    expect(out?.deviationKg).toBeCloseTo(1.5, 9);
    expect(assessMaintenanceDrift({ anchor, trend: trend({ shiftKg: -1.5, shiftFrom: 20 }), today })?.deviationKg).toBeCloseTo(-1.5, 9);
  });

  it('about a week of maintenance per four of deficit, never fewer than two', () => {
    expect(suggestedMaintenanceWeeks(12)).toBe(3);
    expect(suggestedMaintenanceWeeks(4)).toBe(2);
    expect(suggestedMaintenanceWeeks(1)).toBe(2);
    expect(suggestedMaintenanceWeeks(20)).toBe(5);
  });
});

describe('the weekly loop at maintenance', () => {
  const stable = (points = trend({ shiftKg: 0.6, shiftFrom: 30 })) => ({
    setup: setupFor(),
    snapshot: snapshot({ points }),
    history: afterCut({ sinceDaysAgo: 56 }),
    today,
  });

  it('stable targets: wandering inside the band with an unchanged estimate changes nothing', () => {
    expect(nextTargets(stable())).toBeUndefined();
  });

  it('inside the band, an estimate that moved beyond its uncertainty does change them', () => {
    const next = nextTargets({ ...stable(), snapshot: snapshot({ tdee: 2900, points: trend({ shiftKg: 0.6, shiftFrom: 30 }) }) });
    expect(next).toBeDefined();
    expect(next?.targets.kcal).toBeGreaterThan(2700);
  });

  it('drifted out for 14 days: nothing changes until answered', () => {
    const points = trend({ shiftKg: 2, shiftFrom: 14 });
    expect(nextTargets({ ...stable(points), snapshot: snapshot({ tdee: 2950, points }) })).toBeUndefined();
  });

  it('correct back: a gentle pace in the needed direction, flagged, until the trend is back in the band', () => {
    const points = trend({ shiftKg: 2, shiftFrom: 14 });
    const next = nextTargets({ ...stable(points), setup: setupFor({ correctionFrom: today.addDays(-1) }) });
    expect(next?.targets.flags.has('maintenanceCorrection')).toBe(true);
    expect(next?.targets.weeklyRateFraction).toBeCloseTo(-MaintenanceRule.correctionFraction, 9);
    expect(next?.targets.kcal).toBeLessThan(2700);
    const below = trend({ shiftKg: -2, shiftFrom: 14 });
    expect(nextTargets({ ...stable(below), setup: setupFor({ correctionFrom: today.addDays(-1) }) })?.targets.weeklyRateFraction).toBeCloseTo(
      MaintenanceRule.correctionFraction,
      9,
    );
  });

  it('accept the new weight: the anchor moves and the band holds there', () => {
    const points = trend({ shiftKg: 2, shiftFrom: 14 });
    expect(nextTargets({ ...stable(points), setup: setupFor({ anchorOn: today.addDays(-1) }) })).toBeUndefined();
  });

  it('the end of a cut: maintenance at the measured expenditure, at once', () => {
    const history = [record({ daysAgo: 84, mode: 'fatLoss', kcal: 1900 })];
    const next = nextTargets({ setup: setupFor(), snapshot: snapshot({ tdee: 2450 }), history, today });
    expect(next?.mode).toBe('maintenance');
    expect(next?.targets.kcal).toBeCloseTo(2450, 0);
    expect(next?.targets.flags.has('easingIn')).toBe(false);
  });

  it('easing in: two equal steps a week apart, and no step claims a metabolic benefit', () => {
    const history = [record({ daysAgo: 84, mode: 'fatLoss', kcal: 1900 })];
    const first = nextTargets({ setup: setupFor(), snapshot: snapshot({ tdee: 2450 }), history, today, easeIntoMaintenance: true });
    expect(first?.targets.flags.has('easingIn')).toBe(true);
    expect(first?.targets.kcal).toBeCloseTo((1900 + 2450) / 2, 0);
    expect(first?.targets.weeklyRateFraction).toBe(0);
    const later = today.addDays(MaintenanceRule.easeInStepDays);
    const second = nextTargets({
      setup: setupFor(),
      snapshot: snapshot({ tdee: 2450 }),
      history: [...history, new TargetsRecord({ ...first!, effectiveFrom: today, targets: first!.targets, mode: 'maintenance', tdeeKcal: 2450, tdeeSigmaKcal: 150, tdeeStatus: 'updated' })],
      today: later,
      easeIntoMaintenance: true,
    });
    expect(second?.targets.kcal).toBeCloseTo(2450, 0);
    expect(second?.targets.flags.has('easingIn')).toBe(false);
    const tooSoon = nextTargets({
      setup: setupFor(),
      snapshot: snapshot({ tdee: 2450 }),
      history: [...history, new TargetsRecord({ ...first!, effectiveFrom: today, targets: first!.targets, mode: 'maintenance', tdeeKcal: 2450, tdeeSigmaKcal: 150, tdeeStatus: 'updated' })],
      today: today.addDays(3),
      easeIntoMaintenance: true,
    });
    expect(tooSoon).toBeUndefined();
  });
});
