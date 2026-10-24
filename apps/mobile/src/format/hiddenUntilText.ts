import type { CalendarDate } from '../domain/CalendarDate';
import { Fmt } from './Fmt';

/** The snack once a finding is dismissed (MM-610): "Hidden until Nov 21". No undo: the trend log only appends. */
export function hiddenUntilText(on: CalendarDate): string {
  return `Hidden until ${Fmt.shortDay(on)}`;
}
