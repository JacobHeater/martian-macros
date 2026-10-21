import type { CalendarDate } from '../domain/CalendarDate';
import type { Clock } from '../domain/integration/Clock';
import type { WeightRepository } from '../domain/repositories/WeightRepository';
import type { WeightObservation } from '../domain/WeightObservation';
import type { HealthWeightWriter } from '../healthIngest/HealthWeightWriter';
import type { HealthWriteNamespace } from '../healthIngest/HealthWriteNamespace';
import type { Watched } from '../lang/Watched';
import { weightRecordId } from './weightRecordId';

/** The hour a weigh-in typed for an earlier day is written at: the app keeps its day, not its time. */
const earlierDayHour = 8;

/**
 * The weigh-ins typed in the app, told to the phone's health platform as
 * they change (MM-513): a weigh-in typed is written under its day's id, a
 * change replaces it, and one removed is removed there too. One typed for
 * today is written at the moment it is saved; one for an earlier day in
 * that day's morning. The app's log is saved first and is the same
 * whatever the platform does; writing only happens while writing weight
 * is on. A reading imported from the platform is kept elsewhere and never
 * passes through here, so it is never written back.
 */
export class MirroredWeightLog implements WeightRepository {
  private readonly log: WeightRepository;
  private readonly platform: HealthWeightWriter & HealthWriteNamespace;
  private readonly clock: Clock;

  constructor({
    log,
    platform,
    clock,
  }: {
    log: WeightRepository;
    platform: HealthWeightWriter & HealthWriteNamespace;
    clock: Clock;
  }) {
    this.log = log;
    this.platform = platform;
    this.clock = clock;
  }

  watchWeights(): Watched<WeightObservation[]> {
    return this.log.watchWeights();
  }

  async saveWeight(date: CalendarDate, weightKg: number): Promise<void> {
    await this.log.saveWeight(date, weightKg);
    await this.tell((namespace) =>
      this.platform.writeWeight({ id: weightRecordId(namespace, date), at: this.weighedAt(date), kg: weightKg }),
    );
  }

  async deleteWeight(date: CalendarDate): Promise<void> {
    await this.log.deleteWeight(date);
    await this.tell((namespace) => this.platform.removeWeight(weightRecordId(namespace, date)));
  }

  private weighedAt(date: CalendarDate): Date {
    if (date.epochDay === this.clock.today().epochDay) return this.clock.now();
    return new Date(date.year, date.month - 1, date.day, earlierDayHour, 0);
  }

  /** Tells the platform under this run's namespace (MM-522); a platform that fails changes nothing here. */
  private async tell(step: (namespace: string) => Promise<boolean>): Promise<boolean> {
    try {
      return await step(await this.platform.writeNamespace());
    } catch {
      return false;
    }
  }
}
