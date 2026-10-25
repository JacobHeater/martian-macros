import type { CalendarDate } from '../../../domain/CalendarDate';
import type { TrendSpan } from '../../trends/TrendSpan';
import type { CoachFinding } from '../CoachFinding';
import type { FoodAnalysisInput } from './FoodAnalysisInput';
import { foodSpanAnalysisOf } from './foodSpanAnalysisOf';

/**
 * MM-606's food findings over one span ending on `asOf`: yesterday, or today for 7d with `everyLoggedDay` (MM-621)
 * (`foodSpanAnalysisOf` has the rules).
 */
export function analyseFoodSpan(
  input: FoodAnalysisInput,
  span: TrendSpan,
  asOf: CalendarDate,
  options: { everyLoggedDay?: boolean } = {},
): CoachFinding[] {
  return foodSpanAnalysisOf(input, span, asOf, options).findings;
}
