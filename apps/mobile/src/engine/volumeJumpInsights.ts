import type { CalendarDate } from '../domain/CalendarDate';
import type { Pause } from '../domain/Pause';
import type { Exercise } from '../domain/training/Exercise';
import { MuscleGroup } from '../domain/training/MuscleGroup';
import type { Workout } from '../domain/training/Workout';
import { countHardSets } from './countHardSets';
import { ItemAnchor } from './ItemAnchor';
import type { ItemInsight } from './ItemInsight';
import { pausedDaysBetween } from './pausedDaysBetween';
import { VolumeJumpRule } from './VolumeJumpRule';

/** The days a volume jump looks back over: this week and the usual weeks before it. */
const basisDays = 7 * (VolumeJumpRule.usualWeeks + 1);

/**
 * The "volume jump" insights under `workout`'s exercises (MM-366): for each
 * muscle group that one of its exercises mainly trains, whether the hard
 * sets for that group in the 7 days to the workout are well above the
 * group's usual week, counted as weekly volume counts them (MM-78).
 *
 * The weeks are the workout's own, so a workout looked back on says what
 * held then (the panel's TR-5). A workout in progress counts the finished
 * workouts before it. The insight sits under the first exercise of the
 * workout that mainly trains the group, once (the product owner,
 * 2026-10-17), on every workout while it holds; the person snoozes it
 * (MM-378). Nothing is said when a pause falls in the weeks it looks at,
 * since a comeback is not a jump (the panel's SA-4).
 */
export function volumeJumpInsights({
  workout,
  workouts,
  exercisesById,
  pauses,
}: {
  workout: Workout;
  workouts: readonly Workout[];
  exercisesById: ReadonlyMap<string, Exercise>;
  pauses: readonly Pause[];
}): ItemInsight[] {
  const ref = workout.date;
  const from = ref.addDays(1 - basisDays);
  if (pausedDaysBetween(pauses, ref.addDays(1 - basisDays), ref) > 0) return [];

  // Each finished workout's hard sets by group, over the weeks looked at.
  const days: { date: CalendarDate; totals: ReadonlyMap<MuscleGroup, number> }[] = [];
  for (const other of workouts) {
    if (other.inProgress || other.date.isBefore(from) || other.date.isAfter(ref)) continue;
    const totals = new Map<MuscleGroup, number>();
    countHardSets(other, exercisesById, totals);
    days.push({ date: other.date, totals });
  }

  const setsIn = (group: MuscleGroup, last: CalendarDate) =>
    days
      .filter((day) => !day.date.isAfter(last) && day.date.daysUntil(last) < 7)
      .reduce((sum, day) => sum + (day.totals.get(group) ?? 0), 0);

  /** The week to `day` and the usual week before it, when the week is a jump. */
  const jumpOn = (group: MuscleGroup, day: CalendarDate) => {
    const week = setsIn(group, day);
    const usualWeeks = Array.from({ length: VolumeJumpRule.usualWeeks }, (_, k) => setsIn(group, day.addDays(-7 * (k + 1))));
    if (usualWeeks.filter((sets) => sets > 0).length < VolumeJumpRule.weeksWithSets) return undefined;
    const usual = usualWeeks.reduce((sum, sets) => sum + sets, 0) / usualWeeks.length;
    if (week < usual * VolumeJumpRule.ratio || week - usual < VolumeJumpRule.minimumMoreSets) return undefined;
    return { week, usual };
  };

  const found: ItemInsight[] = [];
  const placed = new Set<MuscleGroup>();
  for (const entry of workout.exercises) {
    const group = exercisesById.get(entry.exerciseId)?.primary;
    if (group === undefined || placed.has(group)) continue;
    placed.add(group);
    const jump = jumpOn(group, ref);
    if (jump === undefined) continue;
    found.push({
      kind: 'volumeJump',
      anchor: ItemAnchor.exercise(workout.id, entry.exerciseId),
      subject: entry.exerciseId,
      basis: 'pattern',
      figures: {
        group: MuscleGroup.values.indexOf(group),
        weekSets: jump.week,
        usualSets: jump.usual,
        inProgress: workout.inProgress ? 1 : 0,
      },
      from: ref.addDays(1 - basisDays),
      to: ref,
    });
  }
  return found;
}
