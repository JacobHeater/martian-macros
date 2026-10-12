import type { DetailLevel } from '../domain';

const labels: Readonly<Record<DetailLevel, string>> = {
  simple: 'Simple',
  standard: 'Standard',
  full: 'Full',
};

export const detailLevelLabel = (level: DetailLevel): string => labels[level];
