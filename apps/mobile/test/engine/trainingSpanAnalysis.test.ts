import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { IntakeDay } from '../../src/domain/IntakeDay';
import { Pause } from '../../src/domain/Pause';
import type { Workout } from '../../src/domain/training/Workout';
import { WaterEntry } from '../../src/domain/water/WaterEntry';
import { analyseTrainingSpan } from '../../src/engine/analysis/analyseTrainingSpan';
import type { CoachFinding } from '../../src/engine/analysis/CoachFinding';
import type { TrainingAnalysisInput } from '../../src/engine/analysis/TrainingAnalysisInput';
import { unjudgedTrainingAreas } from '../../src/engine/analysis/unjudgedTrainingAreas';
import { targetsFrom } from '../support/targetsFrom';
import { liftSession } from './support/liftSession';
import { trainingInput } from './support/trainingInput';

/** MM-609: what the coach reads in training, water and sleep, over a span ending yesterday. */
const asOf = CalendarDate.of(2026, 10, 23);
const ago = (days: number) => asOf.addDays(-days);
const squat = ['back-squat', 3, 5, 100] as const;

const of = (findings: readonly CoachFinding[], signal: string, kind?: CoachFinding['kind']) =>
  findings.filter((f) => f.signal === signal && (kind === undefined || f.kind === kind));

/** Three sessions a week for the 4 weeks before the last 14 days, then `recent` (days ago) in them. */
const droppedWorkouts = (recent: readonly number[]): Workout[] => [
  ...[14, 16, 18, 21, 23, 25, 28, 30, 32, 35, 37, 39].map((d) => liftSession(ago(d), [squat])),
  ...recent.map((d) => liftSession(ago(d), [squat])),
];

/** Four sessions a week for 4 weeks: chest 14 hard sets a week, back 6, quads 6, glutes 4, hamstrings 2. */
const neglectedWorkouts = (): Workout[] =>
  [0, 1, 2, 3].flatMap((week) => [
    liftSession(ago(7 * week + 0), [['barbell-bench-press', 7, 8, 80], ['barbell-row', 3, 8, 70]]),
    liftSession(ago(7 * week + 1), [['leg-extension', 3, 10, 50], ['barbell-hip-thrust', 2, 8, 100]]),
    liftSession(ago(7 * week + 3), [['barbell-bench-press', 7, 8, 80], ['barbell-row', 3, 8, 70]]),
    liftSession(ago(7 * week + 5), [['leg-extension', 3, 10, 50], ['barbell-hip-thrust', 2, 8, 100]]),
  ]);

/** Fat-loss targets from 44 days before `asOf`, bench press 100 kg × 6 at RIR 1 from a week before, 99 kg at the end. */
const deficitStart = ago(44);
const cutInput = (extra: Partial<Omit<TrainingAnalysisInput, 'setup'>> = {}) =>
  trainingInput(asOf, {
    goal: 'fatLoss',
    history: [
      targetsFrom(deficitStart.addDays(-60), { mode: 'maintenance', weeklyRateFraction: 0 }),
      targetsFrom(deficitStart, { mode: 'fatLoss', weeklyRateFraction: -0.0075 }),
    ],
    workouts: [-7, 0, 10, 20, 30, 43].map((d) => liftSession(deficitStart.addDays(d), [['barbell-bench-press', 1, 6, d === 43 ? 99 : 100, 1]])),
    ...extra,
  });

/** 14 days of water: 1.5 L on the 5 training days, 2.5 L on the rest, against a suggested 2.5 L goal. */
const trainingDaysAgo = [1, 4, 7, 10, 13];
const waterInput = (extra: Partial<Omit<TrainingAnalysisInput, 'setup'>> = {}) =>
  trainingInput(asOf, {
    workouts: trainingDaysAgo.map((d) => liftSession(ago(d), [squat])),
    water: Array.from({ length: 14 }, (_, d) =>
      new WaterEntry({ id: d + 1, date: ago(d), ml: trainingDaysAgo.includes(d) ? 1500 : 2500, at: new Date(2026, 9, 23 - d, 12) }),
    ),
    waterGoal: { ml: 2500, suggested: true, suggestedMl: 2500 },
    ...extra,
  });

