import { describe, expect, it } from 'vitest';
import { CalendarDate, type GoalMode, IntakeDay, Pause, Profile, ScreeningAnswers, UserSetup } from '../../src/domain';
import {
  analyze,
  breakInForce,
  type CoachSnapshot,
  consecutiveDeficitWeeks,
  DailyTargets,
  deficitStartOn,
  DietBreakRule,
  nextCheckIn,
  nextTargets,
  pauseDeficitRestartOn,
  type TargetFlag,
  TargetsRecord,
} from '../../src/engine';
import { upTo } from '../support/upTo';

/**
 * MM-135: the diet break as the product owner decided it on 2026-10-13.
 * Offered at twelve unbroken weeks and on failing recovery signals (the
 * offer itself is in `reliefOffer.test.ts`); planned by the app only at
 * twenty; two weeks long; any seven consecutive days at or above
 * maintenance targets end the unbroken run.
 */
const today = CalendarDate.of(2026, 10, 20);

const record = (daysAgo: number, rate = -0.0075, { flags = [], mode = 'fatLoss' }: { flags?: TargetFlag[]; mode?: GoalMode } = {}) =>
  new TargetsRecord({
    effectiveFrom: today.addDays(-daysAgo),
    targets: new DailyTargets({
      kcal: rate < 0 ? 2100 : 2700,
      proteinG: 160,
      fatG: 70,
      carbsG: 200,
      weeklyRateFraction: rate,
      flags: new Set(flags),
    }),
    mode,
    tdeeKcal: 2700,
    tdeeSigmaKcal: 150,
    tdeeStatus: 'updated',
  });

describe('what ends the unbroken deficit', () => {
  it('seven consecutive days of maintenance targets reset the count, six do not', () => {
    // A deficit from 70 days ago, maintenance from day 35 to day 28, deficit again since.
    expect(consecutiveDeficitWeeks([record(70), record(35, 0), record(28)], today)).toBe(4);
    expect(deficitStartOn([record(70), record(35, 0), record(28)], today)).toBe(today.addDays(-28));
    // The same, but the maintenance stretch lasted six days: the run is whole.
    expect(consecutiveDeficitWeeks([record(70), record(34, 0), record(28)], today)).toBe(10);
    expect(deficitStartOn([record(70), record(34, 0), record(28)], today)).toBe(today.addDays(-70));
    expect(DietBreakRule.resetDays).toBe(7);
  });

  it('seven days of targets above maintenance reset it too', () => {
    expect(consecutiveDeficitWeeks([record(70), record(35, 0.0035, { mode: 'leanGain' }), record(28)], today)).toBe(4);
  });

  it('a break the user took, or the app planned, resets it', () => {
    expect(consecutiveDeficitWeeks([record(70), record(35, 0, { flags: ['requestedBreak'] }), record(21)], today)).toBe(3);
    expect(consecutiveDeficitWeeks([record(70), record(35, 0, { flags: ['dietBreak'] }), record(21)], today)).toBe(3);
  });

  it('a pause of seven days resets it, through the restart it sets (MM-148)', () => {
    const pause = new Pause({ from: today.addDays(-30), to: today.addDays(-24), reason: 'travel' });
    const restartOn = pauseDeficitRestartOn([pause], today);
    expect(restartOn).toBe(today.addDays(-23));
    expect(consecutiveDeficitWeeks([record(70)], today, { restartOn })).toBe(3);
    const short = new Pause({ from: today.addDays(-30), to: today.addDays(-25), reason: 'travel' });
    expect(pauseDeficitRestartOn([short], today)).toBeUndefined();
  });

  it('a gap of fourteen days resets it, through the restart it sets (MM-147)', () => {
    expect(consecutiveDeficitWeeks([record(70)], today, { restartOn: today.addDays(-14) })).toBe(2);
  });

  it('the current targets at maintenance mean no run, however new they are', () => {
    expect(consecutiveDeficitWeeks([record(70), record(1, 0)], today)).toBe(0);
    expect(deficitStartOn([record(70), record(0, 0)], today)).toBeUndefined();
  });
});

describe('a break in force', () => {
  it('lasts two weeks from its first day, through targets reissued inside it', () => {
    const chosen = [record(70), record(10, 0, { flags: ['requestedBreak'] }), record(4, 0, { flags: ['requestedBreak'] })];
    expect(breakInForce(chosen, today)).toEqual({ flag: 'requestedBreak', startedOn: today.addDays(-10) });
    expect(breakInForce([record(70), record(14, 0, { flags: ['dietBreak'] })], today)).toBeUndefined();
    expect(breakInForce([record(70), record(13, 0, { flags: ['dietBreak'] })], today)?.flag).toBe('dietBreak');
    expect(breakInForce([record(70), record(3, 0)], today), 'maintenance that is not a break').toBeUndefined();
    expect(DietBreakRule.breakWeeks).toBe(2);
  });

  // MM-432: the length is the one the break's first record carries.
  it('lasts one week when one week was chosen', () => {
    const chosen = [record(70), record(6, 0, { flags: ['requestedOneWeekBreak'] }), record(2, 0, { flags: ['requestedOneWeekBreak'] })];
    expect(breakInForce(chosen, today)).toEqual({ flag: 'requestedOneWeekBreak', startedOn: today.addDays(-6) });
    expect(breakInForce([record(70), record(7, 0, { flags: ['requestedOneWeekBreak'] })], today)).toBeUndefined();
    expect(DietBreakRule.shortBreakWeeks).toBe(1);
  });

  it('puts the next check-in two weeks out', () => {
    const user = new UserSetup({
      profile: new Profile({ sex: 'female', birthDate: CalendarDate.of(1990, 1, 1), heightCm: 165 }),
      screening: new ScreeningAnswers(),
      trainingStatus: 'novice',
      trainingDaysPerWeek: 3,
      goalMode: 'fatLoss',
      onboardedOn: today.addDays(-200),
    });
    expect(nextCheckIn(user, record(3, 0, { flags: ['dietBreak'] }))).toBe(today.addDays(11));
    expect(nextCheckIn(user, record(3))).toBe(today.addDays(4));
    // MM-432: a one-week break's own length, or the Coach and dashboard say the wrong date.
    expect(nextCheckIn(user, record(3, 0, { flags: ['requestedOneWeekBreak'] }))).toBe(today.addDays(4));
    expect(nextCheckIn(user, record(3, 0, { flags: ['requestedBreak'] }))).toBe(today.addDays(11));
  });
});

