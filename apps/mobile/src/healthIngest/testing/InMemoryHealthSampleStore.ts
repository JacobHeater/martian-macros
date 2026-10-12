import { byStartThenId } from '../byStartThenId';
import type { HealthDataType } from '../HealthDataType';
import type { HealthSample } from '../HealthSample';
import type { HealthSampleStore } from '../HealthSampleStore';

/** `HealthSampleStore` held in memory. */
export class InMemoryHealthSampleStore implements HealthSampleStore {
  private readonly byType = new Map<HealthDataType, Map<string, HealthSample>>();
  private readonly tokens = new Map<HealthDataType, string>();

  private of(type: HealthDataType): Map<string, HealthSample> {
    let stored = this.byType.get(type);
    if (stored === undefined) {
      stored = new Map();
      this.byType.set(type, stored);
    }
    return stored;
  }

  async samples(type: HealthDataType): Promise<HealthSample[]> {
    return [...this.of(type).values()].sort(byStartThenId);
  }

  async upsert(samples: readonly HealthSample[]): Promise<void> {
    for (const sample of samples) {
      this.of(sample.type).set(sample.platformId, sample);
    }
  }

  async delete(type: HealthDataType, platformIds: readonly string[]): Promise<void> {
    for (const id of platformIds) {
      this.of(type).delete(id);
    }
  }

  async replace(type: HealthDataType, samples: readonly HealthSample[]): Promise<void> {
    this.of(type).clear();
    await this.upsert(samples);
  }

  async token(type: HealthDataType): Promise<string | undefined> {
    return this.tokens.get(type);
  }

  async saveToken(type: HealthDataType, token: string): Promise<void> {
    this.tokens.set(type, token);
  }

  /** Forgets everything, as erasing the app's data does. */
  clear(): void {
    this.byType.clear();
    this.tokens.clear();
  }
}
