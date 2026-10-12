import type { Pause } from '../domain/Pause';
import type { WeightEvent } from '../domain/WeightEvent';
import type { WeightEventType } from '../domain/WeightEventType';

/**
 * The weight events an illness or injury pause records for its own dates,
 * so the scale is discounted without the user being asked twice (MM-148,
 * MM-136). One a week across the pause, which is as many as the trend takes
 * into account. Travel and other pauses record none.
 */
export function pauseWeightEvents(pause: Pause): WeightEvent[] {
  let type: WeightEventType;
  switch (pause.reason) {
    case 'illness':
      type = 'illness';
      break;
    case 'injury':
      type = 'other';
      break;
    case 'travel':
    case 'other':
      return [];
  }
  const events: WeightEvent[] = [];
  for (let day = 0; day < pause.days; day += 7) {
    events.push({ date: pause.from.addDays(day), type });
  }
  return events;
}
