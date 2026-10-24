import type { TrendDay, TrendSignal } from '../../../src/engine';

/**
 * A signal over a ready-made series, for the trend engine's tests (MM-605):
 * kcal with δ 100, rounded to 10, every aspect and every detector but the
 * unlogged weekday.
 */
export function trendSignal(overrides: Partial<TrendSignal<readonly TrendDay[]>> = {}): TrendSignal<readonly TrendDay[]> {
  return {
    id: 'kcal',
    series: (days) => days,
    unit: 'kcal',
    delta: 100,
    sigmaFloor: 10,
    roundTo: 10,
    priority: 'pattern',
    goodDirection: undefined,
    resolutionIsGoodNews: true,
    actionable: true,
    order: 0,
    aspects: ['level', 'drift', 'weekday'],
    detectors: ['levelAgainstTarget', 'drift', 'shift', 'longRun', 'shortRun', 'weekend', 'weekday', 'recentAgainstBaseline'],
    ...overrides,
  };
}
