import type { CalendarDate } from '../domain/CalendarDate';
import type { WeightEvent } from '../domain/WeightEvent';
import { isCreatineShift } from './isCreatineShift';

/** The lasting creatine transitions allowed to move the trend level. */
export function creatineWeightEvents({
  events,
  creatineStartedOn,
}: {
  events: Iterable<WeightEvent>;
  creatineStartedOn?: CalendarDate | undefined;
}): WeightEvent[] {
  const all = [...events];
  if (
    creatineStartedOn !== undefined &&
    !all.some((event) => event.date === creatineStartedOn && event.type === 'startedCreatine')
  ) {
    all.push({ date: creatineStartedOn, type: 'startedCreatine' });
  }
  return all.filter((event) => isCreatineShift(event.type)).sort((a, b) => a.date.compareTo(b.date));
}
