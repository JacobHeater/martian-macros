import type { HealthDataType } from '../healthIngest';

const purposes: Readonly<Record<HealthDataType, string>> = {
  weight: 'Weigh-ins from your scale, so you need not type them.',
  bodyFat: 'For the body-fat estimate.',
  leanMass: 'For the body-fat estimate.',
  height: 'To suggest a correction if it differs from your profile.',
  workout: 'When you trained, and for how long.',
  menstruation: 'To allow for water weight around your period.',
  steps: 'For context only. Never used to work out your calories.',
  sleep: 'Hours asleep each night, so the coach can tell when sleep runs short.',
};

/** What the app wants it for, in a sentence, said before it is asked for. */
export const healthDataTypePurpose = (type: HealthDataType): string => purposes[type];
