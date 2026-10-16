import type { HealthDataType } from '../healthIngest/HealthDataType';
import type { MmIconName } from '../ui/MmIconName';

/** The icon of each kind of reading on its Health Connect row (MM-320, the panel's PD-5). */
export const healthDataTypeIcon: Record<HealthDataType, MmIconName> = {
  weight: 'scale',
  bodyFat: 'percent',
  leanMass: 'body',
  height: 'ruler',
  workout: 'train',
  menstruation: 'calendar',
  steps: 'walk',
};
