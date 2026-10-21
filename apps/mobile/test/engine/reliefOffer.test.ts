import { describe, expect, it } from 'vitest';
import {
  CalendarDate,
  Exercise,
  type ExerciseLoad,
  type GoalMode,
  IntakeDay,
  Pause,
  Profile,
  RecoveryCheckIn,
  ScreeningAnswers,
  UserSetup,
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from '../../src/domain';
import {
  analyze,
  breakInForce,
  buildStrengthTrends,
  canHoldReduction,
  type CoachSnapshot,
  consecutiveDeficitWeeks,
  DailyTargets,
  fallingLifts,
  findReliefOffer,
  nextCheckIn,
  nextTargets,
  type SleepAverage,
  slowerPace,
  type StrengthPoint,
  StrengthTrend,
  TargetFlag,
  TargetsRecord,
} from '../../src/engine';
import { expectClose } from '../support/expectClose';
import { squat } from './support/squat';
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
  sleepAverage,
}: { user?: UserSetup; checkIns?: RecoveryCheckIn[]; history?: TargetsRecord[]; pauses?: Pause[]; sleepAverage?: SleepAverage } = {}) =>
  findReliefOffer({
    setup: user ?? setup(),
    checkIns: checkIns ?? [hard(8), hard(1)],
    history: history ?? [record(21)],
    today,
    pauses,
    sleepAverage,
  });

/** The fourteen-night average from the record (MM-250). */
const slept = (averageMinutes: number, nights = 14): SleepAverage => ({ averageMinutes, nights, from: today.addDays(-13), to: today });

