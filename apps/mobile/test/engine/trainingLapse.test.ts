import { describe, expect, it } from 'vitest';
import { CalendarDate, type GoalMode, Pause, Profile, ScreeningAnswers, type TrainingStatus, UserSetup } from '../../src/domain';
import { assessTrainingLapse, trainingSuspended, TrainingRule } from '../../src/engine';
import { Workout } from '../../src/domain/training/Workout';
import { workoutOn } from '../support/workoutOn';

/** MM-134: a goal that needs training says so, and notices when training stops. */
const today = CalendarDate.of(2026, 10, 5);

const setupFor = ({
  goal = 'leanGain',
  trainingDays = 3,
  status = 'intermediate',
}: { goal?: GoalMode; trainingDays?: number; status?: TrainingStatus } = {}) =>
  new UserSetup({
    profile: new Profile({ sex: 'male', birthDate: CalendarDate.of(1990, 1, 1), heightCm: 178 }),
    screening: new ScreeningAnswers(),
    trainingStatus: status,
    trainingDaysPerWeek: trainingDays,
    goalMode: goal,
    onboardedOn: today.addDays(-90),
  });

const lifted = (daysAgo: number) => workoutOn(today.addDays(-daysAgo), [['back-squat', 5, 100]]);
const regular = [60, 56, 53, 49, 46, 42, 39, 35, 32, 28, 25].map(lifted);

describe('training against a goal that needs it', () => {
  it('regular training, then none for 21 days: on a gain the surplus is suspended', () => {
    const lapse = assessTrainingLapse({ setup: setupFor(), workouts: regular, today });
    expect(lapse.kind).toBe('suspend');
    expect(lapse.daysSince).toBe(25);
    expect(trainingSuspended({ setup: setupFor(), workouts: regular, today })).toBe(true);
  });

  it('between two and three weeks it is a notice, and under two weeks nothing', () => {
    expect(assessTrainingLapse({ setup: setupFor(), workouts: [...regular, lifted(16)], today }).kind).toBe('notice');
    expect(assessTrainingLapse({ setup: setupFor(), workouts: [...regular, lifted(10)], today }).kind).toBe('none');
    expect(TrainingRule.noticeAfterDays).toBe(14);
    expect(TrainingRule.suspendAfterDays).toBe(21);
  });

  it('on a cut a lapse is a notice only, never a suspension', () => {
    const lapse = assessTrainingLapse({ setup: setupFor({ goal: 'fatLoss' }), workouts: regular, today });
    expect(lapse.kind).toBe('notice');
    expect(trainingSuspended({ setup: setupFor({ goal: 'fatLoss' }), workouts: regular, today })).toBe(false);
  });

  it('training resumes: one workout logged lifts the suspension', () => {
    const resumed = [...regular, lifted(1)];
    expect(assessTrainingLapse({ setup: setupFor(), workouts: resumed, today }).kind).toBe('none');
    expect(trainingSuspended({ setup: setupFor(), workouts: resumed, today })).toBe(false);
  });

  it('without the training log in use, only the training-days setting speaks: zero suspends a gain at once', () => {
    expect(assessTrainingLapse({ setup: setupFor(), workouts: [], today }).kind).toBe('none');
    const none = assessTrainingLapse({ setup: setupFor({ trainingDays: 0 }), workouts: [], today });
    expect(none.kind).toBe('suspend');
    expect(none.noTrainingDays).toBe(true);
    expect(trainingSuspended({ setup: setupFor({ trainingDays: 0 }), workouts: [], today })).toBe(true);
  });

  it('a pause is legitimate: no notice, and the surplus suspended without comment', () => {
    const pauses = [new Pause({ from: today.addDays(-3), to: today.addDays(4), reason: 'injury' })];
    const lapse = assessTrainingLapse({ setup: setupFor(), workouts: regular, pauses, today });
    expect(lapse.kind).toBe('none');
    expect(trainingSuspended({ setup: setupFor(), workouts: regular, pauses, today })).toBe(true);
  });

  it('a workout still in progress is not a day trained, and maintenance needs no training', () => {
    const open = { ...lifted(2), endedAt: undefined, inProgress: true } as unknown as (typeof regular)[number];
    expect(assessTrainingLapse({ setup: setupFor(), workouts: [...regular, open], today }).kind).toBe('suspend');
    expect(assessTrainingLapse({ setup: setupFor({ goal: 'maintenance' }), workouts: regular, today }).kind).toBe('none');
  });

  it('an imported session with no sets, or no hard set, is not training (MM-609)', () => {
    // Before MM-609 the empty import 2 days ago counted, and the lapse read 2 days.
    const empty = new Workout({
      id: 99,
      date: today.addDays(-2),
      startedAt: new Date(2026, 9, 3, 7),
      endedAt: new Date(2026, 9, 3, 8),
      imported: { platformId: 'run-1', sourceName: 'Watch' },
    });
    const noReps = workoutOn(today.addDays(-1), [['back-squat', 0, 100]]);
    const workouts = [...regular, empty, noReps];
    expect(assessTrainingLapse({ setup: setupFor(), workouts, today })).toMatchObject({ kind: 'suspend', daysSince: 25 });
    expect(assessTrainingLapse({ setup: setupFor({ goal: 'fatLoss' }), workouts, today }).kind).toBe('notice');
    expect(trainingSuspended({ setup: setupFor(), workouts, today })).toBe(true);
  });
});
