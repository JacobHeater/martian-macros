import type { Preparation } from '../domain';

const labels: Readonly<Record<Preparation, string>> = {
  raw: 'raw',
  cooked: 'cooked',
  packaged: 'as packaged',
};

/** The state a food was logged in, as it reads after an amount (MM-151): "200 g raw", "1 bar, as packaged". */
export const preparationLabel = (preparation: Preparation): string => labels[preparation];
