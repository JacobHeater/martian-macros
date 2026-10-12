import type { DailyActivity } from '../domain';

const labels: Readonly<Record<DailyActivity, string>> = {
  seated: 'Mostly seated',
  light: 'Light movement',
  onFeet: 'On my feet most of the day',
  physicalJob: 'Physical job',
};

export const dailyActivityLabel = (activity: DailyActivity): string => labels[activity];
