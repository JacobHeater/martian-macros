import { phaseChangeFraction, settlingDays } from './coachConstants';
import { SettlingWindow } from './SettlingWindow';
import type { TargetsRecord } from './TargetsRecord';

/**
 * The settling window after each change of intake level in `history`.
 *
 * The first targets are compared with expenditure, on the assumption that
 * the user was eating at maintenance before they started.
 */
export function settlingWindows(history: readonly TargetsRecord[]): SettlingWindow[] {
  const windows: SettlingWindow[] = [];
  let previous: TargetsRecord | undefined;
  for (const record of history) {
    const change =
      previous === undefined ? record.targets.kcal - record.tdeeKcal : record.targets.kcal - previous.targets.kcal;
    if (Math.abs(change) > phaseChangeFraction * record.tdeeKcal) {
      windows.push(new SettlingWindow(record.effectiveFrom, record.effectiveFrom.addDays(settlingDays - 1)));
    }
    previous = record;
  }
  return windows;
}
