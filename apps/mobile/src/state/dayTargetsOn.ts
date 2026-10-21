import type { CalendarDate } from '../domain/CalendarDate';
import { TargetShape } from '../domain/TargetShape';
import type { DailyTargets } from '../engine/DailyTargets';
import { shapedTargets } from '../engine/shapedTargets';
import type { TargetShapeLimits } from '../engine/TargetShapeLimits';
import type { TargetsRecord } from '../engine/TargetsRecord';
import { targetsOn } from './targetsOn';

/**
 * The targets for `day` (MM-122, MM-124): the check-in's targets in force
 * then, shaped as the user had set on that day, so a day before a change
 * keeps the target it had. Flat while the limits are not known yet.
 */
export function dayTargetsOn({
  history,
  day,
  shapes,
  limits,
  targetsAllowed = true,
}: {
  history: readonly TargetsRecord[];
  day: CalendarDate;
  shapes: readonly TargetShape[];
  limits: TargetShapeLimits | undefined;
  targetsAllowed?: boolean;
}): DailyTargets | undefined {
  const record = targetsOn(history, day, { targetsAllowed });
  if (record === undefined || limits === undefined) return record?.targets;
  return shapedTargets({ targets: record.targets, weekday: day.weekday, shape: TargetShape.on(shapes, day), limits });
}
