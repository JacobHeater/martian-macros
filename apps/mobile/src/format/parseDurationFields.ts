import { SleepNight } from '../domain/SleepNight';
import { parseNumber } from './parseNumber';

/**
 * The minutes a person typed as hours and minutes (MM-250), or what is
 * wrong with them and under which field to say it. An empty field is zero;
 * two empty fields are nothing typed, which is neither a value nor an
 * error. The same checks serve the Progress card and the check-in, so a
 * value is refused the same way wherever it is typed.
 */
export function parseDurationFields({ hours, minutes }: { hours: string; minutes: string }): {
  minutes: number | undefined;
  error: { on: 'hours' | 'minutes'; text: string } | undefined;
} {
  const nothing = { minutes: undefined, error: undefined };
  if (hours.trim() === '' && minutes.trim() === '') return nothing;
  const h = hours.trim() === '' ? 0 : parseNumber(hours);
  const m = minutes.trim() === '' ? 0 : parseNumber(minutes);
  if (h === undefined || h < 0 || h > 24) return { minutes: undefined, error: { on: 'hours', text: 'Up to 24 hours.' } };
  if (m === undefined || m < 0 || m >= 60) {
    return { minutes: undefined, error: { on: 'minutes', text: 'Minutes from 0 to 59.' } };
  }
  const total = Math.round(h * 60 + m);
  if (total > SleepNight.maxMinutes) return { minutes: undefined, error: { on: 'minutes', text: 'Up to 24 hours in all.' } };
  if (total < SleepNight.minMinutes) return { minutes: undefined, error: { on: 'hours', text: 'Type the hours asleep.' } };
  return { minutes: total, error: undefined };
}
