import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Pause } from '../../src/domain/Pause';
import { CardioSession } from '../../src/domain/training/CardioSession';
import type { StepsDay } from '../../src/domain/training/StepsDay';
import { analyseTrainingSpan } from '../../src/engine/analysis/analyseTrainingSpan';
import type { CoachFinding } from '../../src/engine/analysis/CoachFinding';
import { unjudgedTrainingAreas } from '../../src/engine/analysis/unjudgedTrainingAreas';
import { trainingInput } from './support/trainingInput';

/** MM-678: the wearable's cardio minutes (C1) and steps a day (C2) against their floors, on fat loss and recomp. */
const asOf = CalendarDate.of(2026, 10, 23);
const minuteMs = 60 * 1000;

const session = (daysAgo: number, minutes: number, activity: CardioSession['activity'] = 'walking') => {
  const date = asOf.addDays(-daysAgo);
  const start = new Date(date.year, date.month - 1, date.day, 7, 5);
  return new CardioSession({ platformId: `${activity}-${daysAgo}`, sourceName: 'Watch', activity, start, end: new Date(start.getTime() + minutes * minuteMs) });
};
/** `count` steps on each of the last `days` days through `asOf`. */
const stepsEveryDay = (count: number, days: number): StepsDay[] => Array.from({ length: days }, (_, i) => ({ date: asOf.addDays(-i), steps: count }));
const of = (findings: readonly CoachFinding[], signal: string) => findings.filter((f) => f.signal === signal);

describe('C1, cardio minutes', () => {
  it('96 minutes this week against the 150 floor: a fix ordering 54 more on the watch', () => {
    const input = trainingInput(asOf, { goal: 'fatLoss', cardio: [session(1, 30), session(3, 36), session(6, 30), session(9, 60)] });
    const [fix] = of(analyseTrainingSpan(input, 7, asOf), 'cardioMinutes');
    expect(fix?.kind).toBe('fix');
    expect(fix?.priority).toBe('coaching');
    expect(fix?.figures).toMatchObject({ minutes: 96, floor: 150, more: 54, sessions: 3 });
    expect(fix?.from).toBe(asOf.addDays(-6));
    expect(fix?.to).toBe(asOf);
    expect(fix?.advice).toEqual([{ kind: 'cardio', minutes: 54 }]);
  });

  it("the person's own floor is the one judged against", () => {
    const input = trainingInput(asOf, { goal: 'recomp', cardio: [session(1, 96)], cardioFloors: { stepsPerDay: undefined, minutesPerWeek: 90 } });
    expect(of(analyseTrainingSpan(input, 7, asOf), 'cardioMinutes')).toEqual([]);
  });

  it('at or over the floor in each of the last four weeks is holding up, in a span that long', () => {
    const cardio = [0, 1, 2, 3].flatMap((week) => [session(7 * week + 1, 80), session(7 * week + 4, 80)]);
    const input = trainingInput(asOf, { goal: 'fatLoss', cardio });
    const [held] = of(analyseTrainingSpan(input, 30, asOf), 'cardioMinutes');
    expect(held?.kind).toBe('holdingUp');
    expect(held?.priority).toBe('pattern');
    expect(held?.figures).toMatchObject({ weeks: 4, minutes: 160, floor: 150 });
    // A 7-day span cannot say so, and names training as needing 28 days.
    expect(of(analyseTrainingSpan(input, 7, asOf), 'cardioMinutes')).toEqual([]);
    expect(unjudgedTrainingAreas(input, 7, asOf)).toEqual([{ area: 'training', needsDays: 28 }]);
    // One week under the floor in the four, and nothing is said.
    const short = trainingInput(asOf, { goal: 'fatLoss', cardio: cardio.filter((s) => s.platformId !== 'walking-15') });
    expect(of(analyseTrainingSpan(short, 30, asOf), 'cardioMinutes')).toEqual([]);
  });

  it('silent until the wearable is in use, on maintenance and lean gain, in a pause, with a floor of none, and the fix under restricted', () => {
    expect(of(analyseTrainingSpan(trainingInput(asOf, { goal: 'fatLoss' }), 7, asOf), 'cardioMinutes')).toEqual([]);
    const under = { cardio: [session(1, 20)] };
    expect(of(analyseTrainingSpan(trainingInput(asOf, { goal: 'maintenance', ...under }), 7, asOf), 'cardioMinutes')).toEqual([]);
    expect(of(analyseTrainingSpan(trainingInput(asOf, { goal: 'leanGain', ...under }), 7, asOf), 'cardioMinutes')).toEqual([]);
    const paused = trainingInput(asOf, { goal: 'fatLoss', ...under, pauses: [new Pause({ from: asOf.addDays(-3), to: asOf.addDays(4), reason: 'travel' })] });
    expect(of(analyseTrainingSpan(paused, 7, asOf), 'cardioMinutes')).toEqual([]);
    const off = trainingInput(asOf, { goal: 'fatLoss', ...under, cardioFloors: { stepsPerDay: undefined, minutesPerWeek: 0 } });
    expect(of(analyseTrainingSpan(off, 7, asOf), 'cardioMinutes')).toEqual([]);
    const restricted = trainingInput(asOf, { goal: 'fatLoss', ...under, safeguards: { eatingDisorderHistory: true, underEating: false } });
    expect(of(analyseTrainingSpan(restricted, 7, asOf), 'cardioMinutes')).toEqual([]);
  });

  it('a wearable that gives steps but no session still puts cardio in use: the week with none is a fix', () => {
    const input = trainingInput(asOf, { goal: 'fatLoss', steps: stepsEveryDay(9000, 7) });
    const [fix] = of(analyseTrainingSpan(input, 7, asOf), 'cardioMinutes');
    expect(fix?.figures).toMatchObject({ minutes: 0, more: 150, sessions: 0 });
  });
});