describe('training dropped (T2)', () => {
  it('3 sessions a week for 4 weeks, then 2 in the last 14 days: 2 against about 3 a week', () => {
    const input = trainingInput(asOf, { goal: 'fatLoss', workouts: droppedWorkouts([3, 10]) });
    const [dropped] = of(analyseTrainingSpan(input, 30, asOf), 'trainingDropped', 'fix');
    expect(dropped?.figures).toMatchObject({ recentSessions: 2, recentDays: 14, usualPerWeek: 3 });
    expect(dropped?.priority).toBe('pattern');
    expect(dropped?.to).toBe(asOf);
  });

  it('sessions in line with the usual rate are holding up, and fewer than 2 a week usual says nothing', () => {
    const steady = trainingInput(asOf, { workouts: droppedWorkouts([1, 3, 5, 8, 10]) });
    expect(of(analyseTrainingSpan(steady, 14, asOf), 'trainingDropped').map((f) => f.kind)).toEqual(['holdingUp']);
    const rare = trainingInput(asOf, { workouts: [14, 21, 28, 35, 3].map((d) => liftSession(ago(d), [squat])) });
    expect(of(analyseTrainingSpan(rare, 30, asOf), 'trainingDropped')).toEqual([]);
  });

  it('is not judged in a span shorter than 14 days', () => {
    const input = trainingInput(asOf, { workouts: droppedWorkouts([3, 10]) });
    expect(of(analyseTrainingSpan(input, 7, asOf), 'trainingDropped')).toEqual([]);
  });
});

describe('a pause silences training (T1, T2)', () => {
  it('a pause covering the last 14 days: no T1 or T2', () => {
    const pauses = [new Pause({ from: ago(13), to: asOf, reason: 'travel' })];
    const input = trainingInput(asOf, { goal: 'fatLoss', workouts: droppedWorkouts([]), pauses });
    const findings = analyseTrainingSpan(input, 30, asOf);
    expect(of(findings, 'trainingStopped')).toEqual([]);
    expect(of(findings, 'trainingDropped')).toEqual([]);
  });

  it('without the pause, the lapse is said and suppresses T2 to T9', () => {
    const input = trainingInput(asOf, { goal: 'fatLoss', workouts: droppedWorkouts([]) });
    const findings = analyseTrainingSpan(input, 30, asOf);
    expect(of(findings, 'trainingStopped', 'fix')[0]?.figures).toMatchObject({ daysSince: 14, suspended: 0 });
    expect(findings.every((f) => f.signal === 'trainingStopped' || f.signal === 'proteinByTrainingDay' || f.signal === 'waterOnTrainingDays')).toBe(true);
  });

  it('on maintenance the lapse is silent, as MM-134 has it', () => {
    const input = trainingInput(asOf, { goal: 'maintenance', workouts: droppedWorkouts([]) });
    expect(of(analyseTrainingSpan(input, 30, asOf), 'trainingStopped', 'fix')).toEqual([]);
  });
});

describe('sets per muscle (T3)', () => {
  it('4 sessions a week, chest at 14 hard sets and hamstrings at 2, on maintenance: names hamstrings with both', () => {
    const input = trainingInput(asOf, { workouts: neglectedWorkouts() });
    const fixes = of(analyseTrainingSpan(input, 30, asOf), 'setsPerMuscle', 'fix');
    expect(fixes.map((f) => f.subjects)).toEqual([['hamstrings', 'chest']]);
    expect(fixes[0]?.figures['groupSets']).toBe(2);
    expect(fixes[0]?.figures['topSets']).toBe(14);
  });

  it('on fat loss only a group at 0 sets is named', () => {
    const input = trainingInput(asOf, { goal: 'fatLoss', workouts: neglectedWorkouts() });
    expect(of(analyseTrainingSpan(input, 30, asOf), 'setsPerMuscle', 'fix')).toEqual([]);
  });

  it('needs 4 weeks: a 2-week span does not judge it, and says training needs 4 weeks', () => {
    const input = trainingInput(asOf, { workouts: neglectedWorkouts() });
    expect(of(analyseTrainingSpan(input, 14, asOf), 'setsPerMuscle')).toEqual([]);
    expect(unjudgedTrainingAreas(input, 14, asOf)).toContainEqual({ area: 'training', needsDays: 28 });
  });
});

