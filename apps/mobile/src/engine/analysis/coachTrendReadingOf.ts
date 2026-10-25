import type { TrendDirection } from '../trends/TrendDirection';
import type { TrendFinding } from '../trends/TrendFinding';
import type { TrendReading } from '../trends/TrendReading';
import type { CoachFinding } from './CoachFinding';
import type { CoachSpanEvaluation } from './CoachSpanEvaluation';

/** The data-quality findings that quiet the composition signals (MM-606's "data quality first"). */
const limiting: readonly string[] = ['partialDays', 'estimatesRising'];

/** Whether a finding is one the announcement log keeps: a fix or a data-quality finding, never holding up or 1d's. */
const logged = (f: CoachFinding) => f.kind === 'fix' || f.kind === 'dataQuality';

/** A fix's way, as its figures carry it (`direction`, 1 or −1); up for one that has none. */
const directionOf = (f: CoachFinding): TrendDirection => (f.figures['direction'] === -1 ? 'down' : 'up');

/**
 * One announcement-log key's reading as of one day (MM-605), from the
 * coach's analysis of the span then (MM-610). The key is the finding's id,
 * so the log, the dismissals, the Coach tab and the Dashboard name a
 * finding alike.
 *
 * - **Detected** when the analysis says the finding, in its way. A
 *   finding with a trend carries the trend's tier, effect and onset; one
 *   from a level rule alone is clear, with no size (effect 0).
 * - **Held** when it is not said and the span's data is below the minimums,
 *   or a data-quality finding quiets the composition signals: missing data
 *   never resolves.
 * - **Quiet** otherwise.
 * - **Exited** a way when the finding is not said that way and the key's
 *   own exit threshold holds (`unresolved`: N1 is over only at 65%).
 */
export function coachTrendReadingOf(key: string, evaluation: CoachSpanEvaluation): TrendReading {
  const { asOf, span } = evaluation;
  const finding = evaluation.findings.find((f) => f.id === key && logged(f));
  const colon = key.indexOf(':');
  const signal = finding?.signal ?? (colon < 0 ? key : key.slice(0, colon));
  const aspect = finding?.trend?.aspect ?? 'level';
  if (finding === undefined) {
    const quieted = evaluation.findings.some((f) => f.kind === 'dataQuality' && limiting.includes(f.signal));
    const held = evaluation.held || (quieted && !key.endsWith(':dataQuality'));
    const exited = !held && !evaluation.unresolved.has(key);
    return {
      key,
      signal,
      aspect,
      asOf,
      status: held ? 'held' : 'quiet',
      finding: undefined,
      exited: { up: exited, down: exited },
    };
  }
  const direction = directionOf(finding);
  const trend: TrendFinding =
    finding.trend === undefined
      ? {
          key,
          signal: finding.signal,
          aspect,
          detector: 'levelAgainstTarget',
          direction,
          tier: 'clear',
          effect: 0,
          unit: 'finding',
          delta: 0,
          n: 0,
          k: 0,
          span,
          asOf,
          onsetDate: undefined,
          coverage: 0,
          onLoggedDays: false,
          sizeWithheld: false,
          settled: false,
          weekday: undefined,
          plannedDays: 0,
          priority: finding.priority,
          actionable: finding.kind === 'fix',
          order: 0,
          family: undefined,
          goodDirection: undefined,
          supporting: [],
        }
      : { ...finding.trend, key, direction, span, asOf };
  const otherWayOver = !evaluation.unresolved.has(key);
  return {
    key,
    signal: finding.signal,
    aspect,
    asOf,
    status: 'detected',
    finding: trend,
    exited: { up: direction === 'up' ? false : otherWayOver, down: direction === 'down' ? false : otherWayOver },
  };
}
