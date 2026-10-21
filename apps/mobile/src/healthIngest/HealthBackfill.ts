import type { HealthBackfillMarks } from './HealthBackfillMarks';
import type { HealthBackfillResult } from './HealthBackfillResult';
import type { HealthDataType } from './HealthDataType';
import type { HealthHistoryAccess } from './HealthHistoryAccess';
import type { HealthSampleStore } from './HealthSampleStore';
import type { HealthSource } from './HealthSource';

const dayMs = 24 * 60 * 60 * 1000;

/**
 * Reads a type's history from the platform, up to a year back (MM-73), so a
 * new user's trend starts settled.
 *
 * It reads backwards from now, a month at a time, and keeps each month's
 * readings in the same store the import keeps its own in, by platform id: a
 * reading the import already has is kept once, and the day's weigh-in is
 * chosen from all of them by the one rule of MM-71, the primary scale first
 * and a typed value over all. After each month it marks how far back it has
 * read, so a backfill cut short (the app sent to the back, the platform
 * refusing a read) goes on from there next time, and one that finished is
 * never done again.
 *
 * When the platform cannot be read it throws `HealthReadFailure`; every
 * month read before it is kept and marked.
 */
export class HealthBackfill {
  /** The kinds whose history is read (MM-73): what the trend and the body-fat estimate use. */
  static readonly types: readonly HealthDataType[] = ['weight', 'bodyFat', 'leanMass', 'menstruation'];

  /** How far back it reads. */
  static readonly days = 365;

  /** How much one read asks for. */
  static readonly chunkDays = 30;

  readonly source: Pick<HealthSource, 'permitted' | 'read'>;
  readonly history: HealthHistoryAccess;
  readonly store: Pick<HealthSampleStore, 'samples' | 'upsert'>;
  readonly marks: HealthBackfillMarks;

  constructor(init: {
    source: Pick<HealthSource, 'permitted' | 'read'>;
    history: HealthHistoryAccess;
    store: Pick<HealthSampleStore, 'samples' | 'upsert'>;
    marks: HealthBackfillMarks;
  }) {
    this.source = init.source;
    this.history = init.history;
    this.store = init.store;
    this.marks = init.marks;
  }

  /**
   * Reads what is left of `type`'s history as of `now`. `onMonth` is told
   * after each month is kept, with how much of the year has been read (0
   * to 1) and how many readings that month brought that were not kept
   * already.
   */
  async backfill(
    type: HealthDataType,
    {
      now,
      onMonth,
    }: { now: Date; onMonth?: (step: { type: HealthDataType; read: number; added: number }) => void },
  ): Promise<HealthBackfillResult> {
    if (!(await this.source.permitted()).has(type)) return { status: 'notPermitted', upserted: 0, added: 0 };
    const floor = now.getTime() - HealthBackfill.days * dayMs;
    const marked = await this.marks.backfilledFrom(type);
    // Asked only once something is left, so a finished backfill costs the platform nothing.
    if (marked !== undefined && marked.getTime() <= floor) return { status: 'done', upserted: 0, added: 0 };
    if (!(await this.history.historyPermitted())) return { status: 'noHistory', upserted: 0, added: 0 };

    const kept = new Set((await this.store.samples(type)).map((sample) => sample.platformId));
    let to = Math.min(marked?.getTime() ?? now.getTime(), now.getTime());
    let upserted = 0;
    let added = 0;
    while (to > floor) {
      const from = Math.max(to - HealthBackfill.chunkDays * dayMs, floor);
      const samples = await this.source.read(type, { from: new Date(from), to: new Date(to) });
      await this.store.upsert(samples);
      // After the readings, so a month cut short is read again, which changes nothing the second time.
      await this.marks.saveBackfilledFrom(type, new Date(from));
      const fresh = samples.filter((sample) => !kept.has(sample.platformId));
      for (const sample of fresh) kept.add(sample.platformId);
      upserted += samples.length;
      added += fresh.length;
      onMonth?.({ type, read: (now.getTime() - from) / (now.getTime() - floor), added: fresh.length });
      to = from;
    }
    return { status: 'done', upserted, added };
  }
}