describe('strength on a cut (T7)', () => {
  it('6 weeks of deficit with bench press within 2.5% over 5 sessions: held, and no stall is mentioned', () => {
    const findings = analyseTrainingSpan(cutInput(), 90, asOf);
    const held = of(findings, 'strengthOnFatLoss', 'holdingUp');
    expect(held.map((f) => f.subjects)).toEqual([['Barbell bench press']]);
    expect(held[0]?.figures).toMatchObject({ lifts: 1, weeks: 6, sessions0: 5 });
    expect(of(findings, 'strengthStalled')).toEqual([]);
    expect(of(findings, 'strengthRising')).toEqual([]);
  });

  it('is not judged in a span shorter than 6 weeks, which names strength', () => {
    expect(of(analyseTrainingSpan(cutInput(), 30, asOf), 'strengthOnFatLoss')).toEqual([]);
    expect(unjudgedTrainingAreas(cutInput(), 30, asOf)).toEqual([{ area: 'strength', needsDays: 42 }]);
  });
});

describe('rest-day protein (X1)', () => {
  it('the minimum met on 6 of 6 training days and 2 of 8 rest days: the finding names rest days', () => {
    const training = [0, 2, 4, 6, 8, 10];
    const restMet = [1, 3];
    const input = trainingInput(asOf, {
      workouts: training.map((d) => liftSession(ago(d), [squat])),
      wholeDays: Array.from(
        { length: 14 },
        (_, d) => new IntakeDay({ date: ago(d), kcal: 2300, proteinG: training.includes(d) || restMet.includes(d) ? 140 : 100, carbsG: 220, fatG: 70 }),
      ),
    });
    const [x1] = of(analyseTrainingSpan(input, 14, asOf), 'proteinByTrainingDay', 'fix');
    expect(x1?.figures).toMatchObject({ trainingDays: 6, trainingMet: 6, restDays: 8, restMet: 2, minimumG: 130, lowerOnRestDays: 1 });
  });
});

describe('water on training days (X3)', () => {
  it('training days logged 1 L under the goal and under rest days: a fix', () => {
    const [x3] = of(analyseTrainingSpan(waterInput(), 14, asOf), 'waterOnTrainingDays', 'fix');
    expect(x3?.figures).toMatchObject({ loggedDays: 14, trainingDays: 5, underDays: 5, goalMl: 2500, restAverageMl: 2500 });
  });

  it('is said only with a goal the app suggested, and with water logged on 10 of 14 days', () => {
    const own = waterInput({ waterGoal: { ml: 2500, suggested: false, suggestedMl: undefined } });
    expect(of(analyseTrainingSpan(own, 14, asOf), 'waterOnTrainingDays')).toEqual([]);
    const few = waterInput();
    const sparse = { ...few, water: few.water.filter((e) => e.date.daysUntil(asOf) % 3 !== 0) };
    expect(of(analyseTrainingSpan(sparse, 14, asOf), 'waterOnTrainingDays')).toEqual([]);
  });
});

describe('an eating-disorder history', () => {
  const ed = { safeguards: { eatingDisorderHistory: true, underEating: false } };

  it('shows no T2, T3, T7-held or X3 finding', () => {
    const dropped = trainingInput(asOf, { goal: 'fatLoss', workouts: droppedWorkouts([3, 10]), ...ed });
    const neglected = trainingInput(asOf, { workouts: neglectedWorkouts(), ...ed });
    const findings = [
      ...analyseTrainingSpan(dropped, 30, asOf),
      ...analyseTrainingSpan(neglected, 30, asOf),
      ...analyseTrainingSpan(cutInput(ed), 90, asOf),
      ...analyseTrainingSpan(waterInput(ed), 14, asOf),
    ];
    expect(of(findings, 'trainingDropped')).toEqual([]);
    expect(of(findings, 'setsPerMuscle')).toEqual([]);
    expect(of(findings, 'strengthOnFatLoss', 'holdingUp')).toEqual([]);
    expect(of(findings, 'waterOnTrainingDays')).toEqual([]);
  });

  it('so does under-eating', () => {
    const input = waterInput({ safeguards: { eatingDisorderHistory: false, underEating: true } });
    expect(of(analyseTrainingSpan(input, 14, asOf), 'waterOnTrainingDays')).toEqual([]);
  });
});

