import type { CalendarDate } from '../domain/CalendarDate';
import type { WaistObservation } from '../domain/WaistObservation';
import type { WeightTrendPoint } from '../engine/WeightTrendPoint';
import { Fmt } from './Fmt';
import { waistAmount } from './waistAmount';

/** How far from a photo's day a trend weight or a waist is still said under it. */
const nearDays = 7;

/**
 * What is said under a compared photo (MM-157): its day; the trend weight
 * then (the trend's, never a raw reading), unless weights are not shown
 * (MM-118); and the waist measured nearest to it. Each only when there is
 * one within a week of the day.
 */
export function comparedPhotoLines({
  date,
  trend,
  waist,
  fmt,
  showWeight,
}: {
  date: CalendarDate;
  trend: readonly WeightTrendPoint[];
  waist: readonly WaistObservation[];
  fmt: Fmt;
  showWeight: boolean;
}): string[] {
  const lines = [Fmt.longDate(date)];
  if (showWeight) {
    const point = [...trend].reverse().find((p) => p.date.epochDay <= date.epochDay && date.epochDay - p.date.epochDay <= nearDays);
    if (point !== undefined) lines.push(`Trend ${fmt.weight(point.levelKg)}`);
  }
  const measured = waist
    .filter((w) => Math.abs(w.date.epochDay - date.epochDay) <= nearDays)
    .sort((a, b) => Math.abs(a.date.epochDay - date.epochDay) - Math.abs(b.date.epochDay - date.epochDay))[0];
  if (measured !== undefined) lines.push(`Waist ${waistAmount(measured.waistCm, fmt)}`);
  return lines;
}