it('two hard check-ins running on a deficit make the offer, for the recovery signals', () => {
  expect(offer()?.reason).toBe('recoverySignals');
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
  expect(found?.suggestion).toBe('break');
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

  it('eight weeks in, the break', () => {
    const found = offer({ history: [record(63)] });
    expect(found?.deficitWeeks).toBe(9);
    expect(found?.suggestion).toBe('break');
    expect(found?.slowerPace, 'still offered').toBe(0.005);
  });

  it('already at the gentlest pace, the break', () => {
    const found = offer({ user: setup({ pace: 0.005 }) });
    expect(found).toBeDefined();
    expect(found?.slowerPace).toBeUndefined();
    expect(found?.suggestion).toBe('break');
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

/** MM-135: the second trigger, twelve unbroken weeks of deficit, with the recovery signals fine. */
describe('the offer at twelve weeks', () => {
  const calm = [fine(8), fine(1)];

  it('is made at twelve whole weeks of unbroken deficit, and not before', () => {
    expect(offer({ checkIns: calm, history: [record(83)] }), 'eleven weeks and six days').toBeUndefined();
    const found = offer({ checkIns: calm, history: [record(84)] });
    expect(found?.reason).toBe('longDeficit');
    expect(found?.deficitWeeks).toBe(12);
    expect(found?.suggestion).toBe('break');
    expect(found?.slowerPace, 'a rest, not a pace').toBeUndefined();
    expect(found?.shortSleep).toBe(false);
  });

  it('needs no check-ins at all', () => {
    expect(offer({ checkIns: [], history: [record(84)] })?.reason).toBe('longDeficit');
  });

  it('gives way to the recovery signals when both hold', () => {
    const found = offer({ history: [record(84)] });
    expect(found?.reason).toBe('recoverySignals');
    expect(found?.slowerPace).toBe(0.005);
  });

  it('is quiet for three weeks after an answer, like the other', () => {
    expect(offer({ checkIns: calm, history: [record(84)], user: setup({ answeredOn: today.addDays(-20) }) })).toBeUndefined();
    expect(offer({ checkIns: calm, history: [record(84)], user: setup({ answeredOn: today.addDays(-21) }) })).toBeDefined();
  });

  it('counts from the restart a gap or a pause set', () => {
    expect(
      findReliefOffer({ setup: setup(), checkIns: calm, history: [record(84)], today, deficitRestartOn: today.addDays(-70) }),
    ).toBeUndefined();
  });

  it('is not made at maintenance, on another goal, or during a pause', () => {
    expect(offer({ checkIns: calm, history: [record(84), record(2, 0)] })).toBeUndefined();
    expect(offer({ checkIns: calm, history: [record(84)], user: setup({ goal: 'maintenance' }) })).toBeUndefined();
    expect(
      offer({
        checkIns: calm,
        history: [record(84)],
        pauses: [new Pause({ from: today.addDays(-1), to: today.addDays(3), reason: 'travel' })],
      }),
    ).toBeUndefined();
  });
});

describe('the break the user takes', () => {
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

  it('is issued once, and holds for its two weeks', () => {
    const first = firstOfBreak();
    expect(nextCheckIn(taken(), first)).toBe(today.addDays(14));
    for (let day = 0; day < 14; day++) {
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

  it('ends the unbroken deficit, and the deficit resumes after it at once, not 100 kcal a week', () => {
    const first = firstOfBreak();
    const after = today.addDays(14);
    expect(consecutiveDeficitWeeks([...history, first], after)).toBe(0);
    const resumed = nextTargets({
      setup: taken(),
      snapshot: snapshotOn(after),
      history: [...history, first],
      today: after,
    }) as TargetsRecord;
    expect(resumed.targets.weeklyRateFraction).toBeLessThan(0);
    expect(resumed.targets.flags).not.toContain('requestedBreak');
    expect(resumed.targets.flags).not.toContain('rateLimited');
    expect(first.targets.kcal - resumed.targets.kcal).toBeGreaterThan(100);
    expect(resumed.explanation?.lines.map((l) => l.reason)).toContain('breakEnded');
    expect(consecutiveDeficitWeeks([...history, first, resumed], after.addDays(21))).toBe(3);
  });

  it('targets reissued inside the break stay on it', () => {
    const first = firstOfBreak();
    const inside = today.addDays(3);
    // A corrected profile issues targets at once; they carry the break on.
    const corrected = taken().copyWith({ profileRevision: 1 });
    const reissued = nextTargets({
      setup: corrected,
      snapshot: snapshotOn(inside),
      history: [...history, first],
      today: inside,
    }) as TargetsRecord;
    expect(reissued.targets.flags).toContain('requestedBreak');
    expect(reissued.targets.weeklyRateFraction).toBe(0);
    // The break is counted from its first day, so the reissue does not stretch it.
    expect(breakInForce([...history, first, reissued], today.addDays(13))?.startedOn).toBe(today);
    expect(breakInForce([...history, first, reissued], today.addDays(14))).toBeUndefined();
  });

  it('cannot be held back like an ordinary reduction', () => {
    expect(TargetFlag.values).toContain('requestedBreak');
    expect(canHoldReduction([...history, firstOfBreak()])).toBe(false);
  });
});

// MM-252: short sleep from the record is a signal of its own, beside the check-ins.
describe('short sleep as a signal of its own', () => {
  it('an average under six hours over fourteen nights makes the offer with hunger and energy fine', () => {
    const o = offer({ checkIns: [fine(8), fine(1)], sleepAverage: slept(330) });
    expect(o?.signals).toEqual(['shortSleep']);
    expect(o?.shortSleep).toBe(true);
    expect(o?.sleepAverage?.averageMinutes).toBe(330);
    expect(o?.suggestion).toBe('slowerPace');
    expect(o?.slowerPace).toBe(0.005);
  });

  it('both signals are named when the check-ins were hard too', () => {
    const o = offer({ sleepAverage: slept(330) });
    expect(o?.signals).toEqual(['hardCheckIns', 'shortSleep']);
  });

  it('six hours or more, or too few nights, is no signal; the hours typed at hard check-ins are then only a line', () => {
    expect(offer({ checkIns: [fine(8), fine(1)], sleepAverage: slept(360) })).toBeUndefined();
    expect(offer({ checkIns: [fine(8), fine(1)], sleepAverage: slept(300, 6) })).toBeUndefined();
    const typedOnly = offer({ checkIns: [hard(8, 5), hard(1, 5.5)] });
    expect(typedOnly?.signals).toEqual(['hardCheckIns']);
    expect(typedOnly?.shortSleep).toBe(true);
    expect(typedOnly?.sleepAverage).toBeUndefined();
    // With a record of enough nights that are not short, the typed hours do not say otherwise.
    expect(offer({ checkIns: [hard(8, 5), hard(1, 5.5)], sleepAverage: slept(430) })?.shortSleep).toBe(false);
  });

  it('is still only ever an offer: a pause, a quiet period, or no deficit keeps it away', () => {
    expect(offer({ checkIns: [], sleepAverage: slept(330), user: setup({ answeredOn: today.addDays(-5) }) })).toBeUndefined();
    expect(offer({ checkIns: [], sleepAverage: slept(330), history: [record(21, 0)] })).toBeUndefined();
    expect(offer({ checkIns: [], sleepAverage: slept(330), user: setup({ goal: 'maintenance' }) })).toBeUndefined();
  });
});

// MM-117: the strength trigger, from the training log's smoothed trends (MM-77).
describe('falling lifts', () => {
  /**
   * A lift whose smoothed max sits at `fromKg` four and three weeks ago and
   * falls evenly to `toKg` over `sessions` sessions in the last three weeks.
   */
  const lift = (
    name: string,
    toKg: number,
    { fromKg = 100, sessions = 3, load = 'addedWeight', start = true }: { fromKg?: number; sessions?: number; load?: ExerciseLoad; start?: boolean } = {},
  ): StrengthTrend => {
    const days = [-28, -21].filter(() => start);
    const recent = [-18, -14, -11, -7, -4, -1].slice(6 - sessions);
    const points: StrengthPoint[] = [
      ...days.map((d, i) => ({ workoutId: i + 1, date: today.addDays(d), estimateKg: fromKg, trendKg: fromKg })),
      ...recent.map((d, i) => {
        const kg = fromKg + ((toKg - fromKg) * (i + 1)) / recent.length;
        return { workoutId: 10 + i, date: today.addDays(d), estimateKg: kg, trendKg: kg };
      }),
    ];
    return new StrengthTrend({
      exercise: new Exercise({ id: name, name, equipment: squat.equipment, primary: squat.primary, load }),
      exerciseId: name,
      points,
      loggedSessions: points.length,
      recentSessions: points.length,
    });
  };

  const calm = [fine(8), fine(1)];
  const falling = [lift('Back squat', 94), lift('Barbell row', 94)];
  const withLifts = (strengthTrends: StrengthTrend[], extra: { user?: UserSetup; checkIns?: RecoveryCheckIn[]; history?: TargetsRecord[] } = {}) =>
    findReliefOffer({
      setup: extra.user ?? setup(),
      checkIns: extra.checkIns ?? calm,
      history: extra.history ?? [record(63)],
      today,
      strengthTrends,
    });

  it('on fat loss for nine weeks, squat and row each down 6% over three sessions make the offer and say the break', () => {
    const found = withLifts(falling);
    expect(found?.reason).toBe('recoverySignals');
    expect(found?.signals).toEqual(['strengthFalling']);
    expect(found?.deficitWeeks).toBe(9);
    expect(found?.suggestion).toBe('break');
    expect(found?.slowerPace, 'the slower pace is still offered').toBe(0.005);
    expect(found?.fallingLifts.map((l) => l.name)).toEqual(['Back squat', 'Barbell row']);
    expect(found?.fallingLifts[0]?.sessions).toBe(3);
  });

  it('early in the deficit, the slower pace', () => {
    expect(withLifts(falling, { history: [record(21)] })?.suggestion).toBe('slowerPace');
  });

  it('one lift falling is not enough', () => {
    expect(withLifts([lift('Back squat', 90), lift('Barbell row', 99)])).toBeUndefined();
    expect(fallingLifts([lift('Back squat', 90), lift('Barbell row', 99)], today).map((l) => l.name)).toEqual(['Back squat']);
  });

  it('one lift down 8% in a single session is not a fall: the trend is smoothed', () => {
    const session = (daysAgo: number, loadKg: number, id: number) => {
      const startedAt = new Date(today.year, today.month - 1, today.day - daysAgo, 18);
      return new Workout({
        id,
        date: today.addDays(-daysAgo),
        startedAt,
        endedAt: new Date(startedAt.getTime() + 50 * 60 * 1000),
        exercises: [new WorkoutExercise({ exerciseId: squat.id, sets: [new WorkoutSet({ reps: 5, loadKg })] })],
      });
    };
    const workouts = [session(28, 100, 1), session(21, 100, 2), session(14, 100, 3), session(7, 100, 4), session(1, 92, 5)];
    const trends = buildStrengthTrends({ workouts, exercises: [squat], weights: [], today });
    expect(fallingLifts(trends, today)).toEqual([]);
    expect(withLifts([...trends, lift('Barbell row', 94)])).toBeUndefined();
  });

  it('less than 5% down is held', () => {
    expect(withLifts([lift('Back squat', 96), lift('Barbell row', 96)])).toBeUndefined();
    expect(withLifts([lift('Back squat', 95), lift('Barbell row', 95)])?.signals).toEqual(['strengthFalling']);
  });

  it('a lift trained fewer than three times in the three weeks, or with no session where they start, is not judged', () => {
    expect(withLifts([lift('Back squat', 90, { sessions: 2 }), lift('Barbell row', 90)])).toBeUndefined();
    expect(withLifts([lift('Back squat', 90, { start: false }), lift('Barbell row', 90)])).toBeUndefined();
  });

  it('bodyweight lifts are left out: their estimate carries the weight a cut takes off', () => {
    expect(withLifts([lift('Pull-up', 90, { load: 'bodyweight' }), lift('Barbell row', 90)])).toBeUndefined();
  });

  it('is not made on lean gain or at maintenance', () => {
    expect(withLifts(falling, { user: setup({ goal: 'leanGain' }) })).toBeUndefined();
    expect(withLifts(falling, { history: [record(63), record(2, 0)] })).toBeUndefined();
  });

  it('named beside the hard check-ins when both hold', () => {
    expect(withLifts(falling, { checkIns: [hard(8), hard(1)] })?.signals).toEqual(['hardCheckIns', 'strengthFalling']);
  });

  describe('the three weeks of quiet after an answer', () => {
    const answered = setup({ answeredOn: today.addDays(-5) });

    it('hold for falling lifts alone, and for hard check-ins alone', () => {
      expect(withLifts(falling, { user: answered })).toBeUndefined();
      expect(withLifts([], { user: answered, checkIns: [hard(8), hard(1)] })).toBeUndefined();
    });

    it('give way when both hold at once, on a hard check-in since the answer', () => {
      const found = withLifts(falling, { user: answered, checkIns: [hard(8), hard(1)] });
      expect(found?.signals).toEqual(['hardCheckIns', 'strengthFalling']);
    });

    it('do not give way on the same hard check-ins the answer was made after', () => {
      expect(withLifts(falling, { user: setup({ answeredOn: today.addDays(-1) }), checkIns: [hard(8), hard(1)] })).toBeUndefined();
    });
  });
});
