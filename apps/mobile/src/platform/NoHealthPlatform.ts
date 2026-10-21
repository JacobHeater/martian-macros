import { HealthChanges } from '../healthIngest/HealthChanges';
import type { DaySteps } from '../healthIngest/DaySteps';
import type { HealthDailySteps } from '../healthIngest/HealthDailySteps';
import type { HealthDataType } from '../healthIngest/HealthDataType';
import type { HealthHistoryAccess } from '../healthIngest/HealthHistoryAccess';
import type { HealthPermissionsPlace } from '../healthIngest/HealthPermissionsPlace';
import type { HealthSample } from '../healthIngest/HealthSample';
import type { HealthSource } from '../healthIngest/HealthSource';

/**
 * Where there is no health platform to read: a browser, or a build without
 * the Health Connect plugin. Nothing is available, so nothing is asked for
 * and nothing is read, history included (MM-73), and there is no screen of
 * permissions to open (MM-323).
 */
export class NoHealthPlatform implements HealthSource, HealthHistoryAccess, HealthDailySteps, HealthPermissionsPlace {
  available(): Promise<Set<HealthDataType>> {
    return Promise.resolve(new Set());
  }

  permitted(): Promise<Set<HealthDataType>> {
    return Promise.resolve(new Set());
  }

  requestPermission(): Promise<Set<HealthDataType>> {
    return Promise.resolve(new Set());
  }

  historyPermitted(): Promise<boolean> {
    return Promise.resolve(false);
  }

  requestHistory(): Promise<boolean> {
    return Promise.resolve(false);
  }

  stoppedAsking(): Promise<boolean> {
    return Promise.resolve(false);
  }

  openPermissions(): Promise<boolean> {
    return Promise.resolve(false);
  }

  read(): Promise<HealthSample[]> {
    return Promise.resolve([]);
  }

  changesSince(): Promise<HealthChanges> {
    return Promise.resolve(new HealthChanges({ nextToken: '' }));
  }

  dailySteps(): Promise<DaySteps[]> {
    return Promise.resolve([]);
  }
}
