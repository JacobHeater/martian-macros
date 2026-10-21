import type { BodyWeightRecord } from '../healthIngest/BodyWeightRecord';
import type { HealthIntakeWriter } from '../healthIngest/HealthIntakeWriter';
import type { HealthWeightWriter } from '../healthIngest/HealthWeightWriter';
import { HealthWriteKind } from '../healthIngest/HealthWriteKind';
import type { HealthWriteNamespace } from '../healthIngest/HealthWriteNamespace';
import { healthWritePrefix } from '../healthIngest/healthWritePrefix';
import type { HealthWriting } from '../healthIngest/HealthWriting';
import type { NutritionRecord } from '../healthIngest/NutritionRecord';
import type { WaterRecord } from '../healthIngest/WaterRecord';
import type { MmHealthNutrition } from './MmHealthNutrition';
import type { MmHealthWritingApi } from './MmHealthWritingApi';

/** The record as the plugin takes it: a nutrient not known is left out, never sent as zero. */
function nutrition(record: NutritionRecord): MmHealthNutrition {
  return {
    id: record.id,
    startMs: record.start.getTime(),
    endMs: record.end.getTime(),
    kcal: record.kcal,
    proteinG: record.proteinG,
    carbsG: record.carbsG,
    fatG: record.fatG,
    ...(record.name === undefined ? {} : { name: record.name }),
    ...(record.meal === undefined ? {} : { meal: record.meal }),
    ...(record.fiberG === undefined ? {} : { fiberG: record.fiberG }),
    ...(record.sugarsG === undefined ? {} : { sugarsG: record.sugarsG }),
    ...(record.saturatedFatG === undefined ? {} : { saturatedFatG: record.saturatedFatG }),
    ...(record.sodiumMg === undefined ? {} : { sodiumMg: record.sodiumMg }),
  };
}

/**
 * Writing food, water and weight to Health Connect or Apple Health (MM-70,
 * MM-314, MM-513), over the app's own plugin. Which kinds are on is kept by the
 * plugin, on the phone; each kind is asked for by itself. A write the
 * platform refuses is false here, and the entry in the app is the same
 * either way: the health app is told, never relied on. The write namespace
 * every id carries is the plugin's too (MM-522). Turned off, a kind's
 * records can be removed by the app's prefix for them (MM-514).
 */
export class NativeHealthWriting implements HealthWriting, HealthIntakeWriter, HealthWeightWriter, HealthWriteNamespace {
  private readonly api: MmHealthWritingApi;

  constructor(api: MmHealthWritingApi) {
    this.api = api;
  }

  async writing(): Promise<Set<HealthWriteKind>> {
    try {
      const { kinds } = await this.api.writing({ kinds: [...HealthWriteKind.values] });
      return new Set(HealthWriteKind.values.filter((kind) => kinds.includes(kind)));
    } catch {
      return new Set();
    }
  }

  async startWriting(kind: HealthWriteKind): Promise<boolean> {
    try {
      await this.api.startWriting({ kind });
    } catch {
      // Not asked, or not answered: what is on is what the plugin says next.
    }
    return (await this.writing()).has(kind);
  }

  /** Rejects when the plugin cannot say: nothing is written without a namespace (MM-522). */
  async writeNamespace(): Promise<string> {
    const { namespace } = await this.api.writeNamespace();
    if (namespace === '') throw new Error('The health plugin gave no write namespace.');
    return namespace;
  }

  async renewWriteNamespace(): Promise<void> {
    await this.api.renewWriteNamespace();
  }

  async stopWriting(kind: HealthWriteKind): Promise<void> {
    await this.api.stopWriting({ kind }).catch(() => undefined);
  }

  async removeWritten(kind: HealthWriteKind): Promise<boolean> {
    try {
      return (await this.api.removeWritten({ kind, prefix: healthWritePrefix[kind] })).removed;
    } catch {
      return false;
    }
  }

  /** Runs `step` only while `kind` is on; a refusal from the platform is false. */
  private async whileOn(kind: HealthWriteKind, step: () => Promise<boolean>): Promise<boolean> {
    if (!(await this.writing()).has(kind)) return false;
    try {
      return await step();
    } catch {
      return false;
    }
  }

  writeNutrition(record: NutritionRecord): Promise<boolean> {
    if (record.end.getTime() <= record.start.getTime()) return Promise.resolve(false);
    return this.whileOn('food', async () => (await this.api.writeNutrition(nutrition(record))).written);
  }

  removeNutrition(id: string): Promise<boolean> {
    return this.whileOn('food', async () => (await this.api.removeNutrition({ id })).removed);
  }

  writeWater(record: WaterRecord): Promise<boolean> {
    if (!(record.ml > 0)) return Promise.resolve(false);
    return this.whileOn(
      'water',
      async () => (await this.api.writeWater({ id: record.id, atMs: record.at.getTime(), ml: record.ml })).written,
    );
  }

  removeWater(id: string): Promise<boolean> {
    return this.whileOn('water', async () => (await this.api.removeWater({ id })).removed);
  }

  writeWeight(record: BodyWeightRecord): Promise<boolean> {
    if (!(record.kg > 0)) return Promise.resolve(false);
    return this.whileOn(
      'weight',
      async () => (await this.api.writeWeight({ id: record.id, atMs: record.at.getTime(), kg: record.kg })).written,
    );
  }

  removeWeight(id: string): Promise<boolean> {
    return this.whileOn('weight', async () => (await this.api.removeWeight({ id })).removed);
  }
}
