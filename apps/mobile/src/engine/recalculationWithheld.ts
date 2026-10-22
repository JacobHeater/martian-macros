import type { CalendarDate } from '../domain/CalendarDate';
import type { Pause } from '../domain/Pause';
import type { WeightObservation } from '../domain/WeightObservation';
import { breakInForce } from './breakInForce';
import { recalculationWeighInDays } from './coachConstants';
import { pauseOn } from './pauseOn';
import type { RecalculationWithheldReason } from './RecalculationWithheldReason';
import type { TargetsRecord } from './TargetsRecord';

/**
 * Why the person cannot recalculate their targets today (MM-559), or
 * undefined when they can. A recalculation works from the latest weight, so
 * it needs a weigh-in from the last `recalculationWeighInDays` days. The
 * reasons nothing would change come first, as a new weigh-in would not
 * change them.
 */
export function recalculationWithheld({
  weights,
  history,
  pauses,
  today,
}: {
  weights: readonly WeightObservation[];
  history: readonly TargetsRecord[];
  pauses: readonly Pause[];
  today: CalendarDate;
}): RecalculationWithheldReason | undefined {
  if (pauseOn(pauses, today) !== undefined) return 'paused';
  if (breakInForce(history, today) !== undefined) return 'onBreak';
  const current = history[history.length - 1];
  if (current?.targets.flags.has('easingIn') === true) return 'easingIn';
  const since = today.addDays(-(recalculationWeighInDays - 1));
  const recent = weights.some((weight) => !weight.date.isBefore(since) && !weight.date.isAfter(today));
  if (!recent) return 'noRecentWeighIn';
  if (current !== undefined && !current.effectiveFrom.isBefore(today)) return 'issuedToday';
  return undefined;
}
