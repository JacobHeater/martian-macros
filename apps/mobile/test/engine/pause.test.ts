import { describe, expect, it } from 'vitest';
import {
  CalendarDate,
  DailyActivity,
  type DayCompleteness,
  IntakeDay,
  Pause,
  type PauseReason,
  Profile,
  ScreeningAnswers,
  UserSetup,
  type WeightObservation,
} from '../../src/domain';
import {
  activityGaps,
  analyze,
  type CoachSnapshot,
  consecutiveDeficitWeeks,
  DailyTargets,
  nextTargets,
  openGap,
  pauseDeficitRestartOn,
  pausedDaysBetween,
  pausedGuide,
  pauseOn,
  pauseSettlingWindows,
  pauseToResume,
  pauseWeightEvents,
  settlingDays,
  TargetsRecord,
  withoutPausedDays,
} from '../../src/engine';
import { expectClose } from '../support/expectClose';
import { upTo } from '../support/upTo';

/** MM-148: a pause is a planned break, and nothing in it is judged. */
const start = CalendarDate.of(2026, 1, 1);

const weigh = (day: number, kg = 85): WeightObservation => ({ date: start.addDays(day), weightKg: kg });

const ate = (day: number, { kcal = 2200, completeness = 'unmarked' }: { kcal?: number; completeness?: DayCompleteness } = {}) =>
  new IntakeDay({ date: start.addDays(day), kcal, proteinG: 150, carbsG: 220, fatG: 70, completeness });

const pause = (from: number, to: number, reason: PauseReason = 'travel') =>
  new Pause({ from: start.addDays(from), to: start.addDays(to), reason });

const setup = new UserSetup({
  profile: new Profile({ sex: 'male', birthDate: CalendarDate.of(1990, 1, 1), heightCm: 180 }),
  screening: new ScreeningAnswers(),
  trainingStatus: 'intermediate',
  trainingDaysPerWeek: 3,
  dailyActivity: DailyActivity.values[0],
  goalMode: 'fatLoss',
  onboardedOn: start,
  unitSystem: 'metric',
});

const record = (day: number, rate = -0.005) =>
  new TargetsRecord({
    effectiveFrom: start.addDays(day),
    targets: new DailyTargets({ kcal: 2200, proteinG: 160, fatG: 70, carbsG: 220, weeklyRateFraction: rate }),
    mode: 'fatLoss',
    tdeeKcal: 2700,
    tdeeSigmaKcal: 150,
    tdeeStatus: 'updated',
  });

describe('a pause', () => {
  it('covers its first and last day and nothing outside them', () => {
    const p = pause(10, 20);
    expect(p.days).toBe(11);
    expect(pauseOn([p], start.addDays(9))).toBeUndefined();
    expect(pauseOn([p], start.addDays(10))).toBe(p);
    expect(pauseOn([p], start.addDays(20))).toBe(p);
    expect(pauseOn([p], start.addDays(21))).toBeUndefined();
    expect(p.resumesOn).toBe(start.addDays(21));
  });

  it('is never a gap, however little was recorded in it', () => {
    const today = start.addDays(21);
    expect(activityGaps({ weights: [weigh(9)], intake: [], today, pauses: [pause(10, 20)] })).toEqual([]);
    expect(openGap({ weights: [weigh(9)], intake: [], today, pauses: [pause(10, 20)] })).toBeUndefined();
  });

  it('days away after it ends do become a gap', () => {
    const gaps = activityGaps({ weights: [weigh(9)], intake: [], today: start.addDays(30), pauses: [pause(10, 20)] });
    expect(gaps).toHaveLength(1);
    expect(gaps[0]?.from).toBe(start.addDays(21));
  });

  it('a scheduled pause is not activity before it starts', () => {
    const gaps = activityGaps({ weights: [weigh(0)], intake: [], today: start.addDays(10), pauses: [pause(20, 30)] });
    expect(gaps).toHaveLength(1);
    expect(gaps[0]?.days).toBe(9);
  });
});

describe('the estimator', () => {
  it('leaves paused days out', () => {
    const intake = upTo(30).map((i) => ate(i));
    const kept = withoutPausedDays(intake, [pause(10, 19)], { keepComplete: true });
    expect(kept).toHaveLength(20);
    expect(kept.some((d) => pause(10, 19).covers(d.date))).toBe(false);
  });

  it('keeps paused days that were marked complete', () => {
    const intake = upTo(30).map((i) => ate(i, { completeness: i >= 10 && i < 15 ? 'complete' : 'unmarked' }));
    const kept = withoutPausedDays(intake, [pause(10, 19)], { keepComplete: true });
    expect(kept).toHaveLength(25);
  });

  it('nothing that judges a day sees a paused one, complete or not', () => {
    const intake = upTo(30).map((i) => ate(i, { completeness: 'complete' }));
    expect(withoutPausedDays(intake, [pause(10, 19)], { keepComplete: false })).toHaveLength(20);
  });

  it('analysis uses fewer days when ten of them were paused', () => {
    const weights = upTo(31).map((i) => weigh(i));
    const intake = upTo(30).map((i) => ate(i));
    const today = start.addDays(30);
    const plain = analyze({ setup, weights, intake, today }) as CoachSnapshot;
    const paused = analyze({ setup, weights, intake, today, pauses: [pause(15, 24)] }) as CoachSnapshot;
    expect(plain.tdee.usableIntakeDays - paused.tdee.usableIntakeDays).toBe(10);
  });
});

