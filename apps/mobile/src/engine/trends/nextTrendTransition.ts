import type { TrendAnnouncement } from './TrendAnnouncement';
import type { TrendDirection } from './TrendDirection';
import type { TrendFinding } from './TrendFinding';
import type { TrendReading } from './TrendReading';
import { TrendRule } from './TrendRule';
import type { TrendStep } from './TrendStep';
import { TrendTier } from './TrendTier';
import type { TrendTransition } from './TrendTransition';
import type { TrendTransitionInput } from './TrendTransitionInput';

const said: readonly TrendTransition[] = ['new', 'update', 'reversed', 'backAgain'];

const nothing: TrendStep = { transition: 'none', append: undefined, announced: false };

const detects = (reading: TrendReading, direction: TrendDirection) =>
  reading.status === 'detected' && reading.finding?.direction === direction;

/**
 * One key's state machine, as a pure function (MM-605). The state is read
 * from the key's announcement log; pending, held and the exit counts from
 * the readings as of E, E−1 and E−2.
 *
 * - **Quiet** (no entry, or held 21 days): new needs detection as of E and
 *   E−1, or a strong finding as of E.
 * - **Reported**: reversed needs the opposite direction as of E and E−1.
 *   Resolved needs the exit threshold as of E, E−1 and E−2, none of them
 *   held, and is said only where it is good news. A continuing trend's
 *   figures update silently; it is re-announced (update) when the tier
 *   rises or the effect grows by half, at most every 14 days.
 * - **Held**: data below the minimums. Missing data never resolves a
 *   trend. Entering held is logged, so that the 21 days are counted, and so
 *   is the return from it (continuing).
 * - **Resolved**: the same direction again within 28 days is back again.
 *
 * A change of `rulesVersion` does not re-announce a continuing trend.
 */
export function nextTrendTransition(input: TrendTransitionInput): TrendStep {
  const { log, asOf: e, dayBefore: e1, twoDaysBefore: e2 } = input;
  const on = e.asOf;
  const rulesVersion = input.rulesVersion ?? TrendRule.rulesVersion;
  const last = log[log.length - 1];

  const fromFinding = (transition: TrendAnnouncement['transition'], f: TrendFinding): TrendAnnouncement => ({
    key: e.key,
    transition,
    on,
    direction: f.direction,
    onsetDate: f.onsetDate,
    figures: { effect: f.effect, unit: f.unit, n: f.n, k: f.k, span: f.span, coverage: f.coverage },
    tier: f.tier,
    rulesVersion,
  });
  const fromEntry = (transition: TrendAnnouncement['transition'], entry: TrendAnnouncement): TrendAnnouncement => ({
    ...entry,
    key: e.key,
    transition,
    on,
    rulesVersion,
  });

  const start = (resolved: TrendAnnouncement | undefined): TrendStep => {
    const f = e.finding;
    if (e.status !== 'detected' || f === undefined) return nothing;
    if (f.tier !== 'strong' && !detects(e1, f.direction)) return nothing;
    const back = resolved !== undefined && resolved.direction === f.direction && resolved.on.daysUntil(on) <= TrendRule.backAgainDays;
    const transition = back ? 'backAgain' : 'new';
    return { transition, append: fromFinding(transition, f), announced: true };
  };

  const reported = (entry: TrendAnnouncement, resuming: boolean): TrendStep => {
    const direction = entry.direction;
    if (e.status === 'held') {
      return { transition: 'held', append: resuming ? undefined : fromEntry('held', entry), announced: false };
    }
    const opposite: TrendDirection = direction === 'up' ? 'down' : 'up';
    if (detects(e, opposite) && detects(e1, opposite)) {
      return { transition: 'reversed', append: fromFinding('reversed', e.finding as TrendFinding), announced: true };
    }
    if ([e, e1, e2].every((r) => r.status !== 'held' && r.exited[direction])) {
      return { transition: 'resolved', append: fromEntry('resolved', entry), announced: input.resolutionIsGoodNews };
    }
    const f = detects(e, direction) ? e.finding : undefined;
    const lastSaid = [...log].reverse().find((a) => said.includes(a.transition));
    if (f !== undefined && lastSaid !== undefined) {
      const rose = TrendTier.rank(f.tier) > TrendTier.rank(lastSaid.tier);
      const grew = Math.abs(f.effect) >= (1 + TrendRule.reannounceGrowth) * Math.abs(lastSaid.figures.effect);
      if ((rose || grew) && lastSaid.on.daysUntil(on) >= TrendRule.reannounceQuietDays) {
        return { transition: 'update', append: fromFinding('update', f), announced: true };
      }
    }
    if (!resuming) return { transition: 'continuing', append: undefined, announced: false };
    return { transition: 'continuing', append: f === undefined ? fromEntry('continuing', entry) : fromFinding('continuing', f), announced: false };
  };

  if (last === undefined) return start(undefined);
  if (last.transition === 'resolved') return start(last);
  if (last.transition === 'held') {
    if (last.on.daysUntil(on) >= TrendRule.heldQuietDays) return start(undefined);
    return reported(last, true);
  }
  return reported(last, false);
}
