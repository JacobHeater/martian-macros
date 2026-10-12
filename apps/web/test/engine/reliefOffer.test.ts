import { describe, expect, it } from 'vitest';
import {
  CalendarDate,
  type GoalMode,
  IntakeDay,
  Pause,
  Profile,
  RecoveryCheckIn,
  ScreeningAnswers,
  UserSetup,
} from '../../src/domain';
import {
  analyze,
  canHoldReduction,
  type CoachSnapshot,
  consecutiveDeficitWeeks,
  DailyTargets,
  findReliefOffer,
  nextTargets,
  slowerPace,
  TargetFlag,
  TargetsRecord,
} from '../../src/engine';
import { expectClose } from '../support/expectClose';
import { upTo } from '../support/upTo';

/** MM-117: an offer to ease a deficit when recovery is failing. */
const today = CalendarDate.of(2026, 10, 5);

const man = () => new Profile({ sex: 'male', birthDate: CalendarDate.of(1990, 1, 1), heightCm: 180 });

const setup = ({
  goal = 'fatLoss',
  pace,
  answeredOn,
  breakFrom,
}: { goal?: GoalMode; pace?: number; answeredOn?: CalendarDate; breakFrom?: CalendarDate } = {}) =>
  new UserSetup({
    profile: man(),
    screening: new ScreeningAnswers(),
    trainingStatus: 'intermediate',
    trainingDaysPerWeek: 3,
    goalMode: goal,
    onboardedOn: today.addDays(-200),
    requestedLossFraction: pace,
    reliefAnsweredOn: answeredOn,
    maintenanceWeekFrom: breakFrom,
  });

const record = (daysAgo: number, rate = -0.0075) =>
  new TargetsRecord({
    effectiveFrom: today.addDays(-daysAgo),
    targets: new DailyTargets({ kcal: 2100, proteinG: 160, fatG: 70, carbsG: 200, weeklyRateFraction: rate }),
    mode: 'fatLoss',
    tdeeKcal: 2700,
    tdeeSigmaKcal: 150,
    tdeeStatus: 'updated',
  });

/** Hunger, energy and sleep at the hard end; training and mood fine. */
const hard = (daysAgo: number, sleepHours?: number) =>
  new RecoveryCheckIn({
    date: today.addDays(-daysAgo),
    hunger: 1,
    energy: 2,
    sleep: 2,
    training: 4,
    mood: 3,
    sleepHours,
  });

const fine = (daysAgo: number) =>
  new RecoveryCheckIn({ date: today.addDays(-daysAgo), hunger: 3, energy: 4, sleep: 2, training: 2, mood: 4 });

const offer = ({
  user,
  checkIns,
  history,
  pauses = [],
}: { user?: UserSetup; checkIns?: RecoveryCheckIn[]; history?: TargetsRecord[]; pauses?: Pause[] } = {}) =>
  findReliefOffer({
    setup: user ?? setup(),
    checkIns: checkIns ?? [hard(8), hard(1)],
    history: history ?? [record(21)],
    today,
    pauses,
  });

it('two hard check-ins running on a deficit make the offer', () => {
  expect(offer()).toBeDefined();
});

it('one hard check-in does not', () => {
  expect(offer({ checkIns: [hard(1)] })).toBeUndefined();
  expect(offer({ checkIns: [fine(8), hard(1)] })).toBeUndefined();
  expect(offer({ checkIns: [hard(8), fine(1)] })).toBeUndefined();
});

it('two answers at the hard end are not enough for a check-in', () => {
  expect(offer({ checkIns: [fine(8), fine(1)] })).toBeUndefined();
});

it('old check-ins do not count', () => {
  expect(offer({ checkIns: [hard(15), hard(8)] }), 'stale').toBeUndefined();
  expect(offer({ checkIns: [hard(40), hard(1)] }), 'not running').toBeUndefined();
});

it('the same week answered twice is one check-in', () => {
  expect(offer({ checkIns: [hard(2), hard(1)] })).toBeUndefined();
  expect(offer({ checkIns: [hard(6), hard(1)] })).toBeDefined();
});

it('is not made on lean gain or maintenance', () => {
  expect(offer({ user: setup({ goal: 'leanGain' }) })).toBeUndefined();
  expect(offer({ user: setup({ goal: 'maintenance' }) })).toBeUndefined();
});

it('is not made while the targets are already at maintenance', () => {
  expect(offer({ history: [record(21), record(2, 0)] })).toBeUndefined();
});

it('is made on recomp, with no slower pace to offer', () => {
  const found = offer({ user: setup({ goal: 'recomp' }) });
  expect(found).toBeDefined();
  expect(found?.slowerPace).toBeUndefined();
  expect(found?.suggestion).toBe('maintenanceWeek');
});

it('after any answer it is quiet for three weeks', () => {
  expect(offer({ user: setup({ answeredOn: today.addDays(-20) }) })).toBeUndefined();
  expect(offer({ user: setup({ answeredOn: today.addDays(-21) }) })).toBeDefined();
});

it('is not made during a pause', () => {
  expect(
    offer({ pauses: [new Pause({ from: today.addDays(-1), to: today.addDays(3), reason: 'illness' })] }),
  ).toBeUndefined();
});

