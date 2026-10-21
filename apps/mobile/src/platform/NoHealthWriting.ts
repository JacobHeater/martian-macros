import type { HealthIntakeWriter } from '../healthIngest/HealthIntakeWriter';
import type { HealthWeightWriter } from '../healthIngest/HealthWeightWriter';
import type { HealthWriteKind } from '../healthIngest/HealthWriteKind';
import type { HealthWriteNamespace } from '../healthIngest/HealthWriteNamespace';
import type { HealthWriting } from '../healthIngest/HealthWriting';

/**
 * Where there is no health platform to write to: a browser, or a phone
 * without one (MM-70, MM-513). Nothing can be turned on, and nothing is written.
 */
export class NoHealthWriting implements HealthWriting, HealthIntakeWriter, HealthWeightWriter, HealthWriteNamespace {
  /** Nothing is written here, so the namespace lives only as long as the page (MM-522). */
  private namespace = crypto.randomUUID();

  writeNamespace(): Promise<string> {
    return Promise.resolve(this.namespace);
  }

  renewWriteNamespace(): Promise<void> {
    this.namespace = crypto.randomUUID();
    return Promise.resolve();
  }

  writing(): Promise<Set<HealthWriteKind>> {
    return Promise.resolve(new Set());
  }

  startWriting(): Promise<boolean> {
    return Promise.resolve(false);
  }

  stopWriting(): Promise<void> {
    return Promise.resolve();
  }

  removeWritten(): Promise<boolean> {
    return Promise.resolve(false);
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

  writeWeight(): Promise<boolean> {
    return Promise.resolve(false);
  }

  removeWeight(): Promise<boolean> {
    return Promise.resolve(false);
  }
}
