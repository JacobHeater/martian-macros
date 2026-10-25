import type { CalendarDate } from '../../../src/domain';
import type { TrendDirection, TrendReading, TrendTier } from '../../../src/engine';
import { trendFinding } from './trendFinding';

/**
 * One key's reading as of `asOf`, for the state machine's tests (MM-605):
 * detected one way, quiet, or held. A quiet reading has exited both ways
 * unless `exited` says otherwise.
 */
export function trendReading(
  asOf: CalendarDate,
  state: TrendDirection | 'quiet' | 'held',
  { tier = 'clear', effect, exited }: { tier?: TrendTier; effect?: number; exited?: { up: boolean; down: boolean } } = {},
): TrendReading {
  const base = { key: 'kcal:level', signal: 'kcal', aspect: 'level' as const, asOf };
  if (state === 'held') return { ...base, status: 'held', finding: undefined, exited: { up: false, down: false } };
  if (state === 'quiet') return { ...base, status: 'quiet', finding: undefined, exited: exited ?? { up: true, down: true } };
  const finding = trendFinding({ direction: state, tier, effect: effect ?? (state === 'up' ? 200 : -200), asOf });
  return { ...base, status: 'detected', finding, exited: exited ?? { up: false, down: false } };
}
