import type { CalendarDate } from '../domain/CalendarDate';
import type { InsightLogEntry } from '../engine/InsightLogEntry';
import type { InsightLogRepository } from '../engine/InsightLogRepository';
import { InsightRule } from '../engine/InsightRule';
import type { Watched } from '../lang/Watched';
import type { AppDatabase } from './AppDatabase';
import { day, integer, named, optionalDay } from './columns';
import { insert } from './statements';

/** `InsightLogRepository` kept in the database. */
export class SqlInsightLogRepository implements InsightLogRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchInsightLog(): Watched<InsightLogEntry[]> {
    return this.db.watch(['insight_log'], async (db) =>
      (await db.select('SELECT * FROM insight_log ORDER BY shown_epoch_day, id')).map((r) => ({
        rule: named(InsightRule.values, r, 'rule'),
        shownOn: day(r, 'shown_epoch_day'),
        dismissedOn: optionalDay(r, 'dismissed_epoch_day'),
      })),
    );
  }

  async recordInsightShown(rule: InsightRule, shownOn: CalendarDate): Promise<void> {
    await this.db.write(['insight_log'], (db) => insert(db, 'insight_log', { rule, shown_epoch_day: shownOn.epochDay }));
  }

  dismissInsight(rule: InsightRule, dismissedOn: CalendarDate): Promise<void> {
    return this.db.write(['insight_log'], async (db) => {
      const latest = (
        await db.select('SELECT id FROM insight_log WHERE rule = ? ORDER BY shown_epoch_day DESC, id DESC LIMIT 1', [rule])
      )[0];
      if (latest === undefined) return;
      await db.execute('UPDATE insight_log SET dismissed_epoch_day = ? WHERE id = ?', [
        dismissedOn.epochDay,
        integer(latest, 'id'),
      ]);
    });
  }
}
