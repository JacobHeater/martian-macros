import type { HealthIntakeWriter } from '../healthIngest/HealthIntakeWriter';
import type { HealthWriteKind } from '../healthIngest/HealthWriteKind';
import type { HealthWriting } from '../healthIngest/HealthWriting';

/**
 * Where there is no health platform to write to: a browser, or a phone
 * without one (MM-70). Nothing can be turned on, and nothing is written.
 */
export class NoHealthWriting implements HealthWriting, HealthIntakeWriter {
  writing(): Promise<Set<HealthWriteKind>> {
    return Promise.resolve(new Set());
  }

  startWriting(): Promise<boolean> {
    return Promise.resolve(false);
  }

  stopWriting(): Promise<void> {
    return Promise.resolve();
  }

  writeNutrition(): Promise<boolean> {
    return Promise.resolve(false);
  }

  removeNutrition(): Promise<boolean> {
    return Promise.resolve(false);
  }

  writeWater(): Promise<boolean> {
    return Promise.resolve(false);
  }

  removeWater(): Promise<boolean> {
    return Promise.resolve(false);
  }
}
