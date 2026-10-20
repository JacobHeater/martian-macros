import type { HealthDataType } from '../healthIngest';

const labels: Readonly<Record<HealthDataType, string>> = {
  weight: 'Weight',
  bodyFat: 'Body fat',
  leanMass: 'Lean mass',
  height: 'Height',
  workout: 'Exercise sessions',
  menstruation: 'Menstruation',
  steps: 'Steps',
  sleep: 'Sleep',
};

/** What the reading is called where the user allows it (MM-68). */
export const healthDataTypeLabel = (type: HealthDataType): string => labels[type];
