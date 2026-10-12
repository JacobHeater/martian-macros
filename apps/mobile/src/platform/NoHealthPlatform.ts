import { HealthChanges } from '../healthIngest/HealthChanges';
import type { HealthDataType } from '../healthIngest/HealthDataType';
import type { HealthSample } from '../healthIngest/HealthSample';
import type { HealthSource } from '../healthIngest/HealthSource';

/**
 * Where there is no health platform to read: a browser, or a build without
 * the Health Connect plugin. Nothing is available, so nothing is asked for
 * and nothing is read.
 */
export class NoHealthPlatform implements HealthSource {
  available(): Promise<Set<HealthDataType>> {
    return Promise.resolve(new Set());
  }

  permitted(): Promise<Set<HealthDataType>> {
    return Promise.resolve(new Set());
  }

  requestPermission(): Promise<Set<HealthDataType>> {
    return Promise.resolve(new Set());
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
