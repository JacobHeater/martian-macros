import { CalendarDate } from '../domain/CalendarDate';
import type { IntakeDay } from '../domain/IntakeDay';
import type { Pause } from '../domain/Pause';
import type { WeightObservation } from '../domain/WeightObservation';
import { ActivityGap } from './ActivityGap';
import { GapRule } from './GapRule';

/**
 * Every run of at least `minimumDays` days with no weigh-in and no food
 * logged, oldest first, up to the day before `today` (MM-147). Today is not
 * over, so it is never part of a gap; a gap is open while today also has
 * nothing recorded.
 *
 * A paused day is never part of a gap (MM-148): a planned break is not a
 * lapse.
 */
export function activityGaps({
  weights,
  intake,
  today,
  pauses = [],
  minimumDays = GapRule.minimumDays,
}: {
  weights: Iterable<WeightObservation>;
  intake: Iterable<IntakeDay>;
  today: CalendarDate;
  pauses?: Iterable<Pause>;
  minimumDays?: number;
}): ActivityGap[] {
  const days = new Set<number>();
  for (const w of weights) {
    if (!w.date.isAfter(today)) days.add(w.date.epochDay);
  }
  for (const d of intake) {
    if (d.kcal > 0 && !d.date.isAfter(today)) days.add(d.date.epochDay);
  }
  for (const p of pauses) {
    for (let day = p.from.epochDay; day <= p.to.epochDay; day++) {
      if (day <= today.epochDay) days.add(day);
    }
  }
  const active = [...days].sort((a, b) => a - b);
  const last = active[active.length - 1];
  if (last === undefined) return [];

  const gaps: ActivityGap[] = [];
  const add = (afterDay: number, beforeDay: number) => {
    if (beforeDay - afterDay - 1 >= minimumDays) {
      gaps.push(
        new ActivityGap({
          from: CalendarDate.fromEpochDay(afterDay + 1),
          to: CalendarDate.fromEpochDay(beforeDay - 1),
        }),
      );
    }
  };
  for (let i = 1; i < active.length; i++) {
    add(active[i - 1] as number, active[i] as number);
  }
  if (last !== today.epochDay) add(last, today.epochDay);
  return gaps;
}
