import { HealthChanges } from '../healthIngest/HealthChanges';
import type { HealthDataType } from '../healthIngest/HealthDataType';
import type { HealthHistoryAccess } from '../healthIngest/HealthHistoryAccess';
import type { HealthSample } from '../healthIngest/HealthSample';
import type { HealthSource } from '../healthIngest/HealthSource';

/**
 * Where there is no health platform to read: a browser, or a build without
 * the Health Connect plugin. Nothing is available, so nothing is asked for
 * and nothing is read, history included (MM-73).
 */
export class NoHealthPlatform implements HealthSource, HealthHistoryAccess {
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

  read(): Promise<HealthSample[]> {
    return Promise.resolve([]);
  }

  changesSince(): Promise<HealthChanges> {
    return Promise.resolve(new HealthChanges({ nextToken: '' }));
  }

  writeNutrition(): Promise<boolean> {
    return Promise.resolve(false);
  }
}
