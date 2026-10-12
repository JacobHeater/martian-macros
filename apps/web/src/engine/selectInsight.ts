import type { CalendarDate } from '../domain/CalendarDate';
import type { Insight } from './Insight';
import type { InsightLogEntry } from './InsightLogEntry';
import { InsightRationing } from './InsightRationing';
import type { InsightRule } from './InsightRule';
import type { InsightSelection } from './InsightSelection';

/**
 * The one insight to show on `today`, or undefined (MM-141).
 *
 * An insight already showing and not dismissed keeps showing while its rule
 * still holds. Otherwise a new one may start: the highest-priority candidate
 * whose rule was not dismissed in the last
 * `InsightRationing.quietDaysAfterDismissal` days, at most one new a day and
 * three a week. `candidates` must be highest priority first.
 */
export function selectInsight({
  candidates,
  log,
  today,
}: {
  candidates: readonly Insight[];
  log: readonly InsightLogEntry[];
  today: CalendarDate;
}): InsightSelection | undefined {
  const latest = new Map<InsightRule, InsightLogEntry>();
  for (const entry of log) {
    const known = latest.get(entry.rule);
    if (known === undefined || !entry.shownOn.isBefore(known.shownOn)) {
      latest.set(entry.rule, entry);
    }
  }

  for (const candidate of candidates) {
    const entry = latest.get(candidate.rule);
    if (entry !== undefined && entry.dismissedOn === undefined) {
      return { insight: candidate, isNew: false };
    }
  }

  const shownToday = log.filter((e) => e.shownOn === today).length;
  const shownThisWeek = log.filter((e) => {
    const age = e.shownOn.daysUntil(today);
    return age >= 0 && age < 7;
  }).length;
  if (shownToday >= InsightRationing.newPerDay || shownThisWeek >= InsightRationing.newPerWeek) {
    return undefined;
  }

  for (const candidate of candidates) {
    const dismissed = latest.get(candidate.rule)?.dismissedOn;
    if (dismissed !== undefined && dismissed.daysUntil(today) < InsightRationing.quietDaysAfterDismissal) {
      continue;
    }
    return { insight: candidate, isNew: true };
  }
  return undefined;
}
