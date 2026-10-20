import type { OnlineLookupChoice } from '../domain/food/online/OnlineLookupChoice';

const labels: Readonly<Record<OnlineLookupChoice, string>> = {
  ask: 'Ask each time',
  always: 'Always',
  never: 'Never',
};

/** The online lookup choice in words (MM-58), as Settings shows it. */
export const onlineLookupChoiceLabel = (choice: OnlineLookupChoice): string => labels[choice];
