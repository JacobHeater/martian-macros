import type { CalendarDate } from '../domain/CalendarDate';
import { Fmt } from './Fmt';

/** A hidden finding's row in its fold (MM-610): "shows again Nov 21". */
export function showsAgainText(on: CalendarDate): string {
  return `shows again ${Fmt.shortDay(on)}`;
}
