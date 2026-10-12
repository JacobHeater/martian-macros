import type { CalendarDate, WaistObservation } from '../domain';
import { type MeasuredChange, waistChangeOf } from '../engine';
import { ArgumentError } from '../lang/ArgumentError';
import { Fmt } from './Fmt';
import { waistAmount } from './waistAmount';

/**
 * The waist card's line (MM-155): the latest measurement, whether it has
 * changed since the start by the one rule every feature uses, and when the
 * next one is due. The start is the middle of the first three entries, not
 * one reading, and a difference inside the tape's noise is said to be no
 * clear change.
 *
 * "Latest: 91 cm on Oct 5. Down 2.5 cm since you started. Weekly is
 * enough: the next is due Oct 12."
 */
export function waistSummary(waist: readonly WaistObservation[], fmt: Fmt, today: CalendarDate): string {
  const latest = waist[waist.length - 1];
  if (latest === undefined) throw new ArgumentError('A waist summary needs a measurement.');
  const due = latest.date.addDays(7);
  // Weekly is the cadence: it says when, and does not invite measuring
  // every day.
  const next = due.isAfter(today) ? ` Weekly is enough: the next is due ${Fmt.shortDay(due)}.` : '';
  const base = `Latest: ${waistAmount(latest.waistCm, fmt)} on ${Fmt.shortDay(latest.date)}.`;
  if (waist.length < 2) return `${base}${next}`;
  const change = waistChangeOf({ waist, asOf: today, sinceStart: true });
  if (change === undefined) return `${base} Measure again to see how it has changed.`;
  const amount = waistAmount(change.changeCm, fmt);
  const since: Readonly<Record<MeasuredChange, string>> = {
    down: `Down ${amount} since you started.`,
    up: `Up ${amount} since you started.`,
    noClearChange:
      'No clear change since you started: a difference under ' +
      `${waistAmount(change.thresholdCm, fmt)} is within what a tape ` +
      'can tell.',
  };
  return `${base} ${since[change.direction]}${next}`;
}
