import type { CalendarDate } from '../domain/CalendarDate';
import type { Pause } from '../domain/Pause';
import type { PauseWriter } from '../domain/repositories/PauseWriter';
import type { WeightEventWriter } from '../domain/repositories/WeightEventWriter';
import { pauseWeightEvents } from '../engine/pauseWeightEvents';

/**
 * Starts, extends and ends pauses (MM-148), keeping the weight events an
 * illness or injury pause records in step with it.
 */
export class PauseController {
  private readonly pauses: PauseWriter;
  private readonly weightEvents: WeightEventWriter;

  constructor({ pauses, weightEvents }: { pauses: PauseWriter; weightEvents: WeightEventWriter }) {
    this.pauses = pauses;
    this.weightEvents = weightEvents;
  }

  async start(pause: Pause): Promise<void> {
    await this.pauses.savePause(pause);
    for (const event of pauseWeightEvents(pause)) await this.weightEvents.saveWeightEvent(event);
  }

  /** Moves the end date `days` later. Allowed once per pause. */
  async extend(pause: Pause, { days = 7 }: { days?: number } = {}): Promise<void> {
    if (pause.extended) return;
    await this.start(pause.copyWith({ to: pause.to.addDays(days), extended: true }));
  }

  /**
   * Ends `pause` as of `today`: yesterday becomes its last day. One that
   * has not reached its second day is removed, with the events it recorded.
   */
  async endNow(pause: Pause, today: CalendarDate): Promise<void> {
    if (!pause.from.isBefore(today)) {
      for (const event of pauseWeightEvents(pause)) await this.weightEvents.deleteWeightEvent(event);
      await this.pauses.deletePause(pause);
      return;
    }
    if (pause.to.isBefore(today)) return;
    const shortened = pause.copyWith({ to: today.addDays(-1) });
    const kept = pauseWeightEvents(shortened);
    for (const event of pauseWeightEvents(pause)) {
      if (!kept.some((k) => k.date === event.date)) await this.weightEvents.deleteWeightEvent(event);
    }
    await this.pauses.savePause(shortened);
  }
}
