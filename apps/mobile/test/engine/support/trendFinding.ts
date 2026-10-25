import { CalendarDate } from '../../../src/domain';
import type { TrendFinding } from '../../../src/engine';

/** A finding with plain defaults, for the state machine's and the ranking's tests (MM-605). */
export function trendFinding(overrides: Partial<TrendFinding> = {}): TrendFinding {
  const signal = overrides.signal ?? 'kcal';
  const aspect = overrides.aspect ?? 'level';
  return {
    key: `${signal}:${aspect}`,
    signal,
    aspect,
    detector: 'shift',
    direction: 'up',
    tier: 'clear',
    effect: 200,
    unit: 'kcal',
    delta: 100,
    n: 30,
    k: 10,
    span: 30,
    asOf: CalendarDate.of(2026, 10, 20),
    onsetDate: CalendarDate.of(2026, 10, 10),
    coverage: 1,
    onLoggedDays: false,
    sizeWithheld: false,
    settled: false,
    weekday: undefined,
    plannedDays: 0,
    priority: 'pattern',
    actionable: true,
    order: 0,
    family: undefined,
    goodDirection: undefined,
    supporting: [],
    ...overrides,
  };
}