describe('the unbroken-deficit count', () => {
  it('restarts after a pause of a week or more', () => {
    const today = start.addDays(9 * 7 + 10);
    expect(pauseDeficitRestartOn([pause(63, 72)], today)).toBe(today);

    const snapshot = analyze({
      setup,
      weights: upTo(74).map((i) => weigh(i)),
      intake: upTo(63).map((i) => ate(i)),
      history: [record(0)],
      today,
      pauses: [pause(63, 72)],
    }) as CoachSnapshot;
    expect(snapshot.deficitRestartOn).toBe(today);
    expect(consecutiveDeficitWeeks([record(0)], today, { restartOn: snapshot.deficitRestartOn })).toBe(0);
  });

  it('does not restart for a pause of six days', () => {
    expect(pauseDeficitRestartOn([pause(10, 15)], start.addDays(30))).toBeUndefined();
  });

  it('does not restart for a pause that has not started', () => {
    expect(pauseDeficitRestartOn([pause(40, 60)], start.addDays(30))).toBeUndefined();
  });

  it('restarts on the seventh day of a pause still running', () => {
    expect(pauseDeficitRestartOn([pause(10, 30)], start.addDays(15))).toBeUndefined();
    expect(pauseDeficitRestartOn([pause(10, 30)], start.addDays(16))).toBe(start.addDays(16));
  });
});

describe('the glycogen shift at both ends (MM-131)', () => {
  const window = (first: number) => ({ start: start.addDays(first), end: start.addDays(first + settlingDays - 1) });
  const windowsOf = (pauses: Pause[], today: number, history = [record(0)]) =>
    pauseSettlingWindows({ pauses, history, today: start.addDays(today) }).map((w) => ({ start: w.start, end: w.end }));

  it('a pause from a deficit settles on its first day and on the day after it', () => {
    expect(windowsOf([pause(20, 29)], 45)).toEqual([window(20), window(30)]);
  });

  it('a pause still running has only its first day so far', () => {
    expect(windowsOf([pause(20, 29)], 25)).toEqual([window(20)]);
  });

  it('a pause too short to be a break, or not yet started, moves nothing', () => {
    expect(windowsOf([pause(20, 25)], 45)).toEqual([]);
    expect(windowsOf([pause(50, 60)], 45)).toEqual([]);
  });

  it('a pause of exactly seven days is long enough to be a break', () => {
    expect(windowsOf([pause(20, 26)], 45)).toEqual([window(20), window(27)]);
  });

  /** `kcal` against an expenditure of 2000, from day 0. */
  const against2000 = (kcal: number) =>
    new TargetsRecord({
      effectiveFrom: start,
      targets: new DailyTargets({ kcal, proteinG: 160, fatG: 70, carbsG: 200, weeklyRateFraction: -0.005 }),
      mode: 'fatLoss',
      tdeeKcal: 2000,
      tdeeSigmaKcal: 150,
      tdeeStatus: 'updated',
    });

  it('targets exactly on the 10% line are not a change of phase; just past it they are', () => {
    expect(windowsOf([pause(20, 29)], 45, [against2000(1800)])).toEqual([]);
    expect(windowsOf([pause(20, 29)], 45, [against2000(1799)])).toEqual([window(20), window(30)]);
  });

  it('each end is judged on the targets in force on it: a return to maintenance does not settle', () => {
    const maintenanceFrom = (day: number) =>
      new TargetsRecord({
        effectiveFrom: start.addDays(day),
        targets: new DailyTargets({ kcal: 2700, proteinG: 160, fatG: 70, carbsG: 290, weeklyRateFraction: 0 }),
        mode: 'maintenance',
        tdeeKcal: 2700,
        tdeeSigmaKcal: 150,
        tdeeStatus: 'updated',
      });
    // The goal changed to maintenance while paused: the pause began from a deficit and returns to maintenance.
    expect(windowsOf([pause(20, 29)], 45, [record(0), maintenanceFrom(25)])).toEqual([window(20)]);
    // Paused from maintenance, returning to a deficit issued on the day after.
    expect(windowsOf([pause(20, 29)], 45, [maintenanceFrom(0), record(30)])).toEqual([window(30)]);
  });

  it('a pause from targets at maintenance moves nothing, and neither does one before any targets', () => {
    const atMaintenance = new TargetsRecord({
      effectiveFrom: start,
      targets: new DailyTargets({ kcal: 2650, proteinG: 160, fatG: 70, carbsG: 280, weeklyRateFraction: 0 }),
      mode: 'maintenance',
      tdeeKcal: 2700,
      tdeeSigmaKcal: 150,
      tdeeStatus: 'updated',
    });
    expect(windowsOf([pause(20, 29)], 45, [atMaintenance])).toEqual([]);
    expect(windowsOf([pause(20, 29)], 45, [])).toEqual([]);
  });

  it('the estimate waits for the water to settle after a pause, as after any change of phase', () => {
    const today = start.addDays(37);
    const input = {
      setup,
      weights: upTo(38).map((i) => weigh(i)),
      intake: upTo(37).map((i) => ate(i)),
      history: [record(0)],
      today,
    };
    const plain = analyze(input) as CoachSnapshot;
    expect(plain.tdee.settlingUntil).toBeUndefined();
    const paused = analyze({ ...input, pauses: [pause(14, 23)] }) as CoachSnapshot;
    expect(paused.tdee.status).toBe('held');
    expect(paused.tdee.settlingUntil).toEqual(start.addDays(33));
  });
});

