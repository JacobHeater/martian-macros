import type { HealthIntakeWriter } from '../healthIngest/HealthIntakeWriter';
import type { HealthWriteKind } from '../healthIngest/HealthWriteKind';
import type { HealthWriting } from '../healthIngest/HealthWriting';
import type { NutritionRecord } from '../healthIngest/NutritionRecord';
import type { WaterRecord } from '../healthIngest/WaterRecord';

/**
 * A health platform's writing held in memory (MM-70, MM-314): which kinds
 * are on, what the user answers when asked for each, and what was written
 * by id, as the platform would keep it. Everything is off until asked for.
 */
export class InMemoryHealthWriting implements HealthWriting, HealthIntakeWriter {
  /** The kinds the user allows when asked; the others are refused. */
  willPermit: Set<HealthWriteKind>;

  /** What is held on the platform, by the app's id for it. */
  readonly nutrition = new Map<string, NutritionRecord>();
  readonly water = new Map<string, WaterRecord>();

  /** How many times the user was asked for each kind. */
  readonly asked = new Map<HealthWriteKind, number>();

  private readonly on = new Set<HealthWriteKind>();

  constructor({
    on = [],
    willPermit = ['food', 'water', 'workouts'],
  }: { on?: readonly HealthWriteKind[]; willPermit?: readonly HealthWriteKind[] } = {}) {
    for (const kind of on) this.on.add(kind);
    this.willPermit = new Set(willPermit);
  }

  writing(): Promise<Set<HealthWriteKind>> {
    return Promise.resolve(new Set(this.on));
  }

  startWriting(kind: HealthWriteKind): Promise<boolean> {
    this.asked.set(kind, (this.asked.get(kind) ?? 0) + 1);
    if (this.willPermit.has(kind)) this.on.add(kind);
    return Promise.resolve(this.on.has(kind));
  }

  stopWriting(kind: HealthWriteKind): Promise<void> {
    this.on.delete(kind);
    return Promise.resolve();
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
}
