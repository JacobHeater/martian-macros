import type { InsightSnooze } from '../engine/InsightSnooze';
import type { InsightSnoozeRepository } from '../engine/InsightSnoozeRepository';
import type { Watched } from '../lang/Watched';
import type { AppDatabase } from './AppDatabase';
import { optionalDay, orNull, text } from './columns';
import { upsert } from './upsert';

/** `InsightSnoozeRepository` kept in the database. */
export class SqlInsightSnoozeRepository implements InsightSnoozeRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchInsightSnoozes(): Watched<InsightSnooze[]> {
    return this.db.watch(['inline_insight_snoozes'], async (db) =>
      (await db.select('SELECT * FROM inline_insight_snoozes ORDER BY kind, subject')).map((r) => ({
        kind: text(r, 'kind'),
        subject: text(r, 'subject'),
        item: text(r, 'item'),
        resumesOn: optionalDay(r, 'resumes_epoch_day'),
      })),
    );
  }

  saveInsightSnooze(snooze: InsightSnooze): Promise<void> {
    return this.db.write(['inline_insight_snoozes'], (db) =>
      upsert(db, 'inline_insight_snoozes', ['kind', 'subject'], {
        kind: snooze.kind,
        subject: snooze.subject,
        item: snooze.item,
        resumes_epoch_day: orNull(snooze.resumesOn?.epochDay),
      }),
    );
  }

  removeInsightSnooze(kind: string, subject: string): Promise<void> {
    return this.db.write(['inline_insight_snoozes'], (db) =>
      db.execute('DELETE FROM inline_insight_snoozes WHERE kind = ? AND subject = ?', [kind, subject]),
    );
  }
}
