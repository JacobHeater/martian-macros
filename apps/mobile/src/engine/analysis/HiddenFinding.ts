import type { CalendarDate } from '../../domain/CalendarDate';
import type { CoachFinding } from './CoachFinding';

/** A finding dismissed in the last 28 days (MM-610's "1 hidden · shows again 14 Nov"): still true, not shown until `showsAgainOn`. */
export interface HiddenFinding {
  readonly finding: CoachFinding;
  readonly dismissedOn: CalendarDate;
  readonly showsAgainOn: CalendarDate;
}
