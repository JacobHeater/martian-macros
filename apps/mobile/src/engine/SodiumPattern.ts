import type { CalendarDate } from '../domain/CalendarDate';
import type { SodiumDay } from '../domain/food/micros/SodiumDay';

/** What the sodium rule needs (MM-312): the limit, the day it was set, and each day's sodium. */
export interface SodiumPattern {
  readonly limitMg: number;
  readonly since: CalendarDate;
  readonly days: ReadonlyMap<CalendarDate, SodiumDay>;
}
