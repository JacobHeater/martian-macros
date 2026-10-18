import type { CalendarDate } from '../domain/CalendarDate';
import { InsightArea } from '../domain/InsightArea';
import type { InlineInsightLogEntry } from '../engine/InlineInsightLogEntry';
import type { InlineInsightLogRepository } from '../engine/InlineInsightLogRepository';
import { ItemAnchorKind } from '../engine/ItemAnchorKind';
import type { Watched } from '../lang/Watched';
import type { AppDatabase } from './AppDatabase';
import { day, named, text } from './columns';

/** `InlineInsightLogRepository` kept in the database. */
export class SqlInlineInsightLogRepository implements InlineInsightLogRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchInlineInsightLog({ since }: { since: CalendarDate }): Watched<InlineInsightLogEntry[]> {
    return this.db.watch(['inline_insight_log'], async (db) =>
      (
        await db.select('SELECT * FROM inline_insight_log WHERE first_epoch_day >= ? ORDER BY first_epoch_day, id', [
          since.epochDay,
        ])
      ).map((r) => ({
        kind: text(r, 'kind'),
        area: named(InsightArea.values, r, 'area'),
        anchor: { kind: named(ItemAnchorKind.values, r, 'anchor_kind'), id: text(r, 'anchor_id') },
        item: text(r, 'item'),
        line: text(r, 'line'),
        firstShownOn: day(r, 'first_epoch_day'),
      })),
    );
  }

  recordInlineInsightShown(entry: InlineInsightLogEntry): Promise<void> {
    // The first showing of a kind under an item stands: a later one changes nothing.
    return this.db.write(['inline_insight_log'], (db) =>
      db.execute(
        'INSERT INTO inline_insight_log (kind, area, anchor_kind, anchor_id, item, line, first_epoch_day) ' +
          'VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (kind, anchor_kind, anchor_id) DO NOTHING',
        [entry.kind, entry.area, entry.anchor.kind, entry.anchor.id, entry.item, entry.line, entry.firstShownOn.epochDay],
      ),
    );
  }
}
