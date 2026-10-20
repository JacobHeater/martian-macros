import type { InlineInsightContent } from '../coach/InlineInsightContent';
import type { CalendarDate } from '../domain/CalendarDate';
import type { WeightJumpExplanation } from '../engine/WeightJumpExplanation';
import type { Fmt } from '../format/Fmt';
import { weightJumpText } from '../format/weightJumpText';

/**
 * A weigh-in's explanation (MM-142) as the coach's line under the reading,
 * with its figures one tap down, as the rebound note is drawn under the
 * weigh-in (MM-130). Not an insight (MM-141): nothing is logged, and it is
 * never pushed. `place` is where it is drawn, for the offer's words.
 */
export function weightJumpContent(
  explanation: WeightJumpExplanation,
  fmt: Fmt,
  today: CalendarDate,
  place: 'dashboard' | 'progress',
): InlineInsightContent {
  const { line, evidence } = weightJumpText(explanation, fmt, today, { place });
  // No kind and no switch: it goes with the weight display (MM-118) and the safeguards, so no "Settings for".
  return { line, evidence, area: 'body', rule: 'A jump on the scale' };
}
