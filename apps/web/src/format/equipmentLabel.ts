import type { Equipment } from '../domain';

const labels: Readonly<Record<Equipment, string>> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  machine: 'Machine',
  cable: 'Cable',
  bodyweight: 'Bodyweight',
  other: 'Other',
};

export const equipmentLabel = (equipment: Equipment): string => labels[equipment];
