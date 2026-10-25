import type { CalendarDate } from '../../../domain/CalendarDate';
import type { FoodAnalysisInput } from '../food/FoodAnalysisInput';
import type { CoachAdviceGiven } from './CoachAdviceGiven';

/** What the coach's follow-ups read (MM-617): the food analysis's input, the record of advice shown, and today. */
export interface CoachFollowUpInput {
  /** The food entries and days, as 1d reads them; they reach back 28 days at least. */
  readonly food: FoodAnalysisInput;
  /** The advice shown in the last `CoachFollowUpRule.saidBeforeDays` days at least (`CoachAdviceRecordReader`). */
  readonly given: readonly CoachAdviceGiven[];
  readonly today: CalendarDate;
}
