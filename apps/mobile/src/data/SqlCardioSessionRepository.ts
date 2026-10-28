import type { CardioSessionRepository } from '../domain/repositories/CardioSessionRepository';
import { CardioActivity } from '../domain/training/CardioActivity';
import { CardioSession } from '../domain/training/CardioSession';
import type { Watched } from '../lang/Watched';
import type { AppDatabase } from './AppDatabase';
import { moment, named, text } from './columns';
import { upsert } from './upsert';

/**
 * `CardioSessionRepository` kept in the database (MM-677): a row for each
 * session the wearable recorded, keyed by the platform's id, so a re-read
 * changes it and never adds a second (MM-71).
 */
export class SqlCardioSessionRepository implements CardioSessionRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchCardioSessions(): Watched<CardioSession[]> {
    return this.db.watch(['cardio_sessions'], async (db) => {
      const rows = await db.select('SELECT * FROM cardio_sessions ORDER BY started_at_ms DESC, platform_id DESC');
      return rows.map(
        (row) =>
          new CardioSession({
            platformId: text(row, 'platform_id'),
            sourceName: text(row, 'source_name'),
            activity: named(CardioActivity.values, row, 'activity'),
            start: moment(row, 'started_at_ms'),
            end: moment(row, 'ended_at_ms'),
          }),
      );
    });
  }

  saveCardioSessions(sessions: readonly CardioSession[]): Promise<void> {
    if (sessions.length === 0) return Promise.resolve();
    return this.db.write(['cardio_sessions'], async (db) => {
      for (const session of sessions) {
        await upsert(db, 'cardio_sessions', ['platform_id'], {
          platform_id: session.platformId,
          source_name: session.sourceName,
          activity: session.activity,
          started_at_ms: session.start.getTime(),
          ended_at_ms: session.end.getTime(),
          date_epoch_day: session.date.epochDay,
        });
      }
    });
  }
}