describe('the break the app plans at twenty weeks', () => {
  const start = today.addDays(-147);
  const user = new UserSetup({
    profile: new Profile({ sex: 'male', birthDate: CalendarDate.of(1990, 1, 1), heightCm: 180 }),
    screening: new ScreeningAnswers(),
    trainingStatus: 'intermediate',
    trainingDaysPerWeek: 3,
    goalMode: 'fatLoss',
    onboardedOn: start,
    unitSystem: 'metric',
  });

  // Thin data: weigh-ins on the last ten days only and no food, so the estimate is held.
  const snapshotOn = (day: CalendarDate) =>
    analyze({
      setup: user,
      weights: upTo(10).map((i) => ({ date: day.addDays(-i), weightKg: 84 - i * 0.05 })),
      intake: upTo(5).map((i) => new IntakeDay({ date: day.addDays(-1 - i), kcal: 2100, proteinG: 160, carbsG: 200, fatG: 70 })),
      today: day,
    }) as CoachSnapshot;

  // Twenty whole weeks of deficit, the last check-in a week ago.
  const history = [record(140), record(7)];

  it('is issued at the check-in, estimate held or not, beyond the weekly step', () => {
    const snapshot = snapshotOn(today);
    expect(snapshot.tdee.status).toBe('held');
    expect(consecutiveDeficitWeeks(history, today)).toBe(20);
    const planned = nextTargets({ setup: user, snapshot, history, today }) as TargetsRecord;
    expect(planned.targets.flags).toContain('dietBreak');
    expect(planned.targets.weeklyRateFraction).toBe(0);
    expect(planned.targets.kcal - 2100).toBeGreaterThan(100);
    expect(planned.explanation?.lines.map((l) => l.reason)).toContain('dietBreak');
  });

  // MM-432: a one-week break chosen before changes nothing here; the floor is two weeks.
  it('is two weeks whatever length was chosen before', () => {
    const choseOneWeek = user.copyWith({ maintenanceWeekFrom: today.addDays(-200), breakWeeks: 1 });
    const planned = nextTargets({ setup: choseOneWeek, snapshot: snapshotOn(today), history, today }) as TargetsRecord;
    expect(planned.targets.flags).toContain('dietBreak');
    expect(planned.targets.flags).not.toContain('requestedOneWeekBreak');
    expect(nextCheckIn(choseOneWeek, planned)).toBe(today.addDays(14));
    expect(breakInForce([...history, planned], today.addDays(13))?.flag).toBe('dietBreak');
    const on = today.addDays(7);
    expect(nextTargets({ setup: choseOneWeek, snapshot: snapshotOn(on), history: [...history, planned], today: on })).toBeUndefined();
  });

  it('is not issued a week earlier', () => {
    const early = nextTargets({ setup: user, snapshot: snapshotOn(today), history: [record(133), record(7)], today });
    expect(early?.targets.flags.has('dietBreak') ?? false).toBe(false);
  });

  it('holds for two weeks, then the deficit resumes at once and the count restarts', () => {
    const planned = nextTargets({ setup: user, snapshot: snapshotOn(today), history, today }) as TargetsRecord;
    const during = [...history, planned];
    for (const day of [1, 7, 13]) {
      const on = today.addDays(day);
      expect(nextTargets({ setup: user, snapshot: snapshotOn(on), history: during, today: on }), `day ${day}`).toBeUndefined();
    }
    const after = today.addDays(14);
    const resumed = nextTargets({ setup: user, snapshot: snapshotOn(after), history: during, today: after }) as TargetsRecord;
    expect(resumed.targets.weeklyRateFraction).toBeLessThan(0);
    expect(resumed.targets.flags).not.toContain('dietBreak');
    expect(resumed.targets.flags).not.toContain('rateLimited');
    expect(planned.targets.kcal - resumed.targets.kcal).toBeGreaterThan(100);
    expect(resumed.explanation?.lines.map((l) => l.reason)).toContain('breakEnded');
    expect(consecutiveDeficitWeeks([...during, resumed], after)).toBe(0);
    expect(consecutiveDeficitWeeks([...during, resumed], after.addDays(14))).toBe(2);
  });
});