describe('an empty imported session (MM-609 Decisions)', () => {
  const empty = (d: number) => liftSession(ago(d), [], { imported: { platformId: `p${d}`, sourceName: 'Watch' } });

  it('does not count as training for T1', () => {
    const input = trainingInput(asOf, { goal: 'fatLoss', workouts: [...droppedWorkouts([]), empty(2)] });
    expect(of(analyseTrainingSpan(input, 30, asOf), 'trainingStopped', 'fix')[0]?.figures['daysSince']).toBe(14);
  });

  it('does not count as training for T2', () => {
    const input = trainingInput(asOf, { workouts: [...droppedWorkouts([3, 10]), empty(1), empty(5), empty(8), empty(12)] });
    expect(of(analyseTrainingSpan(input, 30, asOf), 'trainingDropped', 'fix')[0]?.figures['recentSessions']).toBe(2);
  });

  it('nor do sets without reps (MM-613) or at 5 in reserve', () => {
    const input = trainingInput(asOf, {
      goal: 'fatLoss',
      workouts: [...droppedWorkouts([]), liftSession(ago(2), [['back-squat', 3, 0, 100]]), liftSession(ago(3), [['back-squat', 3, 5, 60, 5]])],
    });
    expect(of(analyseTrainingSpan(input, 30, asOf), 'trainingStopped', 'fix')[0]?.figures['daysSince']).toBe(14);
  });
});

describe('the other signals', () => {
  it('T9: 15 or more hard sets in 14 days with reps in reserve on under a quarter is data quality', () => {
    const input = trainingInput(asOf, {
      workouts: [1, 4, 7, 10].map((d) => liftSession(ago(d), [squat, ['barbell-bench-press', 1, 8, 80, d === 1 ? 2 : undefined]])),
    });
    const [t9] = of(analyseTrainingSpan(input, 14, asOf), 'rirUnrecorded');
    expect(t9?.kind).toBe('dataQuality');
    expect(t9?.figures).toMatchObject({ hardSets: 16, recordedSets: 1 });
  });

  it('T8: 2 usual weekdays, each trained in 3 or more of 4 weeks, are holding up', () => {
    const input = trainingInput(asOf, { workouts: [0, 3, 7, 10, 14, 17, 21].map((d) => liftSession(ago(d), [squat])) });
    const [t8] = of(analyseTrainingSpan(input, 30, asOf), 'trainingDays');
    expect(t8?.kind).toBe('holdingUp');
    expect(t8?.figures['weekdays']).toBe(2);
  });

  it('T5: on maintenance a lift up 5% or more over 6 weeks is holding up; on fat loss rising is not said', () => {
    const rising = [56, 49, 42, 35, 28, 21, 14, 7, 1].map((d, i) => liftSession(ago(d), [['barbell-bench-press', 1, 6, 90 + 2 * i, 1]]));
    expect(of(analyseTrainingSpan(trainingInput(asOf, { workouts: rising }), 90, asOf), 'strengthRising').map((f) => f.subjects)).toEqual([
      ['Barbell bench press'],
    ]);
    expect(of(analyseTrainingSpan(trainingInput(asOf, { goal: 'fatLoss', workouts: rising }), 90, asOf), 'strengthRising')).toEqual([]);
  });

  it('T6: two lifts stalled per MM-79 and level over 6 weeks, on maintenance', () => {
    const level = [56, 49, 42, 35, 28, 21, 14, 7, 1].map((d) =>
      liftSession(ago(d), [['barbell-bench-press', 3, 6, 80, 1], ['back-squat', 3, 6, 100, 1]]),
    );
    const [t6] = of(analyseTrainingSpan(trainingInput(asOf, { workouts: level }), 90, asOf), 'strengthStalled');
    expect(t6?.kind).toBe('fix');
    expect(t6?.subjects).toHaveLength(2);
    expect(of(analyseTrainingSpan(trainingInput(asOf, { goal: 'fatLoss', workouts: level }), 90, asOf), 'strengthStalled')).toEqual([]);
  });
});

describe('areas a span cannot judge', () => {
  it('7d with training logged for 1 week: training needs 4 weeks', () => {
    const input = trainingInput(asOf, { workouts: [1, 3, 5].map((d) => liftSession(ago(d), [squat])) });
    expect(unjudgedTrainingAreas(input, 7, asOf)).toEqual([
      { area: 'training', needsDays: 28 },
      { area: 'strength', needsDays: 42 },
    ]);
    expect(unjudgedTrainingAreas(input, 90, asOf)).toEqual([]);
  });

  it('names nothing for a log never used', () => {
    expect(unjudgedTrainingAreas(trainingInput(asOf), 7, asOf)).toEqual([]);
  });
});
