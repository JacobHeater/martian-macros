import type { WeightEventType } from '../domain/WeightEventType';

/** Whether an event is a lasting creatine transition; the rest are passing. */
export function isCreatineShift(type: WeightEventType): boolean {
  return type === 'startedCreatine' || type === 'stoppedCreatine';
}
