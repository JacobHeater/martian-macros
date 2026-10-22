import type { BodyFatObservation } from '../domain/BodyFatObservation';
import type { CalendarDate } from '../domain/CalendarDate';
import { BodyFatEstimate } from './BodyFatEstimate';
import { BodyFatRule } from './BodyFatRule';
import type { ScaleLevel } from './ScaleLevel';

/** The middle of `values`, which is not empty. */
function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? (sorted[mid] as number) : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
}

/** One figure a day for a scale: the middle of that day's readings, so weighing often counts no more. */
interface Day {
  readonly date: CalendarDate;
  readonly percent: number;
}

/** One figure a calendar day: the middle of that day's figures, sorted by day. */
function daysOf(readings: readonly { readonly date: CalendarDate; readonly percent: number }[]): Day[] {
  const byDay = new Map<number, { date: CalendarDate; values: number[] }>();
  for (const reading of readings) {
    const day = byDay.get(reading.date.epochDay);
    if (day === undefined) byDay.set(reading.date.epochDay, { date: reading.date, values: [reading.percent] });
    else day.values.push(reading.percent);
  }
  return [...byDay.values()]
    .sort((a, b) => a.date.epochDay - b.date.epochDay)
    .map(({ date, values }) => ({ date, percent: median(values) }));
}

/**
 * The first day of the readings' current run: after a gap longer than
 * `BodyFatRule.scaleWindowDays` with no reading, the scale settles again
 * from its first reading after the gap.
 */
function runStart(readings: readonly BodyFatObservation[]): CalendarDate {
  const days = daysOf(readings);
  let start = (days[0] as Day).date;
  for (let i = 1; i < days.length; i++) {
    const day = (days[i] as Day).date;
    if ((days[i - 1] as Day).date.daysUntil(day) > BodyFatRule.scaleWindowDays) start = day;
  }
  return start;
}

/**
 * What smart-scale body-fat readings say (MM-502), or undefined before they
 * can say anything.
 *
 * A scale's reading is mostly body water and swings two to five points
 * overnight, so the readings are used slowly: one figure a day per scale,
 * the middle of the last `BodyFatRule.scaleWindowDays` days up to the
 * week's update day (so one spike moves nothing, and the range changes
 * once a week), and only once the first scale's readings span
 * `BodyFatRule.scaleSettleDays`. After a gap longer than the window with
 * no reading, the readings settle again from the first after the gap. The
 * days counted are calendar days: the scales' figures for one day (after
 * each scale's offset) are taken as one, their middle.
 *
 * Each scale has its own bias. The first is taken as it reads, its fixed
 * error (`scaleBiasSigmaPercent`) left in the uncertainty for the formula
 * and the tape to temper when the two are combined. A scale that starts
 * later is learned against the ones before it: the middle of its first
 * `scaleOffsetDays` days against theirs in the window before it began is
 * its offset, taken out of every reading, and until then it counts for
 * nothing. So a new scale that reads four points higher does not move the
 * range. One that starts with no readings before it to learn from is
 * taken as it reads, as the first was.
 */
export function scaleBodyFat({
  readings,
  today,
}: {
  readings: readonly BodyFatObservation[];
  today: CalendarDate;
}): ScaleLevel | undefined {
  const valid = readings.filter((r) => !r.date.isAfter(today) && Number.isFinite(r.percent) && r.percent > 0 && r.percent < 100);
  if (valid.length === 0) return undefined;
  // Only the current run counts: a scale back after a long gap settles again.
  const first = runStart(valid);
  const known = valid.filter((r) => !r.date.isBefore(first));
  // The update day: a whole number of weeks after the first reading.
  const asOf = today.addDays(-(first.daysUntil(today) % 7));
  if (first.daysUntil(asOf) < BodyFatRule.scaleSettleDays) return undefined;

  const byDevice = new Map<string, BodyFatObservation[]>();
  for (const reading of known) {
    if (reading.date.isAfter(asOf)) continue;
    const id = reading.deviceId ?? '';
    const list = byDevice.get(id);
    if (list === undefined) byDevice.set(id, [reading]);
    else list.push(reading);
  }
  const devices = [...byDevice.values()].map(daysOf).sort((a, b) => (a[0] as Day).date.epochDay - (b[0] as Day).date.epochDay);

  // Every joined scale's days, its offset taken out.
  const series: Day[] = [];
  for (const days of devices) {
    const start = (days[0] as Day).date;
    const before = series.filter((d) => d.date.isBefore(start) && start.daysUntil(d.date) >= -BodyFatRule.scaleWindowDays);
    let offset = 0;
    if (before.length > 0) {
      const learnedOn = start.addDays(BodyFatRule.scaleOffsetDays);
      // Still learning: it counts for nothing yet.
      if (asOf.isBefore(learnedOn)) continue;
      const learning = days.filter((d) => d.date.isBefore(learnedOn));
      offset = median(learning.map((d) => d.percent)) - median(before.map((d) => d.percent));
    }
    for (const day of days) series.push({ date: day.date, percent: day.percent - offset });
  }

  // One figure a calendar day across scales and sources, so a reading copied
  // by a second app, or two scales on one morning, counts as one day.
  const window = daysOf(series).filter((d) => !d.date.isAfter(asOf) && d.date.daysUntil(asOf) < BodyFatRule.scaleWindowDays);
  if (window.length < BodyFatRule.minScaleDays) return undefined;
  const values = window.map((d) => d.percent);
  const level = median(values);
  // A robust spread: the middle absolute deviation, scaled to a standard deviation.
  const scatter = Math.max(1.4826 * median(values.map((v) => Math.abs(v - level))), BodyFatRule.scaleScatterFloorPercent);
  // The middle of n is about a quarter less efficient than their mean.
  const sampling = (1.25 * scatter * scatter) / values.length;
  const sigma = Math.sqrt(BodyFatRule.scaleBiasSigmaPercent * BodyFatRule.scaleBiasSigmaPercent + sampling);
  return { estimate: new BodyFatEstimate({ percent: level, sigmaPercent: sigma }), days: window.length, asOf };
}