describe('what the coach would pick', () => {
  it('early in a deficit, the slower pace', () => {
    const found = offer({ history: [record(21)] });
    expect(found?.deficitWeeks).toBe(3);
    expect(found?.suggestion).toBe('slowerPace');
    expect(found?.slowerPace).toBe(0.005);
  });

  it('eight weeks in, the maintenance week', () => {
    const found = offer({ history: [record(63)] });
    expect(found?.deficitWeeks).toBe(9);
    expect(found?.suggestion).toBe('maintenanceWeek');
    expect(found?.slowerPace, 'still offered').toBe(0.005);
  });

  it('already at the gentlest pace, the maintenance week', () => {
    const found = offer({ user: setup({ pace: 0.005 }) });
    expect(found).toBeDefined();
    expect(found?.slowerPace).toBeUndefined();
    expect(found?.suggestion).toBe('maintenanceWeek');
  });
});

it('a slower pace is one step gentler and never faster', () => {
  expect(slowerPace(0.01)).toBe(0.0075);
  expect(slowerPace(undefined)).toBe(0.005);
  expect(slowerPace(0.0075)).toBe(0.005);
  expect(slowerPace(0.005)).toBeUndefined();
  expect(slowerPace(0.004)).toBeUndefined();
});

it('short sleep adds a line and is never a trigger', () => {
  expect(offer({ checkIns: [hard(8, 5.5), hard(1, 6)] })?.shortSleep).toBe(true);
  expect(offer({ checkIns: [hard(8, 7), hard(1, 7)] })?.shortSleep).toBe(false);
  expect(offer()?.shortSleep, 'no hours given').toBe(false);
  const sleepless = (daysAgo: number) =>
    new RecoveryCheckIn({
      date: today.addDays(-daysAgo),
      hunger: 4,
      energy: 4,
      sleep: 1,
      training: 4,
      mood: 4,
      sleepHours: 4,
    });
  expect(offer({ checkIns: [sleepless(8), sleepless(1)] })).toBeUndefined();
});

describe('a maintenance week the user takes', () => {
  const start = today.addDays(-70);
  const user = new UserSetup({
    profile: man(),
    screening: new ScreeningAnswers(),
    trainingStatus: 'intermediate',
    trainingDaysPerWeek: 3,
    goalMode: 'fatLoss',
    onboardedOn: start,
    unitSystem: 'metric',
  });

  const snapshotOn = (day: CalendarDate) =>
    analyze({
      setup: user,
      weights: upTo(start.daysUntil(day) + 1).map((i) => ({ date: start.addDays(i), weightKg: 90 - i * 0.07 })),
      intake: upTo(start.daysUntil(day)).map(
        (i) => new IntakeDay({ date: start.addDays(i), kcal: 2100, proteinG: 160, carbsG: 200, fatG: 70 }),
      ),
      today: day,
    }) as CoachSnapshot;

  // The last check-in was three days ago, so an ordinary one is not due.
  const history = [record(3)];
  const lastKcal = (history[0] as TargetsRecord).targets.kcal;

  const taken = () => user.copyWith({ maintenanceWeekFrom: today });
  const firstOfBreak = () =>
    nextTargets({ setup: taken(), snapshot: snapshotOn(today), history, today }) as TargetsRecord;

  it('starts at once, at maintenance, beyond the weekly step', () => {
    expect(
      nextTargets({ setup: user, snapshot: snapshotOn(today), history, today }),
      'nothing is due without it',
    ).toBeUndefined();
    const next = firstOfBreak();
    expect(next.targets.flags).toContain('requestedBreak');
    expect(next.targets.weeklyRateFraction).toBe(0);
    expect(next.targets.kcal).toBeGreaterThan(lastKcal);
    expectClose(next.targets.kcal, snapshotOn(today).tdee.kcal, 1);
    expect(next.explanation?.lines.map((l) => l.reason)).toContain('requestedBreak');
  });

  it('is issued once, and holds for the week', () => {
    const first = firstOfBreak();
    for (let day = 0; day < 7; day++) {
      expect(
        nextTargets({
          setup: taken(),
          snapshot: snapshotOn(today.addDays(day)),
          history: [...history, first],
          today: today.addDays(day),
        }),
        `day ${day}`,
      ).toBeUndefined();
    }
  });

  it('ends the unbroken deficit, and the deficit resumes after it', () => {
    const first = firstOfBreak();
    const after = today.addDays(7);
    expect(consecutiveDeficitWeeks([...history, first], after)).toBe(0);
    const resumed = nextTargets({
      setup: taken(),
      snapshot: snapshotOn(after),
      history: [...history, first],
      today: after,
    });
    expect(resumed?.targets.weeklyRateFraction).toBeLessThan(0);
    expect(resumed?.targets.flags).not.toContain('requestedBreak');
  });

  it('cannot be held back like an ordinary reduction', () => {
    expect(TargetFlag.values).toContain('requestedBreak');
    expect(canHoldReduction([...history, firstOfBreak()])).toBe(false);
  });
});
