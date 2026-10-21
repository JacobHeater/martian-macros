import type { BodyWeightRecord } from '../healthIngest/BodyWeightRecord';
import type { HealthIntakeWriter } from '../healthIngest/HealthIntakeWriter';
import type { HealthWeightWriter } from '../healthIngest/HealthWeightWriter';
import type { HealthWriteKind } from '../healthIngest/HealthWriteKind';
import type { HealthWriteNamespace } from '../healthIngest/HealthWriteNamespace';
import { healthWritePrefix } from '../healthIngest/healthWritePrefix';
import type { HealthWriting } from '../healthIngest/HealthWriting';
import type { NutritionRecord } from '../healthIngest/NutritionRecord';
import type { WaterRecord } from '../healthIngest/WaterRecord';

/**
 * A health platform's writing held in memory (MM-70, MM-314, MM-513):
 * which kinds are on, what the user answers when asked for each, and what
 * was written by id, as the platform would keep it. Everything is off
 * until asked for. A kind allowed once stays allowed when it is turned off,
 * as on a phone, so what was written of it can still be removed (MM-514).
 * Workouts are held by `InMemoryHealthWorkouts`, not here.
 */
export class InMemoryHealthWriting implements HealthWriting, HealthIntakeWriter, HealthWeightWriter, HealthWriteNamespace {
  /** The kinds the user allows when asked; the others are refused. */
  willPermit: Set<HealthWriteKind>;

  /** What is held on the platform, by the app's id for it. */
  readonly nutrition = new Map<string, NutritionRecord>();
  readonly water = new Map<string, WaterRecord>();
  readonly weight = new Map<string, BodyWeightRecord>();

  /** How many times the user was asked for each kind. */
  readonly asked = new Map<HealthWriteKind, number>();

  private readonly on = new Set<HealthWriteKind>();
  private readonly granted = new Set<HealthWriteKind>();
  private generation = 1;

  constructor({
    on = [],
    willPermit = ['food', 'water', 'weight', 'workouts'],
  }: { on?: readonly HealthWriteKind[]; willPermit?: readonly HealthWriteKind[] } = {}) {
    for (const kind of on) {
      this.on.add(kind);
      this.granted.add(kind);
    }
    this.willPermit = new Set(willPermit);
  }

  /** Numbered, so a test can tell one from the next (MM-522). */
  writeNamespace(): Promise<string> {
    return Promise.resolve(`ns${this.generation}`);
  }

  renewWriteNamespace(): Promise<void> {
    this.generation++;
    return Promise.resolve();
  }

  writing(): Promise<Set<HealthWriteKind>> {
    return Promise.resolve(new Set(this.on));
  }

  startWriting(kind: HealthWriteKind): Promise<boolean> {
    this.asked.set(kind, (this.asked.get(kind) ?? 0) + 1);
    if (this.willPermit.has(kind)) this.granted.add(kind);
    if (this.granted.has(kind)) this.on.add(kind);
    return Promise.resolve(this.on.has(kind));
  }

  stopWriting(kind: HealthWriteKind): Promise<void> {
    this.on.delete(kind);
    return Promise.resolve();
  }

  /** Removes every record of `kind` held under the app's prefix for it, in any namespace. */
  removeWritten(kind: HealthWriteKind): Promise<boolean> {
    if (!this.granted.has(kind)) return Promise.resolve(false);
    const held: Map<string, unknown> | undefined =
      kind === 'food' ? this.nutrition : kind === 'water' ? this.water : kind === 'weight' ? this.weight : undefined;
    for (const id of [...(held?.keys() ?? [])]) if (id.startsWith(healthWritePrefix[kind])) held?.delete(id);
    return Promise.resolve(true);
  }

  writeNutrition(record: NutritionRecord): Promise<boolean> {
    if (!this.on.has('food') || record.end.getTime() <= record.start.getTime()) return Promise.resolve(false);
    this.nutrition.set(record.id, record);
    return Promise.resolve(true);
  }

  removeNutrition(id: string): Promise<boolean> {
    if (!this.on.has('food')) return Promise.resolve(false);
    this.nutrition.delete(id);
    return Promise.resolve(true);
  }

  writeWater(record: WaterRecord): Promise<boolean> {
    if (!this.on.has('water') || !(record.ml > 0)) return Promise.resolve(false);
    this.water.set(record.id, record);
    return Promise.resolve(true);
  }

  removeWater(id: string): Promise<boolean> {
    if (!this.on.has('water')) return Promise.resolve(false);
    this.water.delete(id);
    return Promise.resolve(true);
  }

  writeWeight(record: BodyWeightRecord): Promise<boolean> {
    if (!this.on.has('weight') || !(record.kg > 0)) return Promise.resolve(false);
    this.weight.set(record.id, record);
    return Promise.resolve(true);
  }

  removeWeight(id: string): Promise<boolean> {
    if (!this.on.has('weight')) return Promise.resolve(false);
    this.weight.delete(id);
    return Promise.resolve(true);
  }
}
