import type { WeightEventType } from '../domain/WeightEventType';
import type { MmIconName } from '../ui/MmIconName';

const icons: Readonly<Record<WeightEventType, MmIconName>> = {
  startedCreatine: 'creatine',
  stoppedCreatine: 'creatine',
  illness: 'illness',
  travel: 'travel',
  newTraining: 'train',
  largeOrSaltyMeal: 'dinner',
  other: 'info',
};

/** The icon of a weight event's row (MM-257), always beside its label. */
export const weightEventIcon = (type: WeightEventType): MmIconName => icons[type];
