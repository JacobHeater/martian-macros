import type { CalendarDate } from '../domain/CalendarDate';
import type { Pause } from '../domain/Pause';
import { phaseChangeFraction, settlingDays } from './coachConstants';
import { PauseRule } from './PauseRule';
import { SettlingWindow } from './SettlingWindow';
import type { TargetsRecord } from './TargetsRecord';

/** The record in force on `date`: the latest that took effect on or before it. */
function recordOn(history: readonly TargetsRecord[], date: CalendarDate): TargetsRecord | undefined {
  let found: TargetsRecord | undefined;
  for (const record of history) {
    if (record.effectiveFrom.isAfter(date)) continue;
    if (found === undefined || record.effectiveFrom.isAfter(found.effectiveFrom)) found = record;
  }
  return found;
}

/** Whether `record`'s targets are a deficit or a surplus: more than `phaseChangeFraction` from its expenditure. */
function offMaintenance(record: TargetsRecord | undefined): boolean {
  return record !== undefined && Math.abs(record.targets.kcal - record.tdeeKcal) > phaseChangeFraction * record.tdeeKcal;
}

/**
 * The settling windows a pause makes (MM-148, MM-131): a pause is a change
 * of phase at both ends. During it the guide is maintenance, so a deficit
 * or a surplus stops on its first day and starts again on the day after
 * it, and the scale moves a kilogram or two with glycogen, water and gut
 * contents each time.
 *
 * A pause counts when it is long enough to be a diet break
 * (`PauseRule.deficitBreakDays`, so seven days counts). Each end is judged
 * on the targets in force on it: the first day on the targets the pause
 * began from, the day after on the targets it resumes to (a change of goal
 * while paused can make the return a maintenance one). An end settles when
 * its targets differ from the expenditure they were based on by more than
 * `phaseChangeFraction`, the test `settlingWindows` makes of a target
 * change; exactly on the line is not a change. A window is made only once
 * its first day has come.
 */
export function pauseSettlingWindows({
  pauses,
  history,
  today,
}: {
  pauses: Iterable<Pause>;
  history: readonly TargetsRecord[];
  today: CalendarDate;
}): SettlingWindow[] {
  const windows: SettlingWindow[] = [];
  for (const pause of pauses) {
    if (pause.days < PauseRule.deficitBreakDays || pause.from.isAfter(today)) continue;
    if (offMaintenance(recordOn(history, pause.from))) {
      windows.push(new SettlingWindow(pause.from, pause.from.addDays(settlingDays - 1)));
    }
    if (!pause.resumesOn.isAfter(today) && offMaintenance(recordOn(history, pause.resumesOn))) {
      windows.push(new SettlingWindow(pause.resumesOn, pause.resumesOn.addDays(settlingDays - 1)));
    }
  }
  return windows.sort((a, b) => a.start.compareTo(b.start));
}
