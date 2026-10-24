import type { CalendarDate } from '../../domain/CalendarDate';
import type { InsightPriority } from '../InsightPriority';
import type { TrendSpan } from '../trends/TrendSpan';
import type { CoachFinding } from './CoachFinding';
import type { CoachFindingKind } from './CoachFindingKind';

/**
 * A finding of a rule over weeks or sessions (MM-609): no trend, food or
 * trade behind it. Its id is the signal, the kind and what it names, so it
 * stays the same across days while it holds.
 */
export function coachFindingOf({
  signal,
  kind,
  span,
  from,
  to,
  priority,
  figures,
  subjects,
  key,
}: {
  signal: string;
  kind: CoachFindingKind;
  span: TrendSpan;
  from: CalendarDate;
  to: CalendarDate;
  priority: InsightPriority;
  figures: Readonly<Record<string, number>>;
  subjects?: readonly string[] | undefined;
  /** What tells two findings of one signal and kind apart, such as a lift or a muscle group. */
  key?: string | undefined;
}): CoachFinding {
  return {
    id: key === undefined ? `${signal}:${kind}` : `${signal}:${kind}:${key}`,
    signal,
    kind,
    span,
    from,
    to,
    priority,
    figures,
    foods: [],
    trade: undefined,
    trend: undefined,
    ...(subjects === undefined ? {} : { subjects }),
  };
}
