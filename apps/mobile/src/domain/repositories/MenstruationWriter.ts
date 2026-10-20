import type { CalendarDate } from '../CalendarDate';

/** Marks and unmarks days with menstrual flow (MM-20). */
export interface MenstruationWriter {
  markFlowDay(date: CalendarDate): Promise<void>;
  unmarkFlowDay(date: CalendarDate): Promise<void>;
}