describe('illness and injury', () => {
  it('an illness pause records illness events across its days', () => {
    const events = pauseWeightEvents(pause(10, 19, 'illness'));
    expect(events.map((e) => e.date)).toEqual([start.addDays(10), start.addDays(17)]);
    expect(events.every((e) => e.type === 'illness')).toBe(true);
  });

  it('an injury pause records an event too', () => {
    expect(pauseWeightEvents(pause(10, 12, 'injury'))).toHaveLength(1);
  });

  it('travel records none', () => {
    expect(pauseWeightEvents(pause(10, 19))).toEqual([]);
  });
});

describe('the check-in', () => {
  const snapshotOn = (today: CalendarDate, pauses: Pause[]) =>
    analyze({
      setup,
      weights: upTo(start.daysUntil(today) + 1).map((i) => weigh(i)),
      intake: upTo(start.daysUntil(today)).map((i) => ate(i)),
      history: [record(0)],
      today,
      pauses,
    }) as CoachSnapshot;

  it('does not run during a pause, even for a goal change', () => {
    const today = start.addDays(45);
    const pauses = [pause(40, 50)];
    expect(
      nextTargets({
        setup: setup.copyWith({ goalMode: 'maintenance' }),
        snapshot: snapshotOn(today, pauses),
        history: [record(0)],
        today,
        pauses,
      }),
    ).toBeUndefined();
  });

  // Six days: too short to be a change of phase, so only the week's wait applies.
  it('waits seven days after a pause ends', () => {
    const pauses = [pause(40, 45)];
    const on = (day: number) =>
      nextTargets({
        setup,
        snapshot: snapshotOn(start.addDays(day), pauses),
        history: [record(0)],
        today: start.addDays(day),
        pauses,
      });
    expect(on(46)).toBeUndefined();
    expect(on(52)).toBeUndefined();
    expect(on(53)).toBeDefined();
  });

  it('after a pause of a week or more, the week is up but nothing moves while the water settles (MM-131)', () => {
    const pauses = [pause(40, 50)];
    const today = start.addDays(58);
    const snapshot = snapshotOn(today, pauses);
    expect(snapshot.tdee.settlingUntil).toEqual(start.addDays(60));
    expect(nextTargets({ setup, snapshot, history: [record(0)], today, pauses })).toBeUndefined();
  });

  it('first targets are still issued to someone who starts paused', () => {
    const today = start.addDays(3);
    expect(
      nextTargets({
        setup,
        snapshot: snapshotOn(today, [pause(0, 10)]),
        history: [],
        today,
        pauses: [pause(0, 10)],
      }),
    ).toBeDefined();
  });
});

describe('resuming', () => {
  it('is due once a pause has ended, until a weigh-in is saved', () => {
    const today = start.addDays(21);
    const p = pause(10, 20);
    expect(pauseToResume({ pauses: [p], weights: [weigh(9)], today })).toBe(p);
    expect(pauseToResume({ pauses: [p], weights: [weigh(9), weigh(21)], today })).toBeUndefined();
  });

  it('is not due while a pause is running', () => {
    expect(pauseToResume({ pauses: [pause(10, 20)], weights: [weigh(9)], today: start.addDays(20) })).toBeUndefined();
  });

  it('a weigh-in during the pause does not count as the one after', () => {
    expect(pauseToResume({ pauses: [pause(10, 20)], weights: [weigh(15)], today: start.addDays(21) })).toBeDefined();
  });
});

it('the guide during a pause is maintenance, whatever the goal', () => {
  const today = start.addDays(30);
  const snapshot = analyze({
    setup,
    weights: upTo(31).map((i) => weigh(i)),
    intake: upTo(30).map((i) => ate(i)),
    today,
  }) as CoachSnapshot;
  const guide = pausedGuide({ setup, snapshot });
  expect(guide.weeklyRateFraction).toBe(0);
  expectClose(guide.kcal, snapshot.tdee.kcal, 1);

  const gaining = pausedGuide({ setup: setup.copyWith({ goalMode: 'leanGain' }), snapshot });
  expect(gaining.kcal).toBe(guide.kcal);
});

it('paused days are counted once where pauses overlap', () => {
  expect(pausedDaysBetween([pause(0, 9), pause(5, 14), pause(100, 110)], start, start.addDays(119))).toBe(26);
  expect(pausedDaysBetween([pause(0, 9)], start.addDays(5), start.addDays(30))).toBe(5);
});
