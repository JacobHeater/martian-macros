import type { CalendarDate } from '../domain/CalendarDate';
import type { BodyFatEstimate } from './BodyFatEstimate';

/** What smart-scale body-fat readings say (MM-502), as of the week's update day. */
export interface ScaleLevel {
  /** The scales' level, each scale's offset taken out, with what is left of its uncertainty. */
  readonly estimate: BodyFatEstimate;

  /** How many days with a reading went into it. */
  readonly days: number;

  /** The day it is as of: the range moves once a week. */
  readonly asOf: CalendarDate;
}
