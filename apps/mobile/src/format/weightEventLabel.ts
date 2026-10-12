import type { WeightEventType } from '../domain';

const labels: Readonly<Record<WeightEventType, string>> = {
  startedCreatine: 'Started creatine',
  stoppedCreatine: 'Stopped creatine',
  illness: 'Illness',
  travel: 'Travel',
  newTraining: 'New or harder training',
  largeOrSaltyMeal: 'Unusually large or salty meal',
  other: 'Other',
};

export const weightEventLabel = (type: WeightEventType): string => labels[type];
