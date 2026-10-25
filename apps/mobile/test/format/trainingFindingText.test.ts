import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { CoachFinding } from '../../src/engine/analysis/CoachFinding';
import { coachFindingOf } from '../../src/engine/analysis/coachFindingOf';
import { trainingAdviceOf } from '../../src/engine/analysis/trainingAdviceOf';
import { Fmt } from '../../src/format/Fmt';
import { trainingFindingText } from '../../src/format/coach/trainingFindingText';
import { coachBannedWords } from '../support/coachBannedWords';

/** MM-609's words, in the coach's voice (MM-617): the number, then the orders the engine gives (`trainingAdviceOf`). */
const asOf = CalendarDate.of(2026, 10, 23);
const fmt = new Fmt('metric');

const finding = (signal: string, kind: CoachFinding['kind'], figures: Record<string, number>, subjects?: readonly string[]): CoachFinding => {
  const f = coachFindingOf({ signal, kind, span: 30, from: asOf.addDays(-29), to: asOf, priority: 'pattern', figures, subjects });
  return { ...f, advice: trainingAdviceOf(f, false) };
};

const words = (f: CoachFinding) => {
  const [title, body, evidence] = trainingFindingText(f, fmt);
  return [title, body, ...evidence.flat()].join(' ');
};

const every: readonly CoachFinding[] = [
  finding('trainingStopped', 'fix', { daysSince: 16, suspended: 0, leanGain: 0, suspendAfterDays: 21 }),
  finding('trainingStopped', 'fix', { daysSince: 25, suspended: 1, leanGain: 1, suspendAfterDays: 21 }),
  finding('trainingStopped', 'holdingUp', { weeks: 4, sessions: 13 }),
  finding('trainingDropped', 'fix', { recentSessions: 2, recentDays: 14, usualPerWeek: 3, usualWeeks: 4 }),
  finding('trainingDropped', 'holdingUp', { recentSessions: 6, recentDays: 14, usualPerWeek: 3, usualWeeks: 4 }),
  finding('setsPerMuscle', 'fix', { groupSets: 2, topSets: 14, weeks: 4, sessions: 16 }, ['hamstrings', 'chest']),
  finding('setsPerMuscle', 'holdingUp', { groups: 2, weeks: 4, rangeLow: 10, rangeHigh: 20 }, ['chest', 'back']),
  finding('strengthRising', 'holdingUp', { fromKg: 111, toKg: 128.3, days: 55, sessions: 9 }, ['Barbell bench press']),
  finding('strengthStalled', 'fix', { lifts: 2, days: 55, tolerance: 0.025, from0Kg: 98.7, to0Kg: 98.7, from1Kg: 123.3, to1Kg: 123.3 }, [
    'Barbell bench press',
    'Back squat',
  ]),
  finding(
    'strengthOnFatLoss',
    'fix',
    { lifts: 2, windowDays: 21, from0Kg: 100, to0Kg: 94, sessions0: 4, from1Kg: 130, to1Kg: 122, sessions1: 3, slowerPace: 0.005, sleepAverageMinutes: 340, sleepNights: 9, proteinWholeDays: 12, proteinMetDays: 4 },
    ['Barbell bench press', 'Deleted exercise'],
  ),
  finding('strengthOnFatLoss', 'holdingUp', { lifts: 1, weeks: 6, from0Kg: 123.3, to0Kg: 122.9, sessions0: 5 }, ['Barbell bench press']),
  finding('trainingDays', 'holdingUp', { weekdays: 2, weeks: 4, weekday0: 1, weeksOn0: 4, weekday1: 4, weeksOn1: 3 }),
  finding('rirUnrecorded', 'dataQuality', { hardSets: 30, recordedSets: 2, days: 14 }),
  finding('proteinByTrainingDay', 'fix', { trainingDays: 6, trainingMet: 6, restDays: 8, restMet: 2, minimumG: 130, lowerOnRestDays: 1 }),
  finding('proteinByTrainingDay', 'fix', { trainingDays: 6, trainingMet: 1, restDays: 8, restMet: 7, minimumG: 130, lowerOnRestDays: 0 }),
  finding('waterOnTrainingDays', 'fix', { loggedDays: 14, days: 14, trainingDays: 5, underDays: 5, goalMl: 2500, trainingAverageMl: 1500, restAverageMl: 2500 }),
  finding('waterOnTrainingDays', 'holdingUp', { loggedDays: 12, days: 14, trainingDays: 5, atGoalDays: 4, goalMl: 2500, trainingAverageMl: 2600 }),
];

