import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain';
import {
  evaluateSignal,
  nextTrendTransition,
  type TrendAnnouncement,
  type TrendEvaluation,
  type TrendReading,
} from '../../src/engine';
import { randomGapLogger } from './support/randomGapLogger';
import { stationaryTrendUser } from './support/stationaryTrendUser';
import { trendSignal } from './support/trendSignal';

/**
 * MM-605's false-alarm budget, by simulation: people whose eating does not
 * change, evaluated every day as the app would, through the state machine.
 * Every "new" announcement they see is false.
 */
const start = CalendarDate.of(2026, 1, 5);
const days = 180;

describe('the null simulation', () => {
  it(
    'No false trends from noise: 200 stationary users over 180 days see at most one new trend per 30 days',
    () => {
      // Intake in kcal: δ 200, σ at least 50, every aspect and detector the intake signals use.
      const signal = trendSignal({ delta: 200, sigmaFloor: 50, roundTo: 10 });
      const users = 200;
      let announced = 0;
      let evaluatedDays = 0;
      for (let user = 0; user < users; user++) {
        const series = stationaryTrendUser(1000 + user, start, days);
        const evaluations: TrendEvaluation[] = [];
        for (let i = 0; i < days; i++) evaluations.push(evaluateSignal(signal, series, start.addDays(i), 30));
        const logs = new Map<string, TrendAnnouncement[]>();
        for (let i = 2; i < days; i++) {
          const of = (at: number, key: string) => (evaluations[at] as TrendEvaluation).readings.find((r) => r.key === key) as TrendReading;
          for (const now of (evaluations[i] as TrendEvaluation).readings) {
            const log = logs.get(now.key) ?? [];
            const step = nextTrendTransition({
              log,
              asOf: now,
              dayBefore: of(i - 1, now.key),
              twoDaysBefore: of(i - 2, now.key),
              resolutionIsGoodNews: signal.resolutionIsGoodNews,
            });
            if (step.append !== undefined) logs.set(now.key, [...log, step.append]);
            if (step.transition === 'new') announced += 1;
          }
        }
        evaluatedDays += days - 2;
      }
      const perUserPer30Days = (announced / users) * (30 / (evaluatedDays / users));
      expect(perUserPer30Days).toBeLessThanOrEqual(1);
    },
    120_000,
  );

  it(
    'A random logger has no weekday habit: an unlogged-weekday finding in at most 2% of evaluations',
    () => {
      const signal = trendSignal({ id: 'logging', aspects: ['weekday'], detectors: ['unloggedWeekday'] });
      let evaluations = 0;
      let found = 0;
      for (let user = 0; user < 50; user++) {
        const series = randomGapLogger(5000 + user, start, 150);
        for (let i = 34; i < 150; i++) {
          const evaluation = evaluateSignal(signal, series, start.addDays(i), 30);
          evaluations += 1;
          if (evaluation.readings.some((r) => r.finding?.detector === 'unloggedWeekday')) found += 1;
        }
      }
      expect(found / evaluations).toBeLessThanOrEqual(0.02);
    },
    60_000,
  );

  it('a real unlogged weekday is found', () => {
    const signal = trendSignal({ id: 'logging', aspects: ['weekday'], detectors: ['unloggedWeekday'] });
    const series = randomGapLogger(1, start, 60).map((d) =>
      d.date.weekday === 0
        ? { ...d, value: undefined, eligible: false, reason: 'unlogged' as const }
        : { ...d, value: 2000, eligible: true, reason: undefined },
    );
    const evaluation = evaluateSignal(signal, series, start.addDays(59), 30);
    expect(evaluation.readings.find((r) => r.aspect === 'weekday')?.finding).toMatchObject({ detector: 'unloggedWeekday', weekday: 0, direction: 'down' });
  });
});
