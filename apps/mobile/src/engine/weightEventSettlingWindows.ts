import type { WeightEvent } from '../domain/WeightEvent';
import { SettlingWindow } from './SettlingWindow';
import { weightEventStepDays } from './weightEventConstants';

/** Transition windows are excluded from tissue-slope TDEE calculations. */
export function weightEventSettlingWindows(creatineEvents: Iterable<WeightEvent>): SettlingWindow[] {
  return [...creatineEvents].map(
    (event) => new SettlingWindow(event.date, event.date.addDays(weightEventStepDays - 1)),
  );
}