describe('training, water and sleep words', () => {
  it('training dropped: 2 sessions in 14 days against about 3 a week, and one heavy session a week holds strength', () => {
    const [title, body] = trainingFindingText(every[3] as CoachFinding, fmt);
    expect(title).toBe('2 sessions in 14 days');
    expect(body).toMatch(/^2 sessions in 14 days(\. You usually do about 3 a week|, against about 3 a week before)\./);
    expect(body).toMatch(/hold(s)? strength for most younger adults/);
    expect(body).toMatch(/(Get three sessions in this week|Train three times this week|Three sessions this week\. Book them)\.$/);
  });

  it('strength held on a cut names the lift as held, and no stall', () => {
    const text = words(every[10] as CoachFinding);
    expect(text).toMatch(/Barbell bench press held over 6 weeks/);
    expect(text).not.toMatch(/stall/i);
  });

  it('rest-day protein names rest days and never says more on training days', () => {
    for (const f of [every[13], every[14]] as CoachFinding[]) {
      const text = words(f);
      expect(text).toContain('the same every day');
      expect(text).not.toMatch(/more (protein )?on training days|eat more/i);
    }
    expect(trainingFindingText(every[13] as CoachFinding, fmt)[0]).toBe('Protein minimum: 2 of 8 rest days');
  });

  it('water is a log, not hydration: "logged", never "dehydrated" or a loss of performance', () => {
    for (const f of every.filter((x) => x.signal === 'waterOnTrainingDays')) {
      const text = words(f);
      expect(text).toContain('logged');
      expect(text).not.toMatch(/hydrat|perform|weaker|strength/i);
    }
  });

  it('sleep and protein are stated beside falling lifts, never as their cause', () => {
    const text = words(every[9] as CoachFinding);
    expect(text).toContain('Deleted exercise');
    expect(text).toContain('5 h 40 m');
    expect(text).toContain('0.5% of body weight a week');
    expect(text).toMatch(/(Keep the loads\. Cut sets before weight|Hold the weight on the bar\. Drop sets before load)\.$/);
  });

  it('every fix ends in its orders: two sessions, the sets to ten, one more set, the pace, sleep and protein', () => {
    for (const f of every.filter((x) => x.kind === 'fix')) {
      expect(f.advice?.length ?? 0, f.signal).toBeGreaterThan(0);
      expect(trainingFindingText(f, fmt)[1], f.signal).toMatch(/\.$/);
    }
    expect(trainingFindingText(every[5] as CoachFinding, fmt)[1]).toMatch(/8 hard sets( more)? a week for hamstrings\.$/);
    expect(trainingFindingText(every[8] as CoachFinding, fmt)[1]).toMatch(/one more set.* on Barbell bench press and Back squat\.$/i);
  });

  it("every finding has words: a title of 8 words or fewer, and the coach's list (MM-617)", () => {
    for (const f of every) {
      const [title] = trainingFindingText(f, fmt);
      expect(title.split(' ').length, title).toBeLessThanOrEqual(8);
      expect(coachBannedWords.filter(([, pattern]) => pattern.test(words(f))).map(([name]) => name), f.signal).toEqual([]);
    }
  });

  it('a finding with no words is a programming error', () => {
    expect(() => trainingFindingText(finding('trainingDays', 'fix', {}), fmt)).toThrow();
  });
});