describe('C2, steps a day', () => {
  it('about 6,100 a day against the 8,000 floor: a fix ordering 1,900 more a day', () => {
    const input = trainingInput(asOf, { goal: 'fatLoss', steps: stepsEveryDay(6100, 7) });
    const [fix] = of(analyseTrainingSpan(input, 7, asOf), 'stepsPerDay');
    expect(fix?.kind).toBe('fix');
    expect(fix?.figures).toMatchObject({ steps: 6100, floor: 8000, short: 1900, days: 7 });
    expect(fix?.advice).toEqual([{ kind: 'steps', steps: 8000, stepsShort: 1900 }]);
  });

  it('the average is over the days with a total, and fewer than five of them says nothing', () => {
    const uneven = [{ date: asOf, steps: 12000 }, ...stepsEveryDay(5000, 5).slice(1)];
    const [fix] = of(analyseTrainingSpan(trainingInput(asOf, { goal: 'fatLoss', steps: uneven }), 7, asOf), 'stepsPerDay');
    expect(fix?.figures).toMatchObject({ steps: 6400, days: 5 });
    const few = trainingInput(asOf, { goal: 'fatLoss', steps: stepsEveryDay(3000, 4) });
    expect(of(analyseTrainingSpan(few, 7, asOf), 'stepsPerDay')).toEqual([]);
  });

  it("the person's own floor is the one judged against", () => {
    const input = trainingInput(asOf, { goal: 'fatLoss', steps: stepsEveryDay(9000, 7), cardioFloors: { stepsPerDay: 10000, minutesPerWeek: undefined } });
    expect(of(analyseTrainingSpan(input, 7, asOf), 'stepsPerDay')[0]?.figures).toMatchObject({ steps: 9000, floor: 10000, short: 1000 });
  });

  it('over the floor in each of the last four weeks is holding up, in a span that long', () => {
    const input = trainingInput(asOf, { goal: 'recomp', steps: stepsEveryDay(8400, 28) });
    const [held] = of(analyseTrainingSpan(input, 30, asOf), 'stepsPerDay');
    expect(held?.kind).toBe('holdingUp');
    expect(held?.figures).toMatchObject({ weeks: 4, steps: 8400, floor: 8000 });
    expect(of(analyseTrainingSpan(input, 14, asOf), 'stepsPerDay')).toEqual([]);
    // A week with too few days of steps breaks the run.
    const gappy = trainingInput(asOf, { goal: 'recomp', steps: stepsEveryDay(8400, 28).filter((d) => d.date.daysUntil(asOf) < 14 || d.date.daysUntil(asOf) > 17) });
    expect(of(analyseTrainingSpan(gappy, 30, asOf), 'stepsPerDay')).toEqual([]);
  });

  it('silent on maintenance, and the fix not said under restricted', () => {
    expect(of(analyseTrainingSpan(trainingInput(asOf, { goal: 'maintenance', steps: stepsEveryDay(3000, 7) }), 7, asOf), 'stepsPerDay')).toEqual([]);
    const restricted = trainingInput(asOf, { goal: 'fatLoss', steps: stepsEveryDay(3000, 7), safeguards: { eatingDisorderHistory: false, underEating: true } });
    expect(of(analyseTrainingSpan(restricted, 7, asOf), 'stepsPerDay')).toEqual([]);
  });
});
